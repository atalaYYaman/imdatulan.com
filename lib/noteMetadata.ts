/** Yükleme ekranı ve not keşif filtreleri ile paylaşılan sabitler */
export const NOTE_CONTENT_TYPES = [
    "Ders Notu",
    "Otlak Sorular",
    "Ödev",
    "Slayt",
] as const

export type NoteContentType = (typeof NOTE_CONTENT_TYPES)[number]

/** Açılış fiyatı (süt) — şema: 1–5, yükleme UI ile uyumlu */
export const NOTE_PRICE_OPTIONS = [1, 2, 3, 4, 5] as const
