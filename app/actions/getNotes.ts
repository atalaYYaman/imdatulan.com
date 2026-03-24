'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getAnonymousNameByDepartment } from "@/lib/anonymization"
import type { NoteLetterGrade } from "@prisma/client"
import { averageScoreToLetter } from "@/lib/noteGrades"

export async function getNotes() {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    try {
        const notes = await prisma.note.findMany({
            where: {
                status: 'APPROVED',
                deletedAt: null
            },
            select: {
                id: true,
                title: true,
                description: true,
                courseName: true,
                university: true,
                faculty: true,
                department: true,
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
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        const ids = notes.map((n) => n.id)
        // NoteGrade sorgusu migrasyon öncesi/başarısız olursa hata verir; not listesini boş döndürmemek için ayrı yakalanır.
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

        // UI'ye sadece anonim isim ve temel uploader bilgisi gönderilir.
        return notes.map((note) => {
            const r = gradeByNote.get(note.id)
            return {
                ...note,
                uploader: {
                    id: note.uploader.id,
                    department: note.uploader.department,
                    anonymousName: getAnonymousNameByDepartment(
                        note.uploader.department
                    ),
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
