import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendNoteRejectedEmail } from "@/lib/email"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    // Admin Check
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const { noteId, reason } = await req.json()

        if (!noteId || !reason) {
            return NextResponse.json({ message: "Note ID and Reason required" }, { status: 400 })
        }

        // Get Note to find uploader
        const note = await prisma.note.findUnique({
            where: { id: noteId },
            include: { uploader: true }
        })

        if (!note) return NextResponse.json({ message: "Note not found" }, { status: 404 })

        // Update Note Status
        const updatedNote = await prisma.note.update({
            where: { id: noteId },
            data: { status: 'REJECTED' } // We might want to save the reason somewhere, but for now just email
        })

        // Send Email
        await sendNoteRejectedEmail(note.uploader.email, note.title, reason)

        return NextResponse.json({ message: "Note rejected", note: updatedNote })

    } catch (error) {
        console.error("Admin Note Reject Error:", error)
        return NextResponse.json({ message: "Internal Error" }, { status: 500 })
    }
}
