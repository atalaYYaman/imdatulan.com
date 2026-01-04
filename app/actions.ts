'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function approveNote(noteId: string, uploaderId: string) {
    const session = await getServerSession(authOptions)
    // Minimal Admin Check - In production use robust role checks
    // We assume the caller checks, but double check user role here
    if (!session?.user?.email) return
    const admin = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (admin?.role !== 'ADMIN') return

    await prisma.$transaction([
        prisma.note.update({
            where: { id: noteId },
            data: { status: 'APPROVED' }
        }),
        prisma.user.update({
            where: { id: uploaderId },
            data: { lastApprovedUploadAt: new Date() }
        })
    ])

    revalidatePath('/')
    revalidatePath('/admin')
}

export async function rejectNote(noteId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return
    const admin = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (admin?.role !== 'ADMIN') return

    await prisma.note.update({
        where: { id: noteId },
        data: { status: 'REJECTED' }
    })

    revalidatePath('/admin')
}
