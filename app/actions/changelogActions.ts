'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { put } from '@vercel/blob';

export async function createReleaseNote(formData: FormData) {
    const session = await getServerSession(authOptions)

    // Authorization Check: Must be ADMIN
    if (!session || session.user.role !== 'ADMIN') {
        return { success: false, message: "Bu işlemi yapmaya yetkiniz yok." }
    }

    try {
        const title = formData.get("title") as string;
        const version = formData.get("version") as string;
        const description = formData.get("description") as string;
        const file = formData.get("file") as File | null;

        // Basic Validation
        if (!title || !version || !description) {
            return { success: false, message: "Lütfen tüm zorunlu alanları doldurun." }
        }

        let imageUrl = null;
        if (file && file.size > 0) {
            console.log("Attempting to upload file:", file.name, "Size:", file.size);

            if (!process.env.BLOB_READ_WRITE_TOKEN) {
                console.error("BLOB_READ_WRITE_TOKEN is missing in environment variables.");
                return { success: false, message: "Sunucu konfigürasyon hatası: Görsel yükleme token'ı bulunamadı." };
            }

            try {
                const blob = await put(file.name, file, {
                    access: 'public',
                    addRandomSuffix: true,
                    token: process.env.BLOB_READ_WRITE_TOKEN
                });
                imageUrl = blob.url;
                console.log("Upload successful:", imageUrl);
            } catch (uploadError: any) {
                console.error("Blob upload error full:", uploadError);
                return { success: false, message: `Görsel yüklenirken bir hata oluştu: ${uploadError.message || "Bilinmeyen hata"}` };
            }
        }

        await prisma.releaseNote.create({
            data: {
                title,
                version,
                description,
                imageUrl,
                authorId: session.user.id
            }
        })

        revalidatePath('/updates')
        revalidatePath('/admin/changelog')

        return { success: true, message: "Geliştirme notu başarıyla yayınlandı!" }

    } catch (error) {
        console.error("Create Release Note Error:", error)
        return { success: false, message: "Bir hata oluştu." }
    }
}

export async function getReleaseNotes() {
    try {
        const notes = await prisma.releaseNote.findMany({
            orderBy: {
                publishedAt: 'desc'
            },
            include: {
                author: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
        return { success: true, data: notes };
    } catch (error) {
        console.error("Get Release Notes Error:", error);
        return { success: false, data: [] };
    }
}
