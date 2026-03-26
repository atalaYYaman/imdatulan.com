'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

import { sendEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { createPartnerSchema } from "@/lib/schemas";

// Helper to check admin role
async function isAdmin() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
        return false;
    }
    return true;
}

function buildDisplayName(firstName?: string | null, lastName?: string | null) {
    const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim();
    return fullName || "Bilinmiyor";
}

export type PurchaseLogsAdminFilters = {
    search?: string;
    startDate?: string;
    endDate?: string;
    minCredit?: number;
    maxCredit?: number;
    page?: number;
    pageSize?: number;
}

export async function getPurchaseLogsAdmin(filters: PurchaseLogsAdminFilters = {}) {
    if (!await isAdmin()) return { success: false, message: "Unauthorized" };

    try {
        const page = Math.max(1, Number(filters.page || 1));
        const pageSizeRaw = Number(filters.pageSize || 20);
        const pageSize = Math.min(Math.max(pageSizeRaw, 5), 100);

        const search = (filters.search || "").trim().toLocaleLowerCase('tr-TR');
        const minCredit = typeof filters.minCredit === "number" && Number.isFinite(filters.minCredit)
            ? Math.max(0, Math.floor(filters.minCredit))
            : undefined;
        const maxCredit = typeof filters.maxCredit === "number" && Number.isFinite(filters.maxCredit)
            ? Math.max(0, Math.floor(filters.maxCredit))
            : undefined;

        const startDate = filters.startDate ? new Date(filters.startDate) : undefined;
        const endDate = filters.endDate ? new Date(filters.endDate) : undefined;

        if (startDate && Number.isNaN(startDate.getTime())) {
            return { success: false, message: "Geçersiz başlangıç tarihi" };
        }
        if (endDate && Number.isNaN(endDate.getTime())) {
            return { success: false, message: "Geçersiz bitiş tarihi" };
        }
        if (startDate && endDate && startDate > endDate) {
            return { success: false, message: "Başlangıç tarihi bitişten büyük olamaz" };
        }

        const amountWhere: { gte?: number; lte?: number } = {};
        if (typeof minCredit === "number") amountWhere.lte = -minCredit;
        if (typeof maxCredit === "number") amountWhere.gte = -maxCredit;

        const buyerTransactions = await prisma.transaction.findMany({
            where: {
                type: "NOTE_UNLOCK",
                ...(startDate || endDate
                    ? {
                        createdAt: {
                            ...(startDate ? { gte: startDate } : {}),
                            ...(endDate ? { lte: endDate } : {}),
                        }
                    }
                    : {}),
                ...(Object.keys(amountWhere).length > 0 ? { amount: amountWhere } : {})
            },
            select: {
                id: true,
                userId: true,
                amount: true,
                balanceAfter: true,
                referenceId: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        const noteIds = Array.from(
            new Set(
                buyerTransactions
                    .map((tx) => tx.referenceId)
                    .filter((id): id is string => !!id)
            )
        );

        const notes = noteIds.length > 0
            ? await prisma.note.findMany({
                where: { id: { in: noteIds } },
                select: {
                    id: true,
                    title: true,
                    uploaderId: true,
                    uploader: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            })
            : [];

        const noteById = new Map(notes.map((note) => [note.id, note]));
        const sellerTransactions = noteIds.length > 0
            ? await prisma.transaction.findMany({
                where: {
                    type: "UPLOAD_REWARD",
                    referenceId: { in: noteIds }
                },
                select: {
                    userId: true,
                    referenceId: true,
                    amount: true,
                    balanceAfter: true,
                    createdAt: true
                }
            })
            : [];

        const rows = buyerTransactions.map((tx) => {
            const note = tx.referenceId ? noteById.get(tx.referenceId) : null;
            const buyerName = buildDisplayName(tx.user.firstName, tx.user.lastName);
            const sellerName = note?.uploader
                ? buildDisplayName(note.uploader.firstName, note.uploader.lastName)
                : "Bilinmiyor";

            const candidateSellerTx = note
                ? sellerTransactions
                    .filter((sellerTx) => (
                        sellerTx.referenceId === note.id &&
                        sellerTx.userId === note.uploaderId &&
                        sellerTx.amount === Math.abs(tx.amount)
                    ))
                    .sort((a, b) => (
                        Math.abs(new Date(a.createdAt).getTime() - new Date(tx.createdAt).getTime()) -
                        Math.abs(new Date(b.createdAt).getTime() - new Date(tx.createdAt).getTime())
                    ))[0]
                : undefined;

            return {
                id: tx.id,
                purchasedAt: tx.createdAt,
                noteId: note?.id ?? tx.referenceId ?? null,
                noteTitle: note?.title ?? "Silinmiş/Eski Not",
                creditAmount: Math.abs(tx.amount),
                buyer: {
                    id: tx.user.id,
                    email: tx.user.email,
                    name: buyerName,
                    balanceAfter: tx.balanceAfter,
                },
                seller: {
                    id: note?.uploader.id ?? null,
                    email: note?.uploader.email ?? null,
                    name: sellerName,
                    balanceAfter: candidateSellerTx?.balanceAfter ?? null,
                }
            };
        });

        const filteredRows = search
            ? rows.filter((row) => {
                const haystack = [
                    row.noteTitle,
                    row.buyer.name,
                    row.buyer.email,
                    row.seller.name,
                    row.seller.email ?? "",
                ]
                    .join(" ")
                    .toLocaleLowerCase('tr-TR');

                return haystack.includes(search);
            })
            : rows;

        const total = filteredRows.length;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const safePage = Math.min(page, totalPages);
        const startIndex = (safePage - 1) * pageSize;
        const items = filteredRows.slice(startIndex, startIndex + pageSize);

        return {
            success: true,
            data: {
                items,
                pagination: {
                    page: safePage,
                    pageSize,
                    total,
                    totalPages,
                }
            }
        };
    } catch (error) {
        console.error("Error fetching admin purchase logs:", error);
        return { success: false, message: "Satın alma logları alınırken hata oluştu" };
    }
}

// --- Users ---

export async function getPendingUsers() {
    if (!await isAdmin()) return { success: false, message: "Unauthorized" };

    try {
        const users = await prisma.user.findMany({
            where: { approvalStatus: "PENDING" },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: users };
    } catch (error) {
        return { success: false, message: "Error fetching users" };
    }
}

export async function approveUser(userId: string) {
    if (!await isAdmin()) return { success: false, message: "Unauthorized" };

    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: { approvalStatus: "APPROVED", rejectionReason: null }
        });

        await sendEmail({
            to: user.email,
            subject: "Üyelik Başvurunuz Onaylandı | Otlak",
            body: `Merhaba ${user.firstName}, Otlak üyeliğiniz onaylanmıştır. Artık giriş yapabilirsiniz.`
        });

        revalidatePath('/admin/users');
        return { success: true, message: "User approved" };
    } catch (error) {
        return { success: false, message: "Error approving user" };
    }
}

export async function rejectUser(userId: string, reason: string) {
    if (!await isAdmin()) return { success: false, message: "Unauthorized" };

    try {
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!currentUser) return { success: false, message: "User not found" };

        const newCount = (currentUser.rejectionCount || 0) + 1;

        if (newCount >= 2) {
            // BAN USER
            await prisma.user.update({
                where: { id: userId },
                data: {
                    approvalStatus: "BANNED",
                    rejectionReason: reason,
                    rejectionCount: newCount
                }
            });

            await sendEmail({
                to: currentUser.email,
                subject: "Hesabınız Yasaklandı | Otlak",
                body: `Merhaba ${currentUser.firstName}, Otlak üyelik başvurunuz 2. kez reddedildiği için hesabınız kalıcı olarak (yasaklanmış) askıya alınmıştır. Sebep: ${reason}`
            });

            revalidatePath('/admin/users');
            return { success: true, message: "User banned (2nd rejection)" };
        } else {
            // REJECT AND RESET (Allow retry)
            await prisma.user.update({
                where: { id: userId },
                data: {
                    approvalStatus: "REJECTED",
                    rejectionReason: reason,
                    rejectionCount: newCount,
                    // Release unique fields
                    studentNumber: null,
                    tcIdentityNo: null
                }
            });

            await sendEmail({
                to: currentUser.email,
                subject: "Üyelik Başvurunuz Reddedildi | Otlak",
                body: `Merhaba ${currentUser.firstName}, Otlak üyelik başvurunuz reddedilmiştir. Ancak, bilgilerinizi düzelterek tekrar başvuru yapabilirsiniz. Sebep: ${reason}`
            });

            revalidatePath('/admin/users');
            return { success: true, message: "User rejected and reset for retry" };
        }

    } catch (error) {
        console.error("Reject User Error:", error);
        return { success: false, message: "Error rejecting user" };
    }
}

// --- Partner Management ---

type CreatePartnerInput = {
    name: string;
    email: string;
    password: string;
    storeId?: string | null;
};

export async function createPartnerUser(input: CreatePartnerInput) {
    // Strong role guard as requested
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    // Zod validation
    const parsed = createPartnerSchema.parse({
        name: input.name,
        email: input.email,
        password: input.password
    });

    const { name, email, password } = parsed;
    const storeId = input.storeId || null;

    // Email uniqueness check
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return { success: false, message: "Kullanıcı zaten mevcut" };
    }

    // Password hashing (bcryptjs)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Basic audit log to server logs (can be upgraded to DB log)
    console.log("[ADMIN] Partner create request", {
        adminId: session.user.id,
        adminEmail: session.user.email,
        partnerEmail: email
    });

    const data: any = {
        email,
        password: hashedPassword,
        role: "PARTNER",
        credits: 0,
        approvalStatus: "APPROVED", // Partner hesapları admin tarafından onaylı gelir
        firstName: name
    };

    if (storeId) {
        data.store = {
            connect: { id: storeId }
        };
    }

    const user = await prisma.user.create({
        data,
        include: {
            store: true
        }
    });

    // Never return password to caller
    const { password: _password, ...safeUser } = user;

    return { success: true, data: safeUser };
}

export async function getAllPartners() {
    if (!await isAdmin()) return { success: false, message: "Unauthorized" };

    const partners = await prisma.user.findMany({
        where: { role: "PARTNER" },
        include: {
            store: true
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    return { success: true, data: partners };
}

// --- Notes ---

export async function getPendingNotes() {
    if (!await isAdmin()) return { success: false, message: "Unauthorized" };

    try {
        const notes = await prisma.note.findMany({
            where: { status: "PENDING" },
            include: {
                uploader: true,
                _count: { select: { files: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        const data = notes.map(({ _count, ...n }) => ({
            ...n,
            fileCount: _count.files > 0 ? _count.files : 1
        }));
        return { success: true, data };
    } catch (error) {
        return { success: false, message: "Error fetching notes" };
    }
}

export async function approveNote(noteId: string) {
    if (!await isAdmin()) return { success: false, message: "Unauthorized" };

    try {
        const note = await prisma.note.update({
            where: { id: noteId },
            data: { status: "APPROVED" },
            include: { uploader: true } // Need uploader for credits and email
        });

        // Update User Credits (Award 3 credits on approval as per plan)
        await prisma.user.update({
            where: { id: note.uploaderId },
            data: { credits: { increment: 3 } }
        });

        // Send Email
        await sendEmail({
            to: note.uploader.email,
            subject: "Notunuz Onaylandı! | Otlak",
            body: `Tebrikler! "${note.courseName}" dersi için yüklediğiniz not onaylandı ve yayınlandı. Hesabınıza 3 Süt yüklendi.`
        });

        revalidatePath('/admin/notes');
        return { success: true, message: "Note approved" };
    } catch (error) {
        return { success: false, message: "Error approving note" };
    }
}

export async function rejectNote(noteId: string, reason: string) {
    if (!await isAdmin()) return { success: false, message: "Unauthorized" };

    try {
        const note = await prisma.note.update({
            where: { id: noteId },
            data: { status: "REJECTED" },
            include: { uploader: true }
        });

        // Send Email
        await sendEmail({
            to: note.uploader.email,
            subject: "Notunuz Reddedildi | Otlak",
            body: `Üzgünüz, "${note.courseName}" dersi için yüklediğiniz not onaylanmadı. Sebep: ${reason}`
        });

        revalidatePath('/admin/notes');
        return { success: true, message: "Note rejected" };
    } catch (error) {
        return { success: false, message: "Error rejecting note" };
    }
}

// --- Reports ---

export async function getReports() {
    if (!await isAdmin()) return { success: false, message: "Unauthorized" };

    try {
        const reports = await prisma.report.findMany({
            where: { status: "PENDING" },
            include: {
                note: {
                    select: { title: true, uploader: { select: { email: true, firstName: true } } }
                },
                reporter: {
                    select: { email: true, firstName: true, lastName: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: reports };
    } catch (error) {
        return { success: false, message: "Error fetching reports" };
    }
}

export async function resolveReport(reportId: string, action: 'SUSPEND' | 'REJECT', noteId: string, reason?: string) {
    if (!await isAdmin()) return { success: false, message: "Unauthorized" };

    try {
        if (action === 'SUSPEND') {
            // Askıya Al - Notun durumunu güncelle
            const note = await prisma.note.update({
                where: { id: noteId },
                data: {
                    status: 'SUSPENDED',
                    rejectionReason: reason
                },
                include: { uploader: true } // For email
            });

            // Raporu çözüldü olarak işaretle
            await prisma.report.update({
                where: { id: reportId },
                data: { status: 'RESOLVED' }
            });

            // Email gönder
            await sendEmail({
                to: note.uploader.email,
                subject: "İçeriğiniz Askıya Alındı | Otlak",
                body: `Merhaba ${note.uploader.firstName}, "${note.title}" başlıklı notunuz yapılan bir şikayet üzerine incelenmiş ve aşağıdaki nedenle askıya alınmıştır:
                
                Sebep: ${reason}
                
                Askıya alınan içerikler sadece sizin ve önceden satın almış kullanıcıların erişimine açıktır.`
            });

            revalidatePath('/admin/reports');
            return { success: true, message: "Content suspended" };

        } else if (action === 'REJECT') {
            // Şikayeti Reddet - Yani şikayet geçersiz, sil gitsin (veya REJECTED yap)
            // Kullanıcı isteğine göre: "Reddedilen veriler database ve tüm sayfalardan içerik dosyalarıyla birlikte kaldırılacak."
            // Bu kısım "Reddedilen Notlar" için geçerliydi. Şikayet reddediliyorsa, şikayet kaydı silinir.

            await prisma.report.delete({
                where: { id: reportId }
            });

            revalidatePath('/admin/reports');
            return { success: true, message: "Report rejected and deleted" };
        }
    } catch (error) {
        console.error(error);
        return { success: false, message: "Error processing report" };
    }
}

// --- Stats ---

export async function getAdminStats() {
    if (!await isAdmin()) return { success: false, message: "Unauthorized" };

    try {
        const totalUsers = await prisma.user.count();
        const pendingUsers = await prisma.user.count({ where: { approvalStatus: "PENDING" } });

        const totalNotes = await prisma.note.count();
        const pendingNotes = await prisma.note.count({ where: { status: "PENDING" } });
        const suspendedNotes = await prisma.note.count({ where: { status: "SUSPENDED" } });
        const rejectedNotes = await prisma.note.count({ where: { status: "REJECTED" } }); // Bu genelde 0 olabilir eğer siliniyorsa.

        const pendingReports = await prisma.report.count({ where: { status: "PENDING" } });

        return {
            success: true,
            data: {
                totalUsers,
                pendingUsers,
                totalNotes,
                pendingNotes,
                suspendedNotes,
                rejectedNotes,
                pendingReports
            }
        };
    } catch (error) {
        return { success: false, message: "Error fetching stats" };
    }
}
