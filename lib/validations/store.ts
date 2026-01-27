import { z } from "zod";

export const createStoreSchema = z.object({
    name: z.string().min(2, "Mağaza adı en az 2 karakter olmalıdır."),
    logo: z.string().optional(),
    location: z.string().optional(),
    contactInfo: z.string().optional(),
});

export const productSchema = z.object({
    title: z.string().min(2, "Ürün adı en az 2 karakter olmalıdır."),
    description: z.string().optional(),
    price: z.number().min(1, "Fiyat en az 1 Süt olmalıdır."),
    stock: z.number().min(0).optional(), // Optional, defaults to 0 or handled by logic
    image: z.string().optional(),
    type: z.enum(["PHYSICAL_ITEM", "COUPON", "SERVICE"]),
    storeId: z.string().min(1, "Mağaza seçimi zorunludur."),
});

export const assignPartnerSchema = z.object({
    email: z.string().email("Geçerli bir e-posta adresi giriniz."),
    storeId: z.string().min(1, "Mağaza seçimi zorunludur."),
});

export const redeemSchema = z.object({
    code: z.string().length(11, "Kod 11 karakterli olmalıdır (Örn: RD-ABC12345)."),
});
