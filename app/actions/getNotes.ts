'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

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
                // fileUrl is NEVER returned in list view (Zero Trust: prevent IDOR / leakage)
                uploader: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        university: true,
                        department: true,
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
