import { prisma } from "@/lib/prisma"

export type ValidatedAcademic = {
    universityId: string
    facultyId: string
    departmentId: string
    university: string
    faculty: string
    department: string
}

export async function validateAcademicSelection(
    universityId: string,
    facultyId: string,
    departmentId: string,
): Promise<ValidatedAcademic | null> {
    if (!universityId || !facultyId || !departmentId) return null

    const uni = await prisma.university.findFirst({
        where: { id: universityId, isActive: true },
    })
    if (!uni) return null

    const dep = await prisma.department.findUnique({
        where: { id: departmentId },
        include: { faculty: true },
    })
    if (!dep || dep.facultyId !== facultyId) return null

    return {
        universityId: uni.id,
        facultyId: dep.faculty.id,
        departmentId: dep.id,
        university: uni.name,
        faculty: dep.faculty.name,
        department: dep.name,
    }
}
