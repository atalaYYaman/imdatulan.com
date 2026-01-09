import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendNoteApprovedEmail } from "@/lib/email"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    // Admin Check
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const { noteId } = await req.json()

        if (!noteId) {
            return NextResponse.json({ message: "Note ID required" }, { status: 400 })
        }

        // Get Note to find uploader
        const note = await prisma.note.findUnique({
            where: { id: noteId },
            include: { uploader: true }
        })

        if (!note) return NextResponse.json({ message: "Note not found" }, { status: 404 })

        // Check if already approved to avoid double credit
        if (note.status === 'APPROVED') {
            return NextResponse.json({ message: "Note already approved" }, { status: 400 })
        }

        // Update Note Status
        const updatedNote = await prisma.note.update({
            where: { id: noteId },
            data: { status: 'APPROVED' }
        })

        // Give Credits to Uploader
        await prisma.user.update({
            where: { id: note.uploaderId },
            data: { credits: { increment: 3 } }
        })

        // Send Email
        await sendNoteApprovedEmail(note.uploader.email, note.title)

        return NextResponse.json({ message: "Note approved", note: updatedNote })

    } catch (error) {
        console.error("Admin Note Approve Error:", error)
        return NextResponse.json({ message: "Internal Error" }, { status: 500 })
    }
}
