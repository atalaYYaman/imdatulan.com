'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import DOMPurify from 'isomorphic-dompurify';

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

        // --- Access Control Logic ---
        if (!note) return null

        if (note.deletedAt) return null; // Soft Delete Check

        // 1. PENDING Notlar: Kimse erişemez (Owner dahil)
        if (note.status === 'PENDING') {
            return null
        }

        // 2. SUSPENDED Notlar: Sadece Owner ve Satın Alanlar
        if (note.status === 'SUSPENDED') {
            const session = await getServerSession(authOptions)
            if (!session?.user?.email) return null

            const user = await prisma.user.findUnique({ where: { email: session.user.email } })
            if (!user) return null

            // Owner check
            if (note.uploaderId === user.id) {
                // Allow
            } else {
                // Purchase check
                const isUnlocked = await prisma.unlockedNote.findUnique({
                    where: {
                        userId_noteId: {
                            userId: user.id,
                            noteId: noteId
                        }
                    }
                })

                if (!isUnlocked) return null
            }
        }
        // ---------------------------

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

export async function addComment(noteId: string, text: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return { success: false, message: "Unauthorized" }

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (!user) return { success: false, message: "User not found" }

        const cleanText = DOMPurify.sanitize(text);

        await prisma.comment.create({
            data: {
                text: cleanText,
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

export async function unlockNote(noteId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return { success: false, message: "Unauthorized" }

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (!user) return { success: false, message: "Kullanıcı bulunamadı" }

        // Notu ve fiyatını getir
        const note = await prisma.note.findUnique({
            where: { id: noteId },
            select: { price: true, uploaderId: true }
        })

        if (!note) return { success: false, message: "Not bulunamadı" }

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

        // Kendi notu mu?
        if (note.uploaderId === user.id) {
            // Anti-Self Dealing: Kendi notunu satın almasına gerek yok, zaten açık.
            // Ama eğer satın almaya çalışıyorsa (Unlock butonu çıkmışsa):
            // Frontend gizlemeli. Backend'de engelliyoruz.
            return { success: false, message: "Kendi notunuzu satın alamazsınız." }
        }

        // Kredi yeterli mi?
        if (user.credits < note.price) {
            return { success: false, message: `Yetersiz Süt Bakiyesi! Bu not için ${note.price} Süt gerekiyor. 🥛` }
        }

        // Transaction: 
        // 1. İzleyiciden kredi düş
        // 2. Yükleyiciye kredi ekle
        // 3. Kilidi aç
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { credits: { decrement: note.price } }
            }),
            prisma.user.update({
                where: { id: note.uploaderId },
                data: { credits: { increment: note.price } }
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
    try {
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
    } catch (error) {
        console.error("isNoteUnlocked error:", error);
        return false;
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

export async function isLikedByUser(noteId: string) {
    try {
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
    } catch (error) {
        console.error("isLikedByUser error:", error);
        return false;
    }
}

// REPORT ACTIONS
export async function createReport(noteId: string, reason: string, details: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return { success: false, message: "Şikayet etmek için giriş yapmalısınız." }

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (!user) return { success: false, message: "Kullanıcı bulunamadı" }

        // Check for existing report
        const existingReport = await prisma.report.findFirst({
            where: {
                noteId,
                reporterId: user.id
            }
        })

        if (existingReport) {
            return { success: false, message: "Bu içeriği ile ilgili zaten bir bildiriminiz bulunuyor." }
        }

        await prisma.report.create({
            data: {
                noteId,
                reporterId: user.id,
                reason,
                details,
                status: "PENDING"
            }
        })

        return { success: true }
    } catch (error) {
        console.error("Report error:", error)
        return { success: false, message: "Şikayet oluşturulurken bir hata oluştu." }
    }
}

// DELETE ACTION
export async function deleteNote(noteId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return { success: false, message: "Yetkisiz işlem." }

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (!user) return { success: false, message: "Kullanıcı bulunamadı" }

        const note = await prisma.note.findUnique({ where: { id: noteId } })
        if (!note) return { success: false, message: "Not bulunamadı." }

        // Sadece yükleyen silebilir (Admin logic ayrı eklenebilir)
        if (note.uploaderId !== user.id && user.role !== 'ADMIN') {
            return { success: false, message: "Bu notu silme yetkiniz yok." }
        }

        // Hard Delete (Cascades will handle related records like Likes, Comments, Views if configured in schema, 
        // but let's trust Prisma cascade or do manual cleanup if needed. Schema says onDelete: Cascade for relations)
        // SOFT DELETE
        await prisma.note.update({
            where: { id: noteId },
            data: { deletedAt: new Date() }
        })

        return { success: true }
    } catch (error) {
        console.error("Delete error:", error)
        return { success: false, message: "Not silinirken bir hata oluştu." }
    }
}
