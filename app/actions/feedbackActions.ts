'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import xss from 'xss'

import { put } from '@vercel/blob';

export async function submitFeedback(formData: FormData) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return { success: false, message: "Geri bildirim göndermek için giriş yapmalısınız." }
    }

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (!user) return { success: false, message: "Kullanıcı bulunamadı." }

        const topic = formData.get("topic") as string;
        const message = formData.get("message") as string;
        const file = formData.get("file") as File | null;

        // Validation
        if (!topic || !message) {
            return { success: false, message: "Lütfen konu ve mesaj alanlarını doldurun." }
        }

        // Sanitize
        const cleanMessage = xss(message);
        let imageUrl = null;

        if (file && file.size > 0) {
            console.log("Attempting to upload file:", file.name, "Size:", file.size);
            try {
                const blob = await put(file.name, file, {
                    access: 'public',
                    addRandomSuffix: true,
                    token: process.env.BLOB_READ_WRITE_TOKEN // Explicitly pass token just in case
                });
                imageUrl = blob.url;
                console.log("Upload successful:", imageUrl);
            } catch (uploadError) {
                console.error("Blob upload error:", uploadError);
                return { success: false, message: "Fotoğraf yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin veya fotoğrafsız gönderin." };
            }
        }

        await prisma.feedback.create({
            data: {
                userId: user.id,
                topic,
                message: cleanMessage,
                imageUrl: imageUrl
            }
        })

        return { success: true, message: "Geri bildiriminiz başarıyla alındı! Teşekkür ederiz. 🐮" }

    } catch (error) {
        console.error("Feedback error:", error)
        return { success: false, message: "Bir hata oluştu." }
    }
}
