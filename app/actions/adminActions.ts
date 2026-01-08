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
            include: { uploader: true } // Need uploader for credits
        });

        // Update User Credits (Award 3 credits on approval as per plan)
        await prisma.user.update({
            where: { id: note.uploaderId },
            data: { credits: { increment: 3 } }
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
        // We might want to store rejection reason for notes too?
        // Note model doesn't have rejectionReason field yet.
        // For now, just set status to REJECTED.
        await prisma.note.update({
            where: { id: noteId },
            data: { status: "REJECTED" }
        });

        revalidatePath('/admin/notes');
        return { success: true, message: "Note rejected" };
    } catch (error) {
        return { success: false, message: "Error rejecting note" };
    }
}
