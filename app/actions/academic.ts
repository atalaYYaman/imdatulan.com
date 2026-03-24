'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { validateAcademicSelection as validateAcademicSelectionImpl } from "@/lib/academicValidation"

export async function getUniversities() {
    const unis = await prisma.university.findMany({
        orderBy: { name: 'asc' }
    })
    return unis.map(u => ({ label: u.name, value: u.id, disabled: !u.isActive }))
}

/** Global faculty list (same for all universities). */
export async function getFaculties() {
    const faculties = await prisma.faculty.findMany({
        orderBy: { name: 'asc' }
    })
    return faculties.map(f => ({ label: f.name, value: f.id }))
}

export async function getDepartments(facultyId: string) {
    if (!facultyId) return []

    const departments = await prisma.department.findMany({
        where: { facultyId: facultyId },
        orderBy: { name: 'asc' }
    })
    return departments.map(d => ({ label: d.name, value: d.id }))
}

/** Flat list for explore filters (optional faculty narrowing on the client). */
export async function getAllDepartmentsForFilter() {
    const rows = await prisma.department.findMany({
        orderBy: [{ faculty: { name: "asc" } }, { name: "asc" }],
        include: { faculty: { select: { id: true, name: true } } },
    })
    return rows.map((d) => ({
        label: `${d.faculty.name} — ${d.name}`,
        value: d.id,
        facultyId: d.facultyId,
    }))
}

export async function validateAcademicSelection(
    universityId: string,
    facultyId: string,
    departmentId: string,
) {
    return validateAcademicSelectionImpl(universityId, facultyId, departmentId)
}

/** Logged-in user's saved academic IDs (for upload defaults). */
export async function getCurrentUserAcademic() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return null

    return prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            universityId: true,
            facultyId: true,
            departmentId: true,
            university: true,
            faculty: true,
            department: true,
        },
    })
}
