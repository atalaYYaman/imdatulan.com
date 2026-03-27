import { z } from "zod";

// --- Validation Constants ---
// Allowed Mime Types for Uploads
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// --- Atomic Schemas ---

export const StudentNumberSchema = z.string().trim().min(1, {
    message: "Öğrenci numarası zorunludur."
});

export const PriceSchema = z.number()
    .min(1, "Fiyat en az 1 süt olmalıdır.")
    .max(50, "Fiyat en fazla 50 süt olabilir.");

// --- Admin / Partner Schemas ---

export const createPartnerSchema = z.object({
    name: z.string().min(2, "İsim en az 2 karakter olmalıdır."),
    email: z.string().email("Geçerli bir email adresi giriniz."),
    password: z.string().min(6, "Şifre en az 6 karakter olmalıdır.")
});

// --- Action Schemas ---

export const UnlockNoteSchema = z.object({
    noteId: z.string().cuid({ message: "Geçersiz Not ID formatı." })
});

export const NoteUploadSchema = z.object({
    title: z.string().min(3, "Başlık en az 3 karakter olmalıdır.").max(100, "Başlık çok uzun."),
    university: z.string().min(1, "Üniversite seçilmelidir."),
    faculty: z.string().min(1, "Fakülte seçilmelidir."),
    department: z.string().min(1, "Bölüm seçilmelidir."),
    courseName: z.string().optional(),
    description: z.string().max(500, "Açıklama 500 karakteri geçemez.").optional(),
    price: PriceSchema,
    term: z.string().optional(),
    isAI: z.boolean().default(false),
    fileUrl: z.string().url("Geçersiz dosya URL'i.")
});

export const ReportSchema = z.object({
    noteId: z.string().cuid(),
    reason: z.string().min(1, "Bir sebep seçmelisiniz."),
    details: z.string().max(1000).optional()
});

export const CommentSchema = z.object({
    noteId: z.string().cuid(),
    text: z.string().min(1, "Yorum boş olamaz.").max(500, "Yorum çok uzun.")
});

export const ChatMessageSchema = z.object({
    content: z.string()
        .min(1, "Mesaj boş olamaz")
        .max(280, "Mesaj 280 karakterden uzun olamaz")
        .refine(val => !/<[^>]*>/g.test(val), { message: "HTML etiketleri kullanılamaz." }), // Simple HTML check
    parentId: z.string().cuid().optional()
});

export const BulkDeleteSchema = z.object({
    count: z.number().min(1, "En az 1 mesaj silinmelidir.").max(100, "Tek seferde en fazla 100 mesaj silebilirsiniz.")
});
