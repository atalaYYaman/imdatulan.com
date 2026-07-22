# Dosya Proxy ve Watermark

Dosyalar asla ham Blob URL ile istemciye “açık” verilmez; erişim proxy üzerinden denetlenir.

## Blob Yükleme

| Endpoint | Auth | Kullanım |
|----------|------|----------|
| `POST /api/upload-handler` | Session | Büyük dosya client upload token (≤25MB) |
| `POST /api/upload-blob-direct` | Session | Küçük dosya FormData (≤4MB body) |
| `POST /api/upload-blob` | **Yok** | Kayıt sırasında öğrenci kimliği |
| `POST /api/upload` | Session | Blob URL’lerden Note + NoteFile oluştur |

Trusted domain: `blob.vercel-storage.com`, `pub-`.

## İndirme / Önizleme

### Birincil: `GET /api/download/[noteId]`

1. Session + rate limit (`download_${userId}`, 10/dk)
2. Note var mı / soft-delete / status
3. Erişim: sahip | ADMIN | Unlocked → tam dosya; değilse önizleme
4. SSRF koruması (Blob domain)
5. PDF locked önizleme (`pdf-lib`): 1–5 sayfa → 1; 6–10 → 2; 11+ → 3
6. `Cache-Control: no-store`; isteğe `X-Preview-Mode`

### Diğer

| Path | Amaç |
|------|------|
| `/api/files/[noteId]` | Basit proxy; `?fileIndex=` multi-file; admin önizleme |
| `/api/files/identity/[userId]` | Öğrenci kimliği (owner/admin) |
| `/api/notes/[noteId]/file` | Sunucu tarafı PDF watermark |

Locked non-PDF: `lib/lockedPlaceholderResponse.ts` (SVG).

## Watermark Stratejisi

| Katman | Nerede | Teknoloji |
|--------|--------|-----------|
| Birincil (istemci) | `NoteViewer` | Canvas: “OTLAK.COM.TR”, ad, öğrenci no |
| Alternatif (sunucu) | `/api/notes/[noteId]/file` | pdf-lib grid |
| Legacy | `lib/watermark.ts` | “NOD” — kullanılmıyor |

`/api/download` watermark **uygulamaz**; watermark viewer’da çizilir. Sağ tık engeli + overlay.

## İlgili Sayfalar

- [[Not Sistemi]]
- [[Veri Akışları]]
- [[Sistem Mimari]]
- [[Index]]
