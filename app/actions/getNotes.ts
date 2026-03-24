'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getAnonymousNameByDepartment } from "@/lib/anonymization"
import type { NoteLetterGrade, Prisma } from "@prisma/client"
import { averageScoreToLetter } from "@/lib/noteGrades"

export type ExploreNoteFilters = {
    searchQuery?: string
    universityId?: string
    facultyId?: string
    departmentId?: string
    year?: string
}

export async function getNotes(filters: ExploreNoteFilters = {}) {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    const where: Prisma.NoteWhereInput = {
        status: 'APPROVED',
        deletedAt: null,
    }

    if (filters.universityId) {
        where.universityId = filters.universityId
    }
    if (filters.facultyId) {
        where.facultyId = filters.facultyId
    }
    if (filters.departmentId) {
        where.departmentId = filters.departmentId
    }

    const q = filters.searchQuery?.trim()
    if (q) {
        where.OR = [
            { title: { contains: q, mode: 'insensitive' } },
            { courseName: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
        ]
    }

    if (filters.year) {
        where.term = { contains: filters.year }
    }

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
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
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
