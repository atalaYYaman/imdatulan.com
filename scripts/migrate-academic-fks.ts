/**
 * After migration + seed: backfill User.universityId / facultyId / departmentId
 * and Note.* from legacy string fields using FACULTY_ALIASES / DEPARTMENT_ALIASES.
 *
 * Run: npx tsx scripts/migrate-academic-fks.ts
 */
import { PrismaClient } from "@prisma/client"
import {
    ACADEMIC_TREE,
    DEPARTMENT_ALIASES,
    FACULTY_ALIASES,
} from "../lib/academicMaster"

const prisma = new PrismaClient()

function buildDeptToFaculty(): Map<string, string> {
    const m = new Map<string, string>()
    for (const { faculty, departments } of ACADEMIC_TREE) {
        for (const d of departments) {
            if (!m.has(d)) m.set(d, faculty)
        }
    }
    return m
}

function canonFaculty(raw: string | null | undefined): string | null {
    const t = (raw || "").trim()
    if (!t) return null
    return FACULTY_ALIASES[t] ?? t
}

function canonDept(raw: string | null | undefined): string | null {
    const t = (raw || "").trim()
    if (!t) return null
    return DEPARTMENT_ALIASES[t] ?? t
}

async function main() {
    const deptToFaculty = buildDeptToFaculty()

    const universities = await prisma.university.findMany()
    const uniByName = new Map(universities.map((u) => [u.name, u.id]))

    const faculties = await prisma.faculty.findMany()
    const facByName = new Map(faculties.map((f) => [f.name, f.id]))

    const departments = await prisma.department.findMany({
        include: { faculty: { select: { name: true } } },
    })
    const deptKey = (facultyName: string, deptName: string) =>
        `${facultyName}\0${deptName}`
    const deptByFacultyAndName = new Map(
        departments.map((d) => [deptKey(d.faculty.name, d.name), d.id]),
    )

    function resolveIds(
        uniName: string | null | undefined,
        facRaw: string | null | undefined,
        deptRaw: string | null | undefined,
    ): { universityId: string | null; facultyId: string | null; departmentId: string | null } {
        const universityId = uniName?.trim()
            ? uniByName.get(uniName.trim()) ?? null
            : null
        const dName = canonDept(deptRaw)
        let facultyName: string | null = null
        if (dName) {
            facultyName = deptToFaculty.get(dName) ?? null
        }
        if (!facultyName) {
            facultyName = canonFaculty(facRaw)
        }
        const facultyId = facultyName ? facByName.get(facultyName) ?? null : null
        let departmentId: string | null = null
        if (dName && facultyName) {
            departmentId =
                deptByFacultyAndName.get(deptKey(facultyName, dName)) ?? null
        }
        if (!departmentId && dName) {
            for (const f of faculties) {
                const id = deptByFacultyAndName.get(deptKey(f.name, dName))
                if (id) {
                    departmentId = id
                    break
                }
            }
        }
        return { universityId, facultyId, departmentId }
    }

    const users = await prisma.user.findMany({
        select: {
            id: true,
            university: true,
            faculty: true,
            department: true,
        },
    })
    let uOk = 0
    for (const u of users) {
        const { universityId, facultyId, departmentId } = resolveIds(
            u.university,
            u.faculty,
            u.department,
        )
        const data: Record<string, unknown> = {
            universityId,
            facultyId,
            departmentId,
        }
        if (universityId) {
            const un = universities.find((x) => x.id === universityId)
            if (un) data.university = un.name
        }
        if (facultyId) {
            const f = faculties.find((x) => x.id === facultyId)
            if (f) data.faculty = f.name
        }
        if (departmentId) {
            const d = departments.find((x) => x.id === departmentId)
            if (d) data.department = d.name
        }
        await prisma.user.update({
            where: { id: u.id },
            data: data as any,
        })
        uOk++
    }
    console.log(`Updated ${uOk} users`)

    const notes = await prisma.note.findMany({
        select: {
            id: true,
            university: true,
            faculty: true,
            department: true,
        },
    })
    let nOk = 0
    for (const n of notes) {
        const { universityId, facultyId, departmentId } = resolveIds(
            n.university,
            n.faculty,
            n.department,
        )
        const data: Record<string, unknown> = {
            universityId,
            facultyId,
            departmentId,
        }
        if (universityId) {
            const un = universities.find((x) => x.id === universityId)
            if (un) data.university = un.name
        }
        if (facultyId) {
            const f = faculties.find((x) => x.id === facultyId)
            if (f) data.faculty = f.name
        }
        if (departmentId) {
            const d = departments.find((x) => x.id === departmentId)
            if (d) data.department = d.name
        }
        await prisma.note.update({
            where: { id: n.id },
            data: data as any,
        })
        nOk++
    }
    console.log(`Updated ${nOk} notes`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
