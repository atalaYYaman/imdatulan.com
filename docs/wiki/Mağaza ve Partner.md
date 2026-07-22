# Mağaza ve Partner

Dosyalar: `app/actions/storeActions.ts`, `lib/validations/store.ts`, `components/store/*`, `components/partner/*`, `app/store`, `app/partner/dashboard`, `app/admin/stores*`, `app/admin/partners`.

## Kavramlar

- **Store**: Partner işletme (logo, konum, aktiflik)
- **StoreProduct**: Süt fiyatlı ürün (`PHYSICAL_ITEM` | `COUPON` | `SERVICE`)
- **StoreTransaction**: Kullanıcı satın alımı + `redemptionCode`
- **PARTNER** kullanıcı: `User.storeId` ile mağazaya bağlı

## Kullanıcı Akışı

1. `/store` → `getStoreProducts`
2. `buyStoreProduct({ productId })` — stok, bakiye, kod üretimi
3. Kod formatı: `RD-` + 8 hex (`RD-A1B2C3D4`)
4. Kullanıcı kodlarını `getUserCoupons` ile görür

## Partner Akışı

1. `/partner/dashboard` → `getPartnerDashboard` (store, ürünler, işlemler)
2. `redeemProduct({ code })` — rate limit 10 / 5 dk
3. Kontroller: kod bu store’a ait mi, daha önce redeem edilmemiş mi
4. `updateProductStock` — yalnız kendi store ürünleri

## Admin

- Mağaza oluştur: `createStore`
- Ürün ekle: `addProduct`
- Partner ata: `assignPartner` / `createPartnerUser`
- Purchase log’lar: `getPurchaseLogsAdmin` (not unlock audit UI)

Middleware: PARTNER diğer app rotalarına giremez. Bkz. [[Auth Servisi]].

## İlgili Sayfalar

- [[Süt Ekonomisi]]
- [[Veri Akışları]]
- [[Admin Modülü]]
- [[Index]]
