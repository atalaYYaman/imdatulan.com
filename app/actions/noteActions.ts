'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getNoteDetail(noteId: string) {
    try {
        const note = await prisma.note.findUnique({
            where: { id: noteId },
            include: {
                uploader: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        university: true,
                        department: true,
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                },
                comments: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        })
        return note
    } catch (error) {
        console.error("Error fetching note detail:", error)
        return null
    }
}

export async function incrementView(noteId: string) {
    try {
        await prisma.note.update({
            where: { id: noteId },
            data: {
                viewCount: {
                    increment: 1
                }
            }
        })
    } catch (error) {
        console.error("Error incrementing view:", error)
    }
}

export async function toggleLike(noteId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return { success: false, message: "Unauthorized" }

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (!user) return { success: false, message: "User not found" }

        const existingLike = await prisma.like.findUnique({
            where: {
                userId_noteId: {
                    userId: user.id,
                    noteId: noteId
                }
            }
        })

        if (existingLike) {
            await prisma.like.delete({
                where: { id: existingLike.id }
            })
        } else {
            await prisma.like.create({
                data: {
                    userId: user.id,
                    noteId: noteId
                }
            })
        }

        revalidatePath(`/notes/${noteId}`)
        return { success: true }
    } catch (error) {
        console.error("Error toggling like:", error)
        return { success: false, message: "Error" }
    }
}

export async function addComment(noteId: string, text: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return { success: false, message: "Unauthorized" }

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (!user) return { success: false, message: "User not found" }

        await prisma.comment.create({
            data: {
                text,
                noteId,
                userId: user.id
            }
        })

        revalidatePath(`/notes/${noteId}`)
        return { success: true }
    } catch (error) {
        console.error("Error adding comment:", error)
        return { success: false, message: "Error" }
    }
}

export async function isLikedByUser(noteId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return false

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return false

    const like = await prisma.like.findUnique({
        where: {
            userId_noteId: {
                userId: user.id,
                noteId: noteId
            }
        }
    })

    return !!like
}
