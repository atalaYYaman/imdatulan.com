'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { maskStudentNumber } from "@/lib/masking"
import xss from 'xss'

import { checkRateLimit } from "@/lib/rate-limit"
import { cleanText } from "@/lib/text-filter"
import { ChatMessageSchema, BulkDeleteSchema } from "@/lib/schemas"
import { pusherServer } from "@/lib/pusher-server"

// --- Types ---
export type ChatMessageDto = {
    id: string
    content: string
    createdAt: Date
    user: {
        id: string
        name: string
    }
    parentId?: string | null
}

export async function sendMessage(content: string, parentId?: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return { success: false, message: "Mesaj göndermek için giriş yapmalısınız." }
    }

    // 1. Rate Limiting (Sentinel Rule: 1 msg / 10 sec)
    const limitCheck = await checkRateLimit(`chat_${session.user.id}`, 1, 10);
    if (!limitCheck.success) {
        return { success: false, message: limitCheck.message || "Çok hızlı mesaj gönderiyorsunuz. Lütfen 10 saniye bekleyin." };
    }

    // 2. Validation
    const parse = ChatMessageSchema.safeParse({ content, parentId });
    if (!parse.success) {
        return { success: false, message: parse.error.issues[0].message };
    }

    // --- Command Parser (Admin Only) ---
    if (content.startsWith('/')) {
        if ((session.user as any).role !== 'ADMIN') {
            // Silently ignore or show error? Let's show error to user
            return { success: false, message: "Komut kullanma yetkiniz yok." };
        }

        const args = content.split(' ');
        const command = args[0].toLowerCase();

        // /sil <count>
        if (command === '/sil') {
            const count = parseInt(args[1]);
            if (!isNaN(count) && count > 0) {
                await bulkDeleteMessages(count);
                return { success: true, message: `${count} mesaj silindi.` }; // Do not save command
            } else {
                return { success: false, message: "Geçersiz sayı. Kullanım: /sil 10" };
            }
        }
    }

    // 3. Profanity Filter & XSS
    const dirtyContent = xss(parse.data.content);
    const cleanContent = cleanText(dirtyContent);

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 2. FIFO Logic (Cap at 100)
            const count = await tx.chatMessage.count();

            if (count >= 100) {
                const toDeleteCount = count - 99; // Keep 99, add 1 = 100
                if (toDeleteCount > 0) {
                    const oldMessages = await tx.chatMessage.findMany({
                        select: { id: true },
                        orderBy: { createdAt: 'asc' },
                        take: toDeleteCount
                    });

                    if (oldMessages.length > 0) {
                        await tx.chatMessage.deleteMany({
                            where: { id: { in: oldMessages.map(m => m.id) } }
                        });
                    }
                }
            }

            // 3. Create Message
            const newMessage = await tx.chatMessage.create({
                data: {
                    content: cleanContent,
                    parentId: parse.data.parentId,
                    userId: session.user.id
                },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            studentNumber: true
                        }
                    }
                }
            });

            return newMessage;
        });

        revalidatePath('/chat'); // Or wherever chat is used

        // Return structured DTO
        const maskedName = `${result.user.firstName} ${result.user.lastName ? result.user.lastName[0] + '.' : ''}`;
        const maskedNum = maskStudentNumber(result.user.studentNumber);

        const safePayload: ChatMessageDto = {
            id: result.id,
            content: result.content,
            createdAt: result.createdAt,
            parentId: result.parentId,
            user: {
                id: result.userId,
                name: `${maskedName} (${maskedNum})`
            }
        };

        // --- Pusher Trigger (Fire & Forget) ---
        pusherServer.trigger('global-chat', 'new-message', safePayload)
            .catch(err => console.error("Pusher Trigger Error:", err));

        return {
            success: true,
            message: "Mesaj gönderildi",
            data: safePayload
        };

    } catch (error) {
        console.error("sendMessage Error:", error);
        return { success: false, message: "Mesaj gönderilemedi." };
    }
}

export async function deleteMessage(messageId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, message: "Yetkisiz işlem." };

    try {
        const message = await prisma.chatMessage.findUnique({
            where: { id: messageId },
            select: { userId: true }
        });

        if (!message) return { success: false, message: "Mesaj bulunamadı." };

        const isAdmin = (session.user as any).role === 'ADMIN';
        const isOwner = message.userId === session.user.id;

        if (!isAdmin && !isOwner) {
            return { success: false, message: "Bu mesajı silme yetkiniz yok." };
        }

        await prisma.chatMessage.delete({
            where: { id: messageId }
        });

        revalidatePath('/chat');

        // Pusher Event: message-deleted
        pusherServer.trigger('global-chat', 'message-deleted', { id: messageId })
            .catch(err => console.error("Pusher Delete Error:", err));

        return { success: true, message: "Mesaj silindi." };

    } catch (error) {
        console.error("deleteMessage Error:", error);
        return { success: false, message: "Silme işlemi başarısız." };
    }
}

import { ChatMessageSchema, BulkDeleteSchema } from "@/lib/schemas"
// ...

// ...

export async function bulkDeleteMessages(count: number) {
    const session = await getServerSession(authOptions);

    // 1. Authorization Guard (Strict)
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
        console.warn(`[Security Audit] Unauthorized bulk delete attempt by UserID: ${session?.user?.id || 'Anonymous'}`);
        return { success: false, message: "Yetkisiz işlem: Sadece Adminler." };
    }

    try {
        // 2. Input Validation (Zod)
        // If > 100, we cap it or error? User said "100'e eşitle VEYA hata ver".
        // Let's coerce and validate.
        const safeCount = count > 100 ? 100 : count;

        const parse = BulkDeleteSchema.safeParse({ count: safeCount });
        if (!parse.success) {
            return { success: false, message: parse.error.issues[0].message };
        }

        const validCount = parse.data.count;

        // Get IDs
        const messagesToDelete = await prisma.chatMessage.findMany({
            select: { id: true },
            orderBy: { createdAt: 'desc' },
            take: validCount
        });

        if (messagesToDelete.length > 0) {
            await prisma.chatMessage.deleteMany({
                where: { id: { in: messagesToDelete.map((m: { id: string }) => m.id) } }
            });

            revalidatePath('/chat');

            // Pusher Event
            pusherServer.trigger('global-chat', 'chat-clear', { count: messagesToDelete.length })
                .catch(err => console.error("Pusher Bulk Delete Error:", err));

            // 3. Audit Log
            console.info(`[AUDIT] Admin ${session.user.email} (ID: ${session.user.id}) deleted ${messagesToDelete.length} messages.`);
        }

        return { success: true, message: `${messagesToDelete.length} mesaj silindi.` };

    } catch (error) {
        console.error("bulkDeleteMessages Error:", error);
        return { success: false, message: "Toplu silme başarısız." };
    }
}

export async function getChatMessages() {
    try {
        const session = await getServerSession(authOptions);
        const isLoggedIn = !!session?.user?.id;

        // 3. Conditional Limit
        const limit = isLoggedIn ? 100 : 10;

        const messages = await prisma.chatMessage.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' }, // Latest first
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        studentNumber: true
                    }
                }
            }
        });

        // Map to Safe DTO
        const safeMessages: ChatMessageDto[] = messages.map(msg => {
            const maskedName = `${msg.user.firstName} ${msg.user.lastName ? msg.user.lastName[0] + '.' : ''}`;
            const maskedNum = maskStudentNumber(msg.user.studentNumber);

            return {
                id: msg.id,
                content: msg.content,
                createdAt: msg.createdAt,
                parentId: msg.parentId,
                user: {
                    id: msg.user.id,
                    name: `${maskedName} (${maskedNum})`
                }
            };
        });

        // Return chronological order (Oldest -> Newest)
        return safeMessages.reverse();

    } catch (error) {
        console.error("getChatMessages Error:", error);
        return [];
    }
}
