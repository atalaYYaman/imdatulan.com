import { z } from "zod";

// --- Validation Constants ---
const STUDENT_NUMBER_REGEX = /^[0-9]{11}$/;
// Allowed Mime Types for Uploads
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// --- Atomic Schemas ---

export const StudentNumberSchema = z.string().regex(STUDENT_NUMBER_REGEX, {
    message: "Öğrenci numarası 11 haneli sayı olmalıdır."
});

export const PriceSchema = z.number()
    .min(1, "Fiyat en az 1 süt olmalıdır.")
    .max(50, "Fiyat en fazla 50 süt olabilir.");

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
