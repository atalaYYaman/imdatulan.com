# Süt Ekonomisi

**Süt** = `User.credits`. Tüm anlamlı hareketler ideal olarak `Transaction` ile denetlenir; bazı admin onay yolları hâlâ doğrudan `increment` kullanır (bkz. sapmalar).

Dosyalar: `app/actions/milk.ts`, `unlockNote` (`noteActions.ts`), `buyStoreProduct` (`storeActions.ts`).

## Temel Operasyonlar

| Fonksiyon | Davranış |
|-----------|----------|
| `addCredits` | Atomik: bakiye artır + `Transaction` (pozitif) |
| `spendCredits` | Atomik: yetersiz bakiye kontrolü + negatif `Transaction` |
| `unlockNote` | Alıcı −price, yükleyici +price, `UnlockedNote`, iki Transaction |
| `buyStoreProduct` | Stok + credits −cost + `StoreTransaction` (kod) |

## Kazanç Kaynakları (güncel kod)

| Kaynak | Miktar | Transaction? |
|--------|--------|----------------|
| Admin not onayı (canlı UI → `/api/admin/notes/approve`) | **+5** sabit | Hayır (doğrudan increment) |
| `adminActions.approveNote` (eski/paralel) | **+3** | Hayır |
| Not satışı (`unlockNote`) | `note.price` (1–5) | Evet (`NOTE_UNLOCK`) |
| NoteGrade | Yok | — |

## Harcama

- Not açma → `NOTE_UNLOCK`
- Mağaza ürünü → `PRODUCT_PURCHASE` (+ redemption kodu)

## Audit Alanları

`Transaction`: `amount`, `balanceAfter`, `type`, `description?`, `referenceId?`.

Cüzdan UI: `/profile/wallet` ← `getTransactionHistory`.

## Koruma

- Credit değişimleri (milk/unlock/store) → `prisma.$transaction`
- Zod şemaları (`UnlockNoteSchema`, store schemas)
- Rate limit: download, redeem, upload vb. — [[Sistem Mimari]]

## İlgili Sayfalar

- [[Veri Akışları]]
- [[Mağaza ve Partner]]
- [[Not Sistemi]]
- [[Kaynaklar ve Bilinen Sapmalar]]
- [[Index]]
