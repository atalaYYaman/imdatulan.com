'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getAnonymousNameByDepartment } from "@/lib/anonymization"

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

        // UI'ye sadece anonim isim ve temel uploader bilgisi gönderilir.
        return notes.map(note => ({
            ...note,
            uploader: {
                id: note.uploader.id,
                department: note.uploader.department,
                anonymousName: getAnonymousNameByDepartment(note.uploader.department),
            },
        }))
    } catch (error) {
        console.error("Failed to fetch notes:", error)
        return []
    }
}
