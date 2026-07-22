# Otlak Wiki — Dizin Haritası

Üniversite öğrencileri arasında ders notu paylaşımı, **Süt** ekonomisi ve partner mağaza sistemi üzerine kurulu Next.js platformu.

> `docs/raw/` şu an boş. Kök dizindeki `SYSTEM_ARCHITECTURE_DOCUMENT.md` (mobil migrasyon blueprint’i) kaynak olarak işlendi; güncel kod ile çelişen noktalar wiki’de düzeltilerek yansıtıldı.

---

## Hızlı Başlangıç

| Sayfa | Ne anlatır? |
|-------|-------------|
| [[Proje Genel Bakış]] | Ürün özeti, stack, dizin yapısı |
| [[Sistem Mimari]] | Katmanlar, roller, güvenlik iskeleti |
| [[Veri Akışları]] | Kayıt → yükleme → onay → satış → harcama |
| [[Veritabanı Mimari]] | Prisma modelleri ve ilişkiler |
| [[Süt Ekonomisi]] | Credits, Transaction, unlock / store |

---

## Ana Modüller

- [[Auth Servisi]] — NextAuth, onay, 2FA, RBAC
- [[Not Sistemi]] — Yükleme, çoklu dosya, not detay, not notu (grade)
- [[Akademik Hiyerarşi]] — University / Faculty / Department
- [[Dosya Proxy ve Watermark]] — Blob, indirme proxy, önizleme
- [[Mağaza ve Partner]] — Store, redemption kodları
- [[Admin Modülü]] — Kullanıcı / not / rapor / mağaza yönetimi
- [[Chat Sistemi]] — Pusher global chat (şu an kapalı)
- [[API ve Server Actions]] — Endpoint ve action envanteri

---

## Referans

- [[Kaynaklar ve Bilinen Sapmalar]] — Ham dokümanlar, doküman↔kod farkları
- Kod kökü: `app/`, `lib/`, `components/`, `prisma/`
- Mimari blueprint (kök): `SYSTEM_ARCHITECTURE_DOCUMENT.md`

---

## Obsidian

Bu klasör Obsidian vault bağlantıları (`[[Sayfa]]`) ile gezilebilir. Yeni `docs/raw/` belgesi eklendiğinde ilgili sayfalar güncellenmeli ve bu Index’e bağlanmalıdır.
