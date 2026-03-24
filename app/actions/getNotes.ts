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
        const gradeAggs =
            ids.length === 0
                ? []
                : await prisma.noteGrade.groupBy({
                      by: ["noteId"],
                      where: { noteId: { in: ids } },
                      _avg: { score: true },
                      _count: true,
                  })
        const gradeByNote = new Map<
            string,
            { count: number; averageScore: number | null; letter: NoteLetterGrade | null }
        >()
        for (const g of gradeAggs) {
            const count = g._count
            const avg = count > 0 && g._avg.score != null ? g._avg.score : null
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
