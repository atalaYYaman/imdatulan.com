'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

import { sendEmail } from "@/lib/email";

// Helper to check admin role
async function isAdmin() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
        return false;
    }
    return true;
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
        const user = await prisma.user.update({
            where: { id: userId },
            data: { approvalStatus: "REJECTED", rejectionReason: reason }
        });

        await sendEmail({
            to: user.email,
            subject: "Üyelik Başvurunuz Reddedildi | Otlak",
            body: `Merhaba ${user.firstName}, Otlak üyelik başvurunuz maalesef reddedilmiştir. Sebep: ${reason}`
        });

        revalidatePath('/admin/users');
        return { success: true, message: "User rejected" };
    } catch (error) {
        return { success: false, message: "Error rejecting user" };
    }
}

// --- Notes ---

export async function getPendingNotes() {
    if (!await isAdmin()) return { success: false, message: "Unauthorized" };

    try {
        const notes = await prisma.note.findMany({
            where: { status: "PENDING" },
            include: { uploader: true },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: notes };
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
