# Sistem Mimari

Otlak, **Next.js App Router** üzerinde sunucu-ağırlıklı bir monolit: UI + Server Actions + REST API aynı süreçte çalışır; kalıcı durum PostgreSQL’de, dosyalar Vercel Blob’dadır.

## Katmanlar

```
┌─────────────────────────────────────────────┐
│  Browser (React Client Components)          │
│  NoteViewer, StoreClient, Admin listeleri   │
└──────────────────┬──────────────────────────┘
                   │ Server Actions / fetch
┌──────────────────▼──────────────────────────┐
│  Next.js Server                             │
│  middleware.ts (RBAC, session gate)         │
│  app/actions/*  ·  app/api/*                │
│  lib/* (auth, rate-limit, academic, milk)   │
└──────┬──────────────────────────┬───────────┘
       │ Prisma                   │ @vercel/blob
┌──────▼──────────┐    ┌──────────▼───────────┐
│  PostgreSQL     │    │  Vercel Blob         │
│  User, Note, …  │    │  PDF / görüntü / ID  │
└─────────────────┘    └──────────────────────┘
```

## Roller (RBAC)

| Rol | Erişim |
|-----|--------|
| `USER` | Onay sonrası tam uygulama (not, upload, store, …) |
| `ADMIN` | `/admin/*` + zorunlu 2FA (`isTwoFactorVerified`) |
| `PARTNER` | Yalnız `/`, `/store`, `/updates`, `/partner/*`, `/auth` |

Enforcement: `middleware.ts` + action/API içinde `getServerSession` / role kontrolü.

## Güvenlik İskeleti

- **Zero Trust dosya erişimi**: ham Blob URL listede dönmez; indirme `/api/download/[noteId]` üzerinden
- **Onay kapısı**: `approvalStatus !== APPROVED` (ADMIN hariç) → giriş engeli
- **Rate limit**: `lib/rate-limit.ts` → `RateLimit` tablosu (fail-closed)
- **IDOR**: not erişimi (sahip / unlocked / admin), kimlik kartı (owner/admin), partner store kapsamı
- **SSRF**: proxy yalnızca `blob.vercel-storage.com` / `pub-` URL’lerini kabul eder

Detay: [[Auth Servisi]], [[Dosya Proxy ve Watermark]], [[Süt Ekonomisi]].

## İş Mantığı Dağılımı

| Alan | Birincil dosyalar |
|------|-------------------|
| Auth | `lib/auth.ts`, `app/actions/auth.ts`, `app/actions/user.ts` |
| Notlar | `app/actions/noteActions.ts`, `app/actions/getNotes.ts`, `app/api/upload*` |
| Süt | `app/actions/milk.ts`, unlock/store path’leri |
| Mağaza | `app/actions/storeActions.ts` |
| Admin | `app/actions/adminActions.ts`, `app/api/admin/notes/*` |
| Chat | `app/actions/chatActions.ts`, `lib/pusher*.ts` |

## İlgili Sayfalar

- [[Proje Genel Bakış]]
- [[Veri Akışları]]
- [[API ve Server Actions]]
- [[Index]]
