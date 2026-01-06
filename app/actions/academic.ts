'use server'

import { prisma } from "@/lib/prisma"

export async function getUniversities() {
    const unis = await prisma.university.findMany({
        orderBy: { name: 'asc' }
    });
    // disabled if not active
    return unis.map(u => ({ label: u.name, value: u.id, disabled: !u.isActive }));
}

export async function getFaculties(universityId: string) {
    if (!universityId) return [];

    // Check if universityId is actually a name string (from the selects value not being ID)
    // Wait, value was university.id

    const faculties = await prisma.faculty.findMany({
        where: { universityId: universityId },
        orderBy: { name: 'asc' }
    });
    return faculties.map(f => ({ label: f.name, value: f.id }));
}

export async function getDepartments(facultyId: string) {
    if (!facultyId) return [];

    const departments = await prisma.department.findMany({
        where: { facultyId: facultyId },
        orderBy: { name: 'asc' }
    });
    return departments.map(d => ({ label: d.name, value: d.name })); // Returning name as value for departments to store string
}
