# Proje Genel Bakış

**Otlak** (`otlak-com`), öğrencilerin ders notlarını yükleyip satabildiği, kazandıkları **Süt** ile partner mağazalardan ürün alabildiği bir web platformudur.

## Ürün Özeti

- Not yükle → admin onayla → Süt kazan
- Notları Süt ile aç (unlock) → yükleyiciye Süt aktar
- Mağazada Süt harca → redemption kodu al → partner doğrular
- Admin: kullanıcı onayı, not moderasyonu, raporlar, mağaza yönetimi

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 16 (App Router), React 19 |
| Auth | NextAuth v4 (Credentials + JWT) |
| DB | PostgreSQL + Prisma 5 |
| Storage | Vercel Blob |
| Realtime | Pusher (chat; feature flag kapalı) |
| E-posta | Resend |
| Validasyon | Zod |
| PDF | pdf-lib, react-pdf |
| Stil | Tailwind CSS 4 |

## Dizin Yapısı

```
app/           # Sayfalar, API routes, Server Actions
components/    # UI (auth, note, admin, store, chat, …)
lib/           # Auth, prisma, rate-limit, academic, watermark helpers
prisma/        # schema.prisma + migrations
scripts/       # seed, cleanup, e-posta testleri
docs/raw/      # Ham dış belgeler (şu an boş)
docs/wiki/     # Bu Wiki
```

## Önemli Rotalar

| Rota | Amaç |
|------|------|
| `/notes`, `/notes/[noteId]` | Keşfet + canlı not detayı |
| `/upload` | Çoklu dosya yükleme |
| `/store`, `/partner/dashboard` | Mağaza / partner |
| `/profile`, `/profile/wallet` | Profil ve Süt geçmişi |
| `/admin/*` | Yönetim paneli (ADMIN + 2FA) |
| `/auth/*` | Giriş, kayıt, şifre, 2FA |

Legacy / mock: `/note/[id]` ve `/top-noder` hâlâ `lib/dummyData` kullanır.

## İlgili Sayfalar

- [[Sistem Mimari]]
- [[Veri Akışları]]
- [[Veritabanı Mimari]]
- [[Index]]
