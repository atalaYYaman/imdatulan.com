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
import { ChatMessageSchema } from "@/lib/schemas"

// --- Validation ---
// Schema moved to @/lib/schemas

// --- Types ---
export type ChatMessageDto = {
    id: string
    content: string
    createdAt: Date
    user: {
        id: string
        name: string
        // We do NOT expose email or sensitive data
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

    // 3. Profanity Filter & XSS
    const dirtyContent = xss(parse.data.content);
    const cleanContent = cleanText(dirtyContent);

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 2. FIFO Logic (Cap at 100)
            const count = await tx.chatMessage.count();

            if (count >= 100) {
                // Delete oldest N messages to make room
                // Prisma doesn't support LIMIT in DELETE directly effectively without IDs
                // So we fetch the IDs of the oldest (count - 99) messages
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

        return {
            success: true,
            message: "Mesaj gönderildi",
            data: {
                id: result.id,
                content: result.content,
                createdAt: result.createdAt,
                user: {
                    id: result.userId,
                    name: `${maskedName} (${maskedNum})`
                },
                parentId: result.parentId
            }
        };

    } catch (error) {
        console.error("sendMessage Error:", error);
        return { success: false, message: "Mesaj gönderilemedi." };
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

        // Usually chat UI wants oldest at top (asc), but we fetched desc to get "latest".
        // So reverse it for the UI if needed, or let UI handle it. 
        // Let's reverse here to return chronological order (Oldest -> Newest)
        return safeMessages.reverse();

    } catch (error) {
        console.error("getChatMessages Error:", error);
        return [];
    }
}
