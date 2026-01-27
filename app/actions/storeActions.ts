'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import {
    createStoreSchema,
    productSchema,
    assignPartnerSchema,
    redeemSchema
} from '@/lib/validations/store';
import { checkRateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

// --- ADMIN ACTIONS ---

export async function createStore(data: FormData | any) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
        return { success: false, message: 'Yetkisiz işlem.' };
    }

    // Handle both FormData and direct object
    const rawData = data instanceof FormData ? Object.fromEntries(data) : data;
    const parsed = createStoreSchema.safeParse(rawData);

    if (!parsed.success) {
        return { success: false, message: parsed.error.issues[0].message };
    }

    try {
        await prisma.store.create({
            data: {
                name: parsed.data.name,
                logo: parsed.data.logo || null,
                location: parsed.data.location || null,
                contactInfo: parsed.data.contactInfo || null,
            }
        });
        revalidatePath('/admin/stores'); // Verify this path later
        return { success: true, message: 'Mağaza başarıyla oluşturuldu.' };
    } catch (error) {
        console.error('Create Store Error:', error);
        return { success: false, message: 'Mağaza oluşturulurken bir hata oluştu.' };
    }
}

export async function addProduct(data: any) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
        return { success: false, message: 'Yetkisiz işlem.' };
    }

    const parsed = productSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, message: parsed.error.issues[0].message };
    }

    try {
        await prisma.storeProduct.create({
            data: {
                title: parsed.data.title,
                description: parsed.data.description,
                price: parsed.data.price,
                stock: parsed.data.stock ?? 0,
                image: parsed.data.image,
                type: parsed.data.type,
                storeId: parsed.data.storeId,
            }
        });
        revalidatePath(`/stores/${parsed.data.storeId}`);
        return { success: true, message: 'Ürün başarıyla eklendi.' };
    } catch (error) {
        console.error('Add Product Error:', error);
        return { success: false, message: 'Ürün eklenirken bir hata oluştu.' };
    }
}

export async function assignPartner(data: any) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
        return { success: false, message: 'Yetkisiz işlem.' };
    }

    const parsed = assignPartnerSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, message: parsed.error.issues[0].message };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: parsed.data.email }
        });

        if (!user) {
            return { success: false, message: 'Kullanıcı bulunamadı.' };
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                role: 'PARTNER',
                storeId: parsed.data.storeId
            }
        });

        revalidatePath('/admin/users');
        return { success: true, message: 'Kullanıcı PARTNER olarak atandı.' };
    } catch (error) {
        return { success: false, message: 'Atama işleminde hata oluştu.' };
    }
}

// --- USER ACTIONS ---

export async function getUserCoupons() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, message: 'Giriş yapmalısınız.' };

    try {
        const coupons = await prisma.storeTransaction.findMany({
            where: { userId: session.user.id },
            include: {
                store: true,
                product: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: coupons };
    } catch (error) {
        return { success: false, message: 'Kuponlar yüklenemedi.' };
    }
}

export async function getStoreProducts(storeId?: string) {
    const isStoreOpen = process.env.STORE_OPEN === 'true';

    // If calling from admin/partner dashboard, maybe we skip this?
    // But for public store:
    if (!isStoreOpen) {
        // Return a flag so UI can show "Closed" banner instead of empty list
        return { success: false, message: 'Mağaza şu anda kapalıdır.', maintenance: true };
    }

    try {
        const where = { isActive: true, ...(storeId ? { storeId } : {}) };
        const products = await prisma.storeProduct.findMany({
            where,
            include: { store: true },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: products };
    } catch (error) {
        return { success: false, message: 'Ürünler yüklenemedi.' };
    }
}

export async function buyStoreProduct(productId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { success: false, message: 'Giriş yapmalısınız.' };
    }

    if (process.env.STORE_OPEN !== 'true') {
        return { success: false, message: 'Mağaza şu anda hizmet dışıdır.' };
    }

    const userId = session.user.id;

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get User Balance & Product (Locking?)
            // Prisma doesn't do row locking easily without raw query, but we can check values in transaction.

            const user = await tx.user.findUniqueOrThrow({
                where: { id: userId },
                select: { credits: true }
            });

            const product = await tx.storeProduct.findUniqueOrThrow({
                where: { id: productId }
            });

            if (!product.isActive) {
                throw new Error('Ürün satışta değil.');
            }

            if (product.stock !== null && product.stock <= 0) {
                throw new Error('Stok tükendi.');
            }

            if (user.credits < product.price) {
                throw new Error('Yetersiz Süt bakiyesi.');
            }

            // 2. Decrement Stock (Atomic Check)
            // We use updateMany to ensure stock > 0 at the moment of update
            if (product.stock !== null) {
                const updateResult = await tx.storeProduct.updateMany({
                    where: {
                        id: productId,
                        stock: { gt: 0 } // Atomic Guard
                    },
                    data: { stock: { decrement: 1 } }
                });

                if (updateResult.count === 0) {
                    throw new Error('Stok tükendi veya ürün bulunamadı.');
                }
            }

            // 3. Deduct Credits
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: { credits: { decrement: product.price } }
            });

            // 4. Generate Redemption Code (Secure)
            const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 chars hex
            const code = `RD-${randomBytes}`; // Prefix for readability (e.g. RD-A1B2C3D4)

            // 5. Create Transaction Records
            await tx.storeTransaction.create({
                data: {
                    userId,
                    storeId: product.storeId,
                    productId,
                    cost: product.price,
                    redemptionCode: code,
                }
            });

            await tx.transaction.create({
                data: {
                    userId,
                    amount: -product.price,
                    balanceAfter: updatedUser.credits,
                    type: 'PRODUCT_PURCHASE', // Using existing enum
                    description: `${product.title} satın alımı`,
                    referenceId: productId
                }
            });

            return code;
        });

        revalidatePath('/store');
        revalidatePath('/profile/wallet');
        revalidatePath('/profile');
        return { success: true, message: 'Satın alma başarılı!', code: result };

    } catch (error: any) {
        return { success: false, message: error.message || 'İşlem başarısız.' };
    }
}


// --- PARTNER ACTIONS ---

export async function getPartnerDashboard() {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (user?.role !== 'PARTNER' || !user?.storeId) {
        return { success: false, message: 'Yetkisiz erişim.' };
    }

    try {
        const store = await prisma.store.findUnique({
            where: { id: user.storeId },
            include: {
                products: true,
                transactions: {
                    include: { user: true, product: true },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        return { success: true, data: store };
    } catch (error) {
        return { success: false, message: 'Veriler alınamadı.' };
    }
}

export async function redeemProduct(code: string) {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (user?.role !== 'PARTNER' || !user?.storeId) {
        return { success: false, message: 'Yetkisiz işlem.' };
    }

    // Rate Limit: 10 failed/attempts per 5 minutes per user
    const rateLimit = await checkRateLimit(`redeem-${user.id}`, 10, 300);
    if (!rateLimit.success) {
        return { success: false, message: 'Çok fazla deneme yaptınız. Lütfen bekleyin.' };
    }

    try {
        const parse = redeemSchema.safeParse({ code });
        if (!parse.success) return { success: false, message: 'Geçersiz kod.' };

        const transaction = await prisma.storeTransaction.findUnique({
            where: { redemptionCode: code },
            include: { product: true }
        });

        if (!transaction) {
            return { success: false, message: 'Kod bulunamadı.' };
        }

        if (transaction.storeId !== user.storeId) {
            return { success: false, message: 'Bu kod başka bir mağazaya ait.' };
        }

        if (transaction.isRedeemed) {
            return { success: false, message: 'Bu kod daha önce kullanılmış.' };
        }

        await prisma.storeTransaction.update({
            where: { id: transaction.id },
            data: {
                isRedeemed: true,
                redeemedAt: new Date(),
                redeemedBy: user.id
            }
        });

        revalidatePath('/partner');
        return { success: true, message: 'Kod başarıyla kullanıldı!', product: transaction.product.title };

    } catch (error) {
        return { success: false, message: 'İşlem hatası.' };
    }
}

export async function updateProductStock(productId: string, newStock: number) {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (user?.role !== 'PARTNER' || !user?.storeId) {
        return { success: false, message: 'Yetkisiz işlem.' };
    }

    if (newStock < 0) {
        return { success: false, message: 'Stok sayısı negatif olamaz.' };
    }

    try {
        const product = await prisma.storeProduct.findUnique({
            where: { id: productId }
        });

        if (!product || product.storeId !== user.storeId) {
            return { success: false, message: 'Ürün bulunamadı veya yetkiniz yok.' };
        }

        await prisma.storeProduct.update({
            where: { id: productId },
            data: { stock: newStock }
        });

        revalidatePath('/partner');
        return { success: true, message: 'Stok güncellendi.' };

    } catch (error) {
        return { success: false, message: 'Stok güncellenemedi.' };
    }
}
