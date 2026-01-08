'use server'

import { prisma } from "@/lib/prisma"
import { validateTCKN, validatePassword, validateEmail } from "@/lib/validation"
import bcrypt from "bcryptjs"

export type RegistrationDat = {
    firstName: string
    lastName: string
    birthYear: number
    tcIdentityNo: string
    university: string
    programLevel: string
    faculty: string
    department: string
    studentClass: string
    studentNumber: string
    email: string
    password: string
    marketingConsent: boolean
    privacyConsent: boolean
    studentIdCardUrl: string
}

export async function registerUser(data: RegistrationDat) {
    try {
        // 1. Consent Check
        if (!data.privacyConsent) {
            return { success: false, message: "KVKK ve Aydınlatma Metni'ni onaylamanız gerekmektedir." }
        }

        // 2. Format Valdation
        if (!validateEmail(data.email)) {
            return { success: false, message: "Geçersiz email adresi." }
        }

        const passwordCheck = validatePassword(data.password)
        if (!passwordCheck.isValid) {
            return { success: false, message: passwordCheck.message }
        }

        // 3. Mock Identity Validation (Format only)
        /* 
        KPS Validation Disabled for now.
        const isIdentityValid = await validateTCKN(
            data.tcIdentityNo,
            data.firstName,
            data.lastName,
            data.birthYear
        );

        if (!isIdentityValid) {
            return { success: false, message: "TC Kimlik No formatı geçersiz." }
        }
        */

        // 4. Duplicate Check
        const existingUserEmail = await prisma.user.findUnique({ where: { email: data.email } })
        if (existingUserEmail) {
            return { success: false, message: "Bu email adresi ile kayıtlı bir kullanıcı zaten var." }
        }

        const existingUserTC = await prisma.user.findUnique({ where: { tcIdentityNo: data.tcIdentityNo.trim() } })
        if (existingUserTC) {
            return { success: false, message: "Bu TC Kimlik No ile kayıtlı bir kullanıcı zaten var." }
        }

        // Student Number unique check?
        const existingStudentNumber = await prisma.user.findUnique({ where: { studentNumber: data.studentNumber.trim() } })
        if (existingStudentNumber) {
            return { success: false, message: "Bu öğrenci numarası ile kayıtlı bir kullanıcı zaten var." }
        }

        // 5. Create User
        const hashedPassword = await bcrypt.hash(data.password, 10)

        // Ensure Uppercase for Identity (Mocking what NVI would have enforced)
        const finalFirstName = data.firstName.trim().toLocaleUpperCase('tr-TR');
        const finalLastName = data.lastName.trim().toLocaleUpperCase('tr-TR');

        // If uni/faculty were IDs, we might want to fetch names, but we'll store what we got.
        // For Step 3 dropdowns, we are getting IDs for Uni/Faculty. We should resolve them to names or store IDs.
        // Prompt says "Universities, Faculties, Departments tables... populate with seed... user table store string".
        // Let's assume we store the strings. So we need to fetch the names if IDs are sent.
        // To simplify, let's look up the names if they look like CUIDs, or just trust the client sent names from select? 
        // Actually, the select component sends values. My fetcher sends IDs as value.
        // So we need to resolve IDs to names here OR update fetcher to return Name as value.
        // Let's resolve here to be safe, or update schema to relate. 
        // Plan said: "Store academic info as Strings".

        let uniName = data.university;
        let facName = data.faculty;

        // Simple heuristic: if it looks like CUID (25 chars alphanumeric), resolve it.
        if (uniName.length === 25) {
            const u = await prisma.university.findUnique({ where: { id: uniName } });
            if (u) uniName = u.name;
        }
        if (facName.length === 25) {
            const f = await prisma.faculty.findUnique({ where: { id: facName } });
            if (f) facName = f.name;
        }

        const newUser = await prisma.user.create({
            data: {
                firstName: finalFirstName,
                lastName: finalLastName,
                birthYear: Number(data.birthYear),
                tcIdentityNo: data.tcIdentityNo.trim(),
                university: uniName,
                programLevel: data.programLevel,
                faculty: facName,
                department: data.department,
                studentClass: data.studentClass,
                studentNumber: data.studentNumber,
                email: data.email.trim(),
                password: hashedPassword,
                marketingConsent: data.marketingConsent,
                role: "USER",
                studentIdCardUrl: data.studentIdCardUrl,
                approvalStatus: "PENDING"
            }
        })

        return { success: true, message: "Kayıt başarılı!", userId: newUser.id }

    } catch (error: any) {
        console.error("Registration Error:", error)
        return { success: false, message: "Bir hata oluştu: " + (error.message || "Bilinmeyen hata") }
    }
}

export async function validateIdentityAction(data: { tcIdentityNo: string, firstName: string, lastName: string, birthYear: number }) {
    try {
        // Only mocks format validation now
        const isValid = await validateTCKN(data.tcIdentityNo, data.firstName, data.lastName, data.birthYear)

        if (!isValid) {
            return { success: false, message: "Kimlik bilgileri formatı hatalı." }
        }

        // Check usage
        const existingUserTC = await prisma.user.findUnique({ where: { tcIdentityNo: data.tcIdentityNo.trim() } })
        if (existingUserTC) {
            return { success: false, message: "Bu TC Kimlik No ile kayıtlı bir kullanıcı zaten var." }
        }

        return { success: true }
    } catch (error) {
        console.error("Identity Validation Action Error:", error)
        return { success: false, message: "Doğrulama servisine erişilemedi." }
    }
}

export async function checkStudentNumber(studentNumber: string) {
    try {
        const existingUser = await prisma.user.findUnique({
            where: { studentNumber: studentNumber.trim() }
        });
        if (existingUser) {
            return { available: false, message: "Bu öğrenci numarası ile kayıtlı bir kullanıcı zaten var." };
        }
        return { available: true };
    } catch (error) {
        console.error("Check Student Number Error:", error);
        return { available: false, message: "Kontrol sırasında hata oluştu." };
    }
}
