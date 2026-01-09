import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from '@vercel/blob';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get("file") as File
        const courseName = formData.get("courseName") as string
        const term = formData.get("term") as string
        const noteType = formData.get("noteType") as string
        const description = formData.get("description") as string
        const priceStr = formData.get("price") as string
        const price = priceStr ? parseInt(priceStr) : 1

        if (!file || !courseName) {
            return NextResponse.json({ message: "Missing fields" }, { status: 400 })
        }

        // Vercel Blob Storage
        const blob = await put(file.name, file, {
            access: 'public',
        });

        // DB Record
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 })

        const note = await prisma.note.create({
            data: {
                title: courseName,
                courseName: courseName,
                university: user.university || "Bilinmiyor",
                faculty: user.faculty || "Bilinmiyor",
                department: user.department || "Bilinmiyor",
                type: noteType,
                term: term,
                description: description,
                fileUrl: blob.url, // URL from Vercel Blob
                uploaderId: user.id,
                price: price,
                status: "APPROVED",
                isAI: formData.get("isAI") === "true",
            }
        })

        // Increment user credits by 3
        await prisma.user.update({
            where: { id: user.id },
            data: {
                credits: { increment: 3 }
            }
        })

        return NextResponse.json({ message: "Upload successful", note }, { status: 201 })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: "Internal Error" }, { status: 500 })
    }
}
