'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getProducts() {
    try {
        return await prisma.product.findMany({
            where: { isActive: true },
            orderBy: { price: 'asc' }
        })
    } catch (error) {
        console.error("Error fetching products:", error)
        return []
    }
}

export async function buyProduct(productId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return { success: false, message: "Unauthorized" }

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (!user) return { success: false, message: "Kullanıcı bulunamadı" }

        const product = await prisma.product.findUnique({ where: { id: productId } })
        if (!product) return { success: false, message: "Ürün bulunamadı" }

        if (!product.isActive) {
            return { success: false, message: "Ürün satışta değil" }
        }

        if (product.stock !== null && product.stock <= 0) {
            return { success: false, message: "Stokta kalmadı" }
        }

        if (user.credits < product.price) {
            return { success: false, message: "Yetersiz Süt Bakiyesi" }
        }

        // Transaction
        // Decrease credits, create purchase, decrement stock (if applicable)
        const operations: any[] = [
            prisma.user.update({
                where: { id: user.id },
                data: { credits: { decrement: product.price } }
            }),
            prisma.productPurchase.create({
                data: {
                    userId: user.id,
                    productId: product.id,
                    priceAtTime: product.price
                }
            })
        ];

        if (product.stock !== null) {
            operations.push(
                prisma.product.update({
                    where: { id: productId },
                    data: { stock: { decrement: 1 } }
                })
            )
        }

        await prisma.$transaction(operations)

        revalidatePath('/store')
        revalidatePath('/') // Revalidate credits header
        return { success: true, message: "Satın alma başarılı!" }

    } catch (error) {
        console.error("Error buying product:", error)
        return { success: false, message: "Satın alma sırasında bir hata oluştu" }
    }
}
