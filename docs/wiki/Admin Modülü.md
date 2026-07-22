# Admin Modülü

Rotalar: `app/admin/*` · Actions: `app/actions/adminActions.ts` · API: `app/api/admin/notes/*`.

Erişim: `role === ADMIN` **ve** 2FA. Bkz. [[Auth Servisi]].

## Paneller

| Path | İş |
|------|-----|
| `/admin` | Hub |
| `/admin/users` | Bekleyen kullanıcı onay/red |
| `/admin/notes` | Bekleyen not onay/red |
| `/admin/reports` | Şikayet çözümleme |
| `/admin/stats` | Sayaçlar |
| `/admin/stores`, `/admin/stores/[storeId]` | Mağaza / ürün |
| `/admin/partners` | Partner oluştur/listele |
| `/admin/purchase-logs` | Not satın alma logları |
| `/admin/feedback` | Geri bildirimler |
| `/admin/changelog` | Release note oluştur |

## Kritik Action / API

| İşlem | Kaynak | Not |
|-------|--------|-----|
| Kullanıcı onay/red | `approveUser` / `rejectUser` | Red sebebi, `rejectionCount` |
| Not onay (canlı UI) | `POST /api/admin/notes/approve` | +**5** Süt, e-posta |
| Not red | `POST /api/admin/notes/reject` | e-posta |
| Not onay (action) | `approveNote` | +**3** Süt — UI tercih etmiyor |
| Rapor | `resolveReport` | |
| Partner | `createPartnerUser`, `assignPartner` | |

## Bileşenler

`components/admin/`: `UserApprovalList`, `NoteApprovalList`, store/partner client’lar, purchase log listesi.

## İlgili Sayfalar

- [[Not Sistemi]]
- [[Süt Ekonomisi]]
- [[Mağaza ve Partner]]
- [[Index]]
