'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { TransactionType } from "@prisma/client"
import { revalidatePath } from "next/cache"

export type TransactionResult = {
    success: boolean
    message: string
    newBalance?: number
}

import { z } from "zod";

const TransactionSchema = z.object({
    userId: z.string().cuid(),
    amount: z.number().positive("Amount must be positive"),
    type: z.nativeEnum(TransactionType),
    description: z.string().min(1),
    referenceId: z.string().optional()
});

/**
 * Adds credits (Milk) to a user's account securely.
 * Wraps the update in a transaction to ensure log integrity.
 */
export async function addCredits(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    referenceId?: string
): Promise<TransactionResult> {
    try {
        // Validation
        const validation = TransactionSchema.safeParse({ userId, amount, type, description, referenceId });
        if (!validation.success) {
            return { success: false, message: "Invalid input: " + validation.error.issues.map(e => e.message).join(", ") };
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Get current user to ensure valid and get current balance
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { credits: true }
            })

            if (!user) {
                throw new Error("User not found")
            }

            const newBalance = user.credits + amount

            // 2. Update User Balance
            await tx.user.update({
                where: { id: userId },
                data: { credits: newBalance }
            })

            // 3. Create Transaction Record
            await tx.transaction.create({
                data: {
                    userId,
                    amount,
                    balanceAfter: newBalance,
                    type,
                    description,
                    referenceId
                }
            })

            return newBalance
        })

        revalidatePath('/') // Revalidate potentially generic paths, or specific ones if known
        return { success: true, message: "Credits added successfully", newBalance: result }

    } catch (error) {
        console.error("addCredits Error:", error)
        return { success: false, message: error instanceof Error ? error.message : "Transaction failed" }
    }
}

/**
 * Deducts credits from a user's account securely.
 * Checks balance and wraps in transaction.
 */
export async function spendCredits(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    referenceId?: string
): Promise<TransactionResult> {
    try {
        // Validation
        const validation = TransactionSchema.safeParse({ userId, amount, type, description, referenceId });
        if (!validation.success) {
            return { success: false, message: "Invalid input: " + validation.error.issues.map(e => e.message).join(", ") };
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Lock/Get User & Check Balance
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { credits: true }
            })

            if (!user) {
                throw new Error("User not found")
            }

            if (user.credits < amount) {
                throw new Error("Insufficient credits")
            }

            const newBalance = user.credits - amount

            // 2. Deduct Balance
            await tx.user.update({
                where: { id: userId },
                data: { credits: newBalance }
            })

            // 3. Create Transaction Record
            await tx.transaction.create({
                data: {
                    userId,
                    amount: -amount, // Stored as negative
                    balanceAfter: newBalance,
                    type,
                    description,
                    referenceId
                }
            })

            return newBalance
        })

        revalidatePath('/')
        return { success: true, message: "Transaction successful", newBalance: result }

    } catch (error) {
        console.error("spendCredits Error:", error)
        return { success: false, message: error instanceof Error ? error.message : "Transaction failed" }
    }
}

export async function getTransactionHistory(limit = 20) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return []
    }

    try {
        const transactions = await prisma.transaction.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: limit
        })
        return transactions
    } catch (error) {
        console.error("Failed to fetch transaction history:", error)
        return []
    }
}
