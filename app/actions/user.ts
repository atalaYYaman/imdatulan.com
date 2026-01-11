'use server'

import { prisma } from "@/lib/prisma"
import { validateTCKN, validatePassword, validateEmail } from "@/lib/validation"
import bcrypt from "bcryptjs"

export type RegistrationDat = {
    firstName: string
    lastName: string
    birthYear?: number
    tcIdentityNo?: string
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

import { headers } from "next/headers"
import { checkRateLimit } from "@/lib/rate-limit"

export async function registerUser(data: RegistrationDat) {
    try {
        // --- RATE LIMIT CHECK (Anti-Bot) ---
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for") || "unknown";

        // Limit: 3 registrations per hour per IP
        const limitCheck = await checkRateLimit(`register_${ip}`, 3, 3600);
        if (!limitCheck.success) {
            return { success: false, message: "Çok fazla kayıt denemesi yapıldı. Lütfen 1 saat sonra tekrar deneyiniz." };
        }
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

        // 3. User Existence Check
        const existingUser = await prisma.user.findUnique({ where: { email: data.email } })

        const hashedPassword = await bcrypt.hash(data.password, 10)

        // Prepare Data (Common)
        const finalFirstName = data.firstName.trim().toLocaleUpperCase('tr-TR');
        const finalLastName = data.lastName.trim().toLocaleUpperCase('tr-TR');

        let uniName = data.university;
        let facName = data.faculty;
        if (uniName.length === 25) {
            const u = await prisma.university.findUnique({ where: { id: uniName } });
            if (u) uniName = u.name;
        }
        if (facName.length === 25) {
            const f = await prisma.faculty.findUnique({ where: { id: facName } });
            if (f) facName = f.name;
        }

        const userDataPayload = {
            firstName: finalFirstName,
            lastName: finalLastName,
            university: uniName,
            programLevel: data.programLevel,
            faculty: facName,
            department: data.department,
            studentClass: data.studentClass,
            studentNumber: data.studentNumber,
            password: hashedPassword,
            marketingConsent: data.marketingConsent,
            studentIdCardUrl: data.studentIdCardUrl,
            approvalStatus: "PENDING"
        };

        // 4. Duplicate / Re-registration Logic
        if (existingUser) {
            if (existingUser.approvalStatus === "BANNED") {
                return { success: false, message: "Bu email adresi yasaklanmıştır." };
            }

            if (existingUser.approvalStatus === "REJECTED") {
                // RE-REGISTER: Update existing user

                // Check if new student number is taken (by someone else)
                const studentNumCheck = await prisma.user.findUnique({ where: { studentNumber: data.studentNumber.trim() } });
                if (studentNumCheck && studentNumCheck.id !== existingUser.id) {
                    return { success: false, message: "Bu öğrenci numarası başkası tarafından kullanılıyor." };
                }

                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: userDataPayload
                });

                return { success: true, message: "Başvurunuz güncellendi ve tekrar onaya gönderildi.", userId: existingUser.id };
            }

            // If APPROVED or PENDING
            return { success: false, message: "Bu email adresi ile kayıtlı bir kullanıcı zaten var." };
        }

        // 5. New Registration Logic
        // Student Number unique check
        const existingStudentNumber = await prisma.user.findUnique({ where: { studentNumber: data.studentNumber.trim() } })
        if (existingStudentNumber) {
            return { success: false, message: "Bu öğrenci numarası ile kayıtlı bir kullanıcı zaten var." }
        }

        const newUser = await prisma.user.create({
            data: {
                ...userDataPayload,
                email: data.email.trim(),
                role: "USER"
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
