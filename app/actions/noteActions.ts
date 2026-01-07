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
    const session = await getServerSession(authOptions)

    // Eğer kullanıcı giriş yapmamışsa, basitçe artır (veya artırma, tercih meselesi - şimdilik artırıyoruz)
    // Ama Unique View istiyorsak, giriş yapmamış kişileri takip edemeyiz (Cookie/IP hariç).
    // MVP için: Sadece giriş yapmış kullanıcıların view'ini "unique" sayalım.
    if (!session?.user?.email) return;

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (!user) return

        // 1. Kullanıcı bu notu daha önce görüntülemiş mi?
        const existingView = await prisma.view.findUnique({
            where: {
                userId_noteId: {
                    userId: user.id,
                    noteId: noteId
                }
            }
        })

        // 2. Eğer görüntülememişse:
        if (!existingView) {
            // Transaction ile hem View oluştur hem Count artır
            await prisma.$transaction([
                prisma.view.create({
                    data: {
                        userId: user.id,
                        noteId: noteId
                    }
                }),
                prisma.note.update({
                    where: { id: noteId },
                    data: {
                        viewCount: {
                            increment: 1
                        }
                    }
                })
            ])
        }
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

return !!like
}

export async function unlockNote(noteId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return { success: false, message: "Unauthorized" }

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (!user) return { success: false, message: "Kullanıcı bulunamadı" }

        // Zaten açık mı?
        const existingUnlock = await prisma.unlockedNote.findUnique({
            where: {
                userId_noteId: {
                    userId: user.id,
                    noteId: noteId
                }
            }
        })

        if (existingUnlock) return { success: true, message: "Zaten açık" }

        // Kredi yeterli mi?
        if (user.credits < 1) {
            return { success: false, message: "Yetersiz Süt Bakiyesi! 🥛" }
        }

        // Transaction: Kredi düş, Kilidi aç
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { credits: { decrement: 1 } }
            }),
            prisma.unlockedNote.create({
                data: {
                    userId: user.id,
                    noteId: noteId
                }
            })
        ])

        revalidatePath(`/notes/${noteId}`)
        return { success: true }

    } catch (error) {
        console.error("Error unlocking note:", error)
        return { success: false, message: "Bir hata oluştu" }
    }
}

// Check if user has unlocked the note
export async function isNoteUnlocked(noteId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return false

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return false

    // Kendi notu ise açık
    const note = await prisma.note.findUnique({ where: { id: noteId }, select: { uploaderId: true } })
    if (note?.uploaderId === user.id) return true

    // Satın alınmış mı?
    const unlock = await prisma.unlockedNote.findUnique({
        where: {
            userId_noteId: {
                userId: user.id,
                noteId: noteId
            }
        }
    })

    return !!unlock
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

            // ÖDÜL SİSTEMİ: Her 10. beğenide not yükleyicisine 1 Süt ver
            // 1. Notun güncel beğeni sayısını (transaction dışında ama create sonrası) alalım
            // Veya daha güvenli: count yapalım.
            const likeCount = await prisma.like.count({ where: { noteId } })

            if (likeCount % 10 === 0) {
                const note = await prisma.note.findUnique({ where: { id: noteId } })
                if (note) {
                    await prisma.user.update({
                        where: { id: note.uploaderId },
                        data: { credits: { increment: 1 } }
                    })
                }
            }
        }

        revalidatePath(`/notes/${noteId}`)
        return { success: true }
    } catch (error) {
        console.error("Error toggling like:", error)
        return { success: false, message: "Error" }
    }
}
