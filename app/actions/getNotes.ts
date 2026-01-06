'use server'

import { prisma } from "@/lib/prisma"

export async function getNotes() {
    try {
        const notes = await prisma.note.findMany({
            where: {
                status: 'APPROVED' // Only fetch approved notes
            },
            include: {
                uploader: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        university: true,
                        department: true,
                        // We don't have avatar/stats in DB yet, will map to dummy or defaults
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        return notes
    } catch (error) {
        console.error("Failed to fetch notes:", error)
        return []
    }
}
