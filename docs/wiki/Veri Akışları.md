# Veri Akışları

Uçtan uca ana iş akışları. Kaynak: kod + kök `SYSTEM_ARCHITECTURE_DOCUMENT.md` (güncel sapmalar için [[Kaynaklar ve Bilinen Sapmalar]]).

## 1. Kayıt ve Onay

```
SignUpForm
  → öğrenci kimliği: POST /api/upload-blob (oturumsuz)
  → registerUser (academic FKs, hash, PENDING)
  → Admin: approveUser / rejectUser
  → Sign-in: NextAuth (APPROVED veya ADMIN)
  → ADMIN ise 2FA: verify-email → TwoFactorConfirmation
```

Bkz. [[Auth Servisi]], [[Akademik Hiyerarşi]].

## 2. Not Yükleme → Onay → Ödül

```
/upload (çoklu dosya, ≤25MB toplam)
  → >4MB: /api/upload-handler (Blob client token)
  → ≤4MB: /api/upload-blob-direct
  → POST /api/upload → Note + NoteFile[] (PENDING)
  → Admin UI: POST /api/admin/notes/approve
       → status APPROVED, uploader.credits += 5
```

> Not: `adminActions.approveNote` hâlâ +3 Süt yazar ama canlı UI API’yi (+5) kullanır. Onay yolu şu an `Transaction` kaydı oluşturmaz (`addCredits` kullanmaz).

Bkz. [[Not Sistemi]], [[Süt Ekonomisi]].

## 3. Not Keşfi ve Unlock (Satış)

```
getNotes → liste (fileUrl yok; proxy URL)
  → getNoteDetail
  → unlockNote (atomik prisma.$transaction):
       buyer.credits -= price  (+ Transaction NOTE_UNLOCK)
       uploader.credits += price (+ Transaction)
       UnlockedNote oluştur
  → /api/download/[noteId]:
       unlocked/owner/admin → tam dosya
       diğerleri → PDF önizleme (sayfa kırpma) veya locked placeholder
```

Watermark: birincil olarak istemci `NoteViewer` canvas; alternatif sunucu watermark `/api/notes/[noteId]/file`.

## 4. Not Notu (Grade)

Eski “like” modeli kaldırıldı.

```
Unlocked kullanıcı → submitNoteGrade (AA–FF)
  → NoteGrade upsert (score 10…1)
  → Süt ödülü yok
```

## 5. Mağaza Harcama ve Partner Redeem

```
buyStoreProduct:
  stok kontrolü → credits düş → StoreTransaction + RD-XXXXXXXX kodu
Partner:
  redeemProduct(code) → isRedeemed, redeemedAt, redeemedBy
```

Bkz. [[Mağaza ve Partner]].

## 6. Süt Bakiyesi Okuma

`User.credits` tek gerçek kaynak; audit için `Transaction.balanceAfter`. Cüzdan: `getTransactionHistory` → `/profile/wallet`.

## Özet Diyagram (Milk)

```
USER.credits ◄──► Transaction (audit)
    │
    ├── NOTE_UNLOCK ──► UnlockedNote (+ uploader credits)
    ├── UPLOAD_REWARD (tasarım; onay yolu çoğunlukla doğrudan increment)
    └── PRODUCT_PURCHASE ──► StoreTransaction ──► Partner redeem
```

## İlgili Sayfalar

- [[Sistem Mimari]]
- [[Süt Ekonomisi]]
- [[Dosya Proxy ve Watermark]]
- [[Index]]
