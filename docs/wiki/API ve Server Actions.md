# API ve Server Actions

Mutasyonların çoğu **Server Action**; dosya ve auth için REST.

## REST API

| Method | Path | Amaç | Auth |
|--------|------|------|------|
| * | `/api/auth/[...nextauth]` | NextAuth | — |
| POST | `/api/auth/signup` | Minimal signup | Yok |
| POST | `/api/upload` | Note + NoteFile oluştur | Session |
| POST | `/api/upload-handler` | Blob client token | Session |
| POST | `/api/upload-blob-direct` | Küçük Blob upload | Session |
| POST | `/api/upload-blob` | Kimlik kartı Blob | Yok |
| GET | `/api/download/[noteId]` | Güvenli dosya + önizleme | Session |
| GET | `/api/files/[noteId]` | Proxy (+ fileIndex) | Session |
| GET | `/api/files/identity/[userId]` | Kimlik kartı | Owner/Admin |
| GET | `/api/notes/[noteId]/file` | Watermark’lı PDF | Session |
| POST | `/api/admin/notes/approve` | Onay +5 Süt | Admin |
| POST | `/api/admin/notes/reject` | Red | Admin |

## Server Actions (özet)

| Dosya | Öne çıkan export’lar |
|-------|----------------------|
| `auth.ts` | reset/forgot password, 2FA send/verify |
| `user.ts` | `registerUser`, uniqueness / identity checks |
| `academic.ts` | üniversite/fakülte/bölüm cascade |
| `getNotes.ts` | `getNotes` |
| `noteActions.ts` | detail, unlock, grade, comment, report, delete |
| `milk.ts` | add/spend credits, history |
| `storeActions.ts` | store CRUD, buy, redeem, partner dashboard |
| `adminActions.ts` | users, notes, reports, partners, stats, purchase logs |
| `chatActions.ts` | send/list/delete messages |
| `feedbackActions.ts` | `submitFeedback` |
| `changelogActions.ts` | create/list release notes |

Detaylı DTO önerileri (mobil migrasyon) kök dokümanda; güncel gerçekler için [[Kaynaklar ve Bilinen Sapmalar]].

## İlgili Sayfalar

- [[Sistem Mimari]]
- [[Veri Akışları]]
- [[Index]]
