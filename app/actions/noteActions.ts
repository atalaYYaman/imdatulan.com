'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import xss from 'xss';
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { getAnonymousNameByDepartment } from "@/lib/anonymization";
import { IMAGE_EXTENSIONS, PDF_EXTENSIONS } from "@/lib/fileType";
import { NoteLetterGrade, Prisma } from "@prisma/client";
import { averageScoreToLetter, gradeToScore } from "@/lib/noteGrades";

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
                fileUrl: true, // Used only for extension fallback when fileExtension is null (old notes)
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
                files: {
                    orderBy: { sortOrder: 'asc' },
                    select: { fileExtension: true }
                },
                _count: {
                    select: {
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

        if (note.status === 'PENDING') {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { id: true, role: true }
            })
            if (!user) return null
            if (note.uploaderId !== user.id && user.role !== 'ADMIN') return null
        }

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

        // Fallback: Eski notlar (migration öncesi) fileExtension=null; blob URL'den uzantı parse et
        const ALLOWED_EXT = new Set([...IMAGE_EXTENSIONS, ...PDF_EXTENSIONS]);
        let effectiveFileExtension = note.fileExtension;
        if (!effectiveFileExtension && note.fileUrl) {
            try {
                const pathname = new URL(note.fileUrl).pathname;
                const ext = pathname.split('.').pop()?.toLowerCase();
                if (ext && ALLOWED_EXT.has(ext)) effectiveFileExtension = ext;
            } catch { /* ignore */ }
        }
        effectiveFileExtension = effectiveFileExtension ?? 'pdf';

        // UI'ye gerçek isim gönderilmez; fileUrl ASLA client'a gönderilmez
        const { fileUrl: _omitUrl, files: rawFiles, ...noteSafe } = note;
        const fileExtensions = rawFiles?.length
            ? rawFiles.map((f: { fileExtension: string }) => f.fileExtension || 'pdf')
            : [effectiveFileExtension];
        const fileCount = fileExtensions.length;
        const uploaderDisplayName = getAnonymousNameByDepartment(note.uploader.department);

        const viewer = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        let ratingCount = 0;
        let averageScore: number | null = null;
        let letter: NoteLetterGrade | null = null;
        let distribution = {} as Partial<Record<NoteLetterGrade, number>>;
        let myGrade: NoteLetterGrade | null = null;

        try {
            const [gradeAgg, gradeGroups] = await Promise.all([
                prisma.noteGrade.aggregate({
                    where: { noteId },
                    _avg: { score: true },
                    _count: true,
                }),
                prisma.noteGrade.groupBy({
                    by: ["grade"],
                    where: { noteId },
                    _count: true,
                }),
            ]);

            ratingCount = gradeAgg._count;
            averageScore =
                ratingCount > 0 && gradeAgg._avg.score != null
                    ? gradeAgg._avg.score
                    : null;
            letter =
                averageScore != null
                    ? averageScoreToLetter(averageScore)
                    : null;
            distribution = Object.fromEntries(
                gradeGroups.map((g) => [g.grade, g._count])
            ) as Partial<Record<NoteLetterGrade, number>>;

            if (viewer) {
                const row = await prisma.noteGrade.findUnique({
                    where: {
                        userId_noteId: { userId: viewer.id, noteId },
                    },
                    select: { grade: true },
                });
                myGrade = row?.grade ?? null;
            }
        } catch (gradeErr) {
            console.error(
                "getNoteDetail: NoteGrade sorguları başarısız (migration gerekli olabilir):",
                gradeErr
            );
        }

        return {
            ...noteSafe,
            fileExtension: effectiveFileExtension,
            fileExtensions,
            fileCount,
            _count: note._count,
            rating: {
                count: ratingCount,
                averageScore,
                letter,
                distribution,
            },
            myGrade,
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

const submitGradeSchema = z.object({
    noteId: z.string().min(1),
    grade: z.nativeEnum(NoteLetterGrade),
});

export async function submitNoteGrade(noteId: string, grade: NoteLetterGrade) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Unauthorized");

    const parsed = submitGradeSchema.safeParse({ noteId, grade });
    if (!parsed.success) {
        return { success: false, message: "Geçersiz not veya ID" };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });
        if (!user) return { success: false, message: "Kullanıcı bulunamadı" };

        const limitCheck = await checkRateLimit(`grade_${user.id}`, 30, 60);
        if (!limitCheck.success) {
            return {
                success: false,
                message: limitCheck.message || "Çok hızlı değerlendirme gönderiyorsunuz.",
            };
        }

        const note = await prisma.note.findUnique({
            where: { id: noteId },
            select: { id: true, uploaderId: true, status: true, deletedAt: true },
        });
        if (!note || note.deletedAt) {
            return { success: false, message: "Not bulunamadı." };
        }
        if (note.status !== "APPROVED") {
            return { success: false, message: "Bu not değerlendirmeye kapalı." };
        }
        if (note.uploaderId === user.id) {
            return { success: false, message: "Kendi notunuza harf notu veremezsiniz." };
        }

        const unlocked = await prisma.unlockedNote.findUnique({
            where: { userId_noteId: { userId: user.id, noteId } },
        });
        if (!unlocked) {
            return {
                success: false,
                message: "Değerlendirmek için notu satın almalısınız.",
            };
        }

        const score = gradeToScore(grade);
        await prisma.noteGrade.upsert({
            where: {
                userId_noteId: { userId: user.id, noteId },
            },
            create: {
                userId: user.id,
                noteId,
                grade,
                score,
            },
            update: { grade, score },
        });

        revalidatePath(`/notes/${noteId}`);
        revalidatePath("/notes");
        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        console.error("submitNoteGrade error:", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2021") {
                return {
                    success: false,
                    message:
                        "Değerlendirme özelliği veritabanında hazır değil. Sunucuda `npx prisma migrate deploy` çalıştırılmalı.",
                };
            }
            if (error.code === "P2003") {
                return {
                    success: false,
                    message:
                        "Kayıt bağlantısı başarısız. Sayfayı yenileyip tekrar deneyin.",
                };
            }
        }

        if (
            process.env.NODE_ENV === "development" &&
            error instanceof Error &&
            error.message
        ) {
            return {
                success: false,
                message: `Değerlendirme kaydedilemedi: ${error.message}`,
            };
        }

        return {
            success: false,
            message:
                "Değerlendirme kaydedilemedi. Veritabanı migrasyonunun (NoteGrade tablosu) canlı ortamda uygulandığından emin olun.",
        };
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

        // Soft delete; ilişkili NoteGrade / Comment / View kayıtları şema ile not silinince (hard delete) veya cascade ile yönetilir
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
