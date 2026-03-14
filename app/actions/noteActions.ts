'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import xss from 'xss';
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { getAnonymousNameByDepartment } from "@/lib/anonymization";

export async function getNoteDetail(noteId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) throw new Error("Unauthorized")

    try {
        const note = await prisma.note.findUnique({
            where: { id: noteId },
            select: {
                id: true,
                title: true,
                university: true,
                faculty: true,
                department: true,
                price: true,
                status: true,
                rejectionReason: true,
                courseName: true,
                type: true,
                term: true,
                description: true,
                isAI: true,
                viewCount: true,
                pageCount: true,
                fileExtension: true,
                uploaderId: true,
                createdAt: true,
                updatedAt: true,
                deletedAt: true,
                uploader: {
                    select: {
                        id: true,
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
                                id: true,
                                department: true,
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        })

        if (!note) return null
        if (note.deletedAt) return null

        if (note.status === 'PENDING') return null

        if (note.status === 'SUSPENDED') {
            const user = await prisma.user.findUnique({ where: { email: session.user.email } })
            if (!user) return null
            if (note.uploaderId === user.id) {
                // Allow owner
            } else {
                const isUnlocked = await prisma.unlockedNote.findUnique({
                    where: {
                        userId_noteId: { userId: user.id, noteId: noteId }
                    }
                })
                if (!isUnlocked) return null
            }
        }

        // UI'ye gerçek isim gönderilmez; sadece anonim displayName
        const uploaderDisplayName = getAnonymousNameByDepartment(note.uploader.department);
        return {
            ...note,
            uploader: {
                id: note.uploader.id,
                department: note.uploader.department,
                displayName: uploaderDisplayName,
            },
            comments: note.comments.map((c) => ({
                ...c,
                user: {
                    id: c.user.id,
                    displayName: getAnonymousNameByDepartment(c.user.department),
                },
            })),
        };
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
    if (!session?.user?.email) throw new Error("Unauthorized")

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (!user) return { success: false, message: "User not found" }

        // RATE LIMIT: 5 Comments per minute
        const limitCheck = await checkRateLimit(`comment_${user.id}`, 5, 60);
        if (!limitCheck.success) {
            return { success: false, message: limitCheck.message || "Çok hızlı yorum yapıyorsunuz. Biraz yavaşlayın. 🐢" }
        }

        const cleanText = xss(text);

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

import { UnlockNoteSchema } from "@/lib/schemas";

export async function unlockNote(noteId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) throw new Error("Unauthorized")

    const userEmail = session.user.email as string

    try {
        // 1. Input Validation
        const parse = UnlockNoteSchema.safeParse({ noteId });
        if (!parse.success) return { success: false, message: "Geçersiz ID formatı" };

        const result = await prisma.$transaction(async (tx) => {
            // 2. Fetch & Lock (Zero Trust)
            // Fetch User
            const user = await tx.user.findUnique({ where: { email: userEmail } });
            if (!user) throw new Error("Kullanıcı bulunamadı");

            // Fetch Note
            const note = await tx.note.findUnique({
                where: { id: noteId },
                select: { id: true, price: true, uploaderId: true, status: true, title: true }
            });
            if (!note) throw new Error("Not bulunamadı");

            // 3. Logic Checks
            if (note.status !== 'APPROVED') throw new Error("Bu not şu an erişime kapalıdır.");
            if (note.uploaderId === user.id) throw new Error("Kendi notunuzu satın alamazsınız.");

            // Check if already unlocked
            const existingUnlock = await tx.unlockedNote.findUnique({
                where: { userId_noteId: { userId: user.id, noteId: noteId } }
            });
            if (existingUnlock) return { success: true, message: "Zaten açık" };

            // Check Balance
            if (user.credits < note.price) throw new Error(`Yetersiz Süt Bakiyesi! Bu not için ${note.price} Süt gerekiyor. 🥛`);

            // 4. Execution (Atomic)
            // Buyer: Deduct
            const buyerNewBalance = user.credits - note.price;
            await tx.user.update({
                where: { id: user.id },
                data: { credits: buyerNewBalance }
            });

            // Uploader: Add
            const uploader = await tx.user.findUnique({ where: { id: note.uploaderId } });
            if (!uploader) throw new Error("Yükleyici bulunamadı context hatası");

            const uploaderNewBalance = uploader.credits + note.price;
            await tx.user.update({
                where: { id: note.uploaderId },
                data: { credits: uploaderNewBalance }
            });

            // Unlock
            await tx.unlockedNote.create({
                data: {
                    userId: user.id,
                    noteId: noteId
                }
            });

            // 5. Audit Log (Transaction Records)
            // Log for Buyer (Expense)
            await tx.transaction.create({
                data: {
                    userId: user.id,
                    amount: -note.price,
                    balanceAfter: buyerNewBalance,
                    type: "NOTE_UNLOCK",
                    description: `Not açıldı: ${note.title.substring(0, 50)}`,
                    referenceId: note.id
                }
            });

            // Log for Uploader (Income)
            await tx.transaction.create({
                data: {
                    userId: note.uploaderId,
                    amount: note.price,
                    balanceAfter: uploaderNewBalance,
                    type: "UPLOAD_REWARD", // Or create a specific NOTE_SALE type? Using UPLOAD_REWARD as generic earnings for now, or better:
                    // Let's stick to UPLOAD_REWARD based on previous discussion, or maybe "NOTE_SALE" is better?
                    // The schema has "UPLOAD_REWARD". Let's assume that covers it or add a new one? 
                    // Let's use UPLOAD_REWARD for now as "Earnings from Uploads".
                    description: `Not satıldı: ${note.title.substring(0, 50)}`,
                    referenceId: note.id
                }
            });

            return { success: true, message: "İşlem başarılı" };
        });

        revalidatePath(`/notes/${noteId}`)
        return result;

    } catch (error) {
        console.error("Error unlocking note:", error)
        return { success: false, message: error instanceof Error ? error.message : "Bir hata oluştu" }
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
    if (!session?.user?.email) throw new Error("Unauthorized")

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
    if (!session?.user?.email) throw new Error("Unauthorized")

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (!user) return { success: false, message: "Kullanıcı bulunamadı" }

        // RATE LIMIT: 3 Reports per 10 mins
        const limitCheck = await checkRateLimit(`report_${user.id}`, 3, 600);
        if (!limitCheck.success) {
            return { success: false, message: limitCheck.message || "Çok sık şikayet oluşturuyorsunuz. Lütfen bekleyiniz." }
        }

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
    if (!session?.user?.email) throw new Error("Unauthorized")

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
