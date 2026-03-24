'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getAnonymousNameByDepartment } from "@/lib/anonymization"
import type { NoteLetterGrade, Prisma } from "@prisma/client"
import { averageScoreToLetter } from "@/lib/noteGrades"
import { NOTE_CONTENT_TYPES } from "@/lib/noteMetadata"

export type ExploreNoteFilters = {
    searchQuery?: string
    universityId?: string
    facultyId?: string
    departmentId?: string
    year?: string
    /** Tam eşleşme — NOTE_CONTENT_TYPES ile uyumlu */
    noteType?: string
    /** true: yalnızca AI işaretli; false: yalnızca AI yok; atlanırsa tümü */
    isAI?: boolean
    /** 1–5 süt; atlanırsa tümü */
    price?: number
}

function yearWhereClause(year: string): Prisma.NoteWhereInput {
    if (year === "Daha Eski") {
        return {
            OR: [
                { term: null },
                { term: "" },
                {
                    AND: [
                        { NOT: { term: { contains: "2025", mode: "insensitive" } } },
                        { NOT: { term: { contains: "2024", mode: "insensitive" } } },
                        { NOT: { term: { contains: "2023", mode: "insensitive" } } },
                        { NOT: { term: { contains: "2022", mode: "insensitive" } } },
                    ],
                },
            ],
        }
    }
    const m = /^(\d{4})-(\d{4})$/.exec(year.trim())
    if (m) {
        return {
            OR: [
                { term: { contains: m[1], mode: "insensitive" } },
                { term: { contains: m[2], mode: "insensitive" } },
                { term: { contains: year, mode: "insensitive" } },
            ],
        }
    }
    return { term: { contains: year, mode: "insensitive" } }
}

export async function getNotes(filters: ExploreNoteFilters = {}) {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    const clauses: Prisma.NoteWhereInput[] = [
        { status: "APPROVED", deletedAt: null },
    ]

    if (filters.universityId) {
        const uni = await prisma.university.findUnique({
            where: { id: filters.universityId },
            select: { name: true },
        })
        if (uni) {
            clauses.push({
                OR: [
                    { universityId: filters.universityId },
                    {
                        AND: [
                            { universityId: null },
                            { university: uni.name },
                        ],
                    },
                ],
            })
        }
    }

    if (filters.facultyId) {
        const fac = await prisma.faculty.findUnique({
            where: { id: filters.facultyId },
            select: { name: true },
        })
        if (fac) {
            clauses.push({
                OR: [
                    { facultyId: filters.facultyId },
                    {
                        AND: [
                            { facultyId: null },
                            { faculty: fac.name },
                        ],
                    },
                ],
            })
        }
    }

    if (filters.departmentId) {
        const dep = await prisma.department.findUnique({
            where: { id: filters.departmentId },
            select: { name: true },
        })
        if (dep) {
            clauses.push({
                OR: [
                    { departmentId: filters.departmentId },
                    {
                        AND: [
                            { departmentId: null },
                            { department: dep.name },
                        ],
                    },
                ],
            })
        }
    }

    const q = filters.searchQuery?.trim()
    if (q) {
        clauses.push({
            OR: [
                { title: { contains: q, mode: "insensitive" } },
                { courseName: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { type: { contains: q, mode: "insensitive" } },
                { university: { contains: q, mode: "insensitive" } },
                { faculty: { contains: q, mode: "insensitive" } },
                { department: { contains: q, mode: "insensitive" } },
            ],
        })
    }

    if (filters.year) {
        clauses.push(yearWhereClause(filters.year))
    }

    if (filters.noteType) {
        const allowed = NOTE_CONTENT_TYPES as readonly string[]
        if (allowed.includes(filters.noteType)) {
            clauses.push({
                type: { equals: filters.noteType, mode: "insensitive" },
            })
        }
    }

    if (filters.isAI === true) {
        clauses.push({ isAI: true })
    } else if (filters.isAI === false) {
        clauses.push({ isAI: false })
    }

    if (
        filters.price != null &&
        Number.isFinite(filters.price) &&
        filters.price >= 1 &&
        filters.price <= 5
    ) {
        clauses.push({ price: filters.price })
    }

    const where: Prisma.NoteWhereInput =
        clauses.length === 1 ? clauses[0]! : { AND: clauses }

    try {
        const notes = await prisma.note.findMany({
            where,
            select: {
                id: true,
                title: true,
                description: true,
                courseName: true,
                university: true,
                faculty: true,
                department: true,
                universityId: true,
                facultyId: true,
                departmentId: true,
                term: true,
                type: true,
                price: true,
                isAI: true,
                createdAt: true,
                uploaderId: true,
                viewCount: true,
                pageCount: true,
                status: true,
                uploader: {
                    select: {
                        id: true,
                        department: true,
                        departmentLink: { select: { name: true } },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        const ids = notes.map((n) => n.id)
        type GradeAggRow = {
            noteId: string
            _count: number | { _all: number }
            _avg: { score: number | null } | null
        }
        let gradeAggs: GradeAggRow[] = []
        if (ids.length > 0) {
            try {
                const gradeDelegate = prisma.noteGrade as unknown as {
                    groupBy: (args: {
                        by: ["noteId"]
                        where: { noteId: { in: string[] } }
                        _avg: { score: true }
                        _count: true
                    }) => Promise<GradeAggRow[]>
                }
                gradeAggs = await gradeDelegate.groupBy({
                    by: ["noteId"],
                    where: { noteId: { in: ids } },
                    _avg: { score: true },
                    _count: true,
                })
            } catch (gradeErr) {
                console.error(
                    "getNotes: NoteGrade groupBy başarısız (migration gerekli olabilir):",
                    gradeErr
                )
            }
        }
        const gradeByNote = new Map<
            string,
            { count: number; averageScore: number | null; letter: NoteLetterGrade | null }
        >()
        for (const g of gradeAggs) {
            const count =
                typeof g._count === "number"
                    ? g._count
                    : g._count?._all ?? 0
            const avg =
                count > 0 && g._avg?.score != null ? g._avg.score : null
            gradeByNote.set(g.noteId, {
                count,
                averageScore: avg,
                letter: avg != null ? averageScoreToLetter(avg) : null,
            })
        }

        return notes.map((note) => {
            const r = gradeByNote.get(note.id)
            const deptLabel =
                note.uploader.departmentLink?.name ?? note.uploader.department ?? ""
            return {
                ...note,
                uploader: {
                    id: note.uploader.id,
                    department: deptLabel,
                    anonymousName: getAnonymousNameByDepartment(deptLabel),
                },
                rating: r ?? {
                    count: 0,
                    averageScore: null,
                    letter: null,
                },
            }
        })
    } catch (error) {
        console.error("Failed to fetch notes:", error)
        return []
    }
}
