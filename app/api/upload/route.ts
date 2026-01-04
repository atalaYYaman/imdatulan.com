import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { addWatermark } from "@/lib/watermark"
import { writeFile } from "fs/promises"
import path from "path"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get("file") as File
        const title = formData.get("title") as string
        const university = formData.get("university") as string
        const faculty = formData.get("faculty") as string
        const department = formData.get("department") as string

        if (!file || !title || !university) {
            return NextResponse.json({ message: "Missing fields" }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes as any)

        // Watermark
        let finalBuffer = buffer
        if (file.type === "application/pdf") {
            try {
                finalBuffer = await addWatermark(buffer)
            } catch (e) {
                console.error("Watermark failed", e)
                // Proceed without watermark or fail? Fail for now to ensure requirement.
                return NextResponse.json({ message: "Failed to process PDF" }, { status: 500 })
            }
        } else {
            // Reject non-pdf for MVP or just save? User requested watermarking.
            // If it's an image, pdf-lib can't just 'open' it. 
            // We will restrict to PDF.
            return NextResponse.json({ message: "Only PDF files are supported for MVP" }, { status: 400 })
        }

        const fileName = `NOD-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
        const uploadDir = path.join(process.cwd(), "public", "uploads")
        const filePath = path.join(uploadDir, fileName)

        await writeFile(filePath, finalBuffer)

        // DB Record
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 })

        const note = await prisma.note.create({
            data: {
                title,
                university,
                faculty,
                department,
                fileUrl: `/uploads/${fileName}`,
                uploaderId: user.id
            }
        })

        return NextResponse.json({ message: "Upload successful", note }, { status: 201 })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: "Internal Error" }, { status: 500 })
    }
}
