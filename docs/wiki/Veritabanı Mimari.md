# Veritabanı Mimari

Kaynak: `prisma/schema.prisma` (PostgreSQL).

## Çekirdek Modeller

| Model | Amaç |
|-------|------|
| **User** | Kimlik, rol, academic, `credits`, `approvalStatus`, partner `storeId` |
| **Note** | Ders materyali meta + legacy `fileUrl` |
| **NoteFile** | Not başına çoklu dosya (`sortOrder`, `pageCount`, extension) |
| **UnlockedNote** | Satın alma kaydı (`userId`+`noteId` unique) |
| **Transaction** | Süt hareket audit (`amount`, `balanceAfter`, `type`) |
| **NoteGrade** | Harf notu (AA–FF) + numeric `score` |
| **Comment**, **View**, **Report** | Etkileşim / moderasyon |
| **Store**, **StoreProduct**, **StoreTransaction** | Partner mağaza + redemption |
| **Product**, **ProductPurchase** | Eski/ayrı in-app ürünler |
| **University**, **Faculty**, **Department** | Akademik hiyerarşi |
| **ChatMessage** | Global chat (FIFO mantığı action’da) |
| **Feedback**, **ReleaseNote** | Geri bildirim / changelog |
| **VerificationToken**, **TwoFactorToken**, **TwoFactorConfirmation** | Auth |
| **RateLimit** | DB tabanlı rate limit |

## User Durumları

- `role`: `USER` | `ADMIN` | `PARTNER`
- `approvalStatus`: `PENDING` | `APPROVED` | `REJECTED` | `BANNED`
- `credits`: Süt bakiyesi (varsayılan 0)

## Note Durumları

- `status`: `PENDING` | `APPROVED` | `REJECTED` | `SUSPENDED`
- Soft delete: `deletedAt`
- Fiyat: pratikte **1–5** Süt (şema yorumu hâlâ “1–3” diyebilir)

## TransactionType

`UPLOAD_REWARD` · `NOTE_UNLOCK` · `ADMIN_ADJUSTMENT` · `PRODUCT_PURCHASE` · `REFUND`

## Akademik İlişkiler

```
University 1──* User, Note   (opsiyonel FK + string mirror alanlar)
Faculty    1──* Department
Department *── User, Note
```

String mirror’lar (`university`, `faculty`, `department`) gösterim / anonimleştirme için; tercihen FK’ler (`universityId` …) kaynak kabul edilir. Bkz. [[Akademik Hiyerarşi]].

## Note ↔ Dosya

```
Note 1──* NoteFile
Note.fileUrl / pageCount / fileExtension  ≈  ilk dosyanın legacy kopyası
```

## Kritik İlişki: Unlock

```
User ── UnlockedNote ── Note
         (unique userId+noteId)
```

Erişim kararları [[Dosya Proxy ve Watermark]] ve `unlockNote` ile bağlıdır.

## İlgili Sayfalar

- [[Süt Ekonomisi]]
- [[Not Sistemi]]
- [[Sistem Mimari]]
- [[Index]]
