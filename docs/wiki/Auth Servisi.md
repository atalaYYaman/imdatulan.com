# Auth Servisi

Dosyalar: `lib/auth.ts`, `app/actions/auth.ts`, `app/actions/user.ts`, `middleware.ts`, `app/api/auth/[...nextauth]/route.ts`.

## Strateji

- Provider: **Credentials** (e-posta + şifre, bcrypt)
- Session: **JWT**
- Kayıt: `registerUser` → `approvalStatus: PENDING` (öğrenci kimliği Blob URL ile)
- Minimal legacy: `POST /api/auth/signup` (yalnız e-posta+şifre; akademik akış yok)

## Giriş Kuralları

1. Rate limit: e-posta başına 5 deneme / 60s
2. `BANNED` → engel
3. `role !== ADMIN` ve `approvalStatus !== APPROVED` → “henüz onaylanmadı”
4. ADMIN: girişte `TwoFactorConfirmation` silinir → middleware `/auth/verify-email`’e yönlendirir

## 2FA (yalnız ADMIN)

- `sendTwoFactorEmail` → `TwoFactorToken`
- `verifyTwoFactor` → `TwoFactorConfirmation`
- JWT callback: confirmation varsa `isTwoFactorVerified: true`
- `/admin/*` erişimi 2FA olmadan yok

## Şifre Sıfırlama

`sendPasswordResetEmail` → `VerificationToken` → `resetPassword` (`/auth/forgot-password`, `/auth/new-password`).

## Middleware Özeti

| Koşul | Davranış |
|-------|----------|
| `/admin/*` ve rol ≠ ADMIN | `/` |
| ADMIN ama 2FA yok | `/auth/verify-email` |
| PARTNER ve izinli path dışı | `/` |
| `/notes`, `/api/download` | Session zorunlu |
| `/chat` ve `CHAT_ENABLED=false` | `/` |

Matcher: admin, partner, profile, notes, chat, upload, store, feedback, updates, top-noder, support, download API.

## Roller → Özellikler

Detaylı path tablosu: [[Sistem Mimari]]. Partner mağaza erişimi: [[Mağaza ve Partner]].

## İlgili Sayfalar

- [[Akademik Hiyerarşi]]
- [[API ve Server Actions]]
- [[Index]]
