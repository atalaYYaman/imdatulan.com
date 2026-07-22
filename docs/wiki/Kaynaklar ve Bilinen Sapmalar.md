# Kaynaklar ve Bilinen Sapmalar

## Ham Kaynaklar

| Konum | Durum |
|-------|--------|
| `docs/raw/` | **Boş** (henüz dış belge yok) |
| `SYSTEM_ARCHITECTURE_DOCUMENT.md` (repo kökü) | Mobil migrasyon blueprint’i (Şub 2025). Wiki ilk haritasında işlendi. |
| `prisma/schema.prisma` | Güncel şema — birincil doğruluk kaynağı |
| Kod (`app/`, `lib/`, `middleware.ts`) | Çalışan davranış |

Yeni PDF/API belgesi `docs/raw/` altına eklendiğinde ilgili Wiki sayfaları ve [[Index]] güncellenmelidir.

## Doküman ↔ Kod Sapmaları

Blueprint ile güncel kod arasındaki önemli farklar:

| Konu | Blueprint | Güncel kod |
|------|-----------|------------|
| Beğeni | `toggleLike`, her 10 like → +1 Süt | **Kaldırıldı**; `NoteGrade` / `submitNoteGrade`; Süt yok |
| Dosya modeli | Tek `fileUrl` | **`NoteFile[]`** + legacy `fileUrl` |
| Akademik | Hafif geçilmiş | User/Note üzerinde **FK hiyerarşisi** |
| Onay ödülü | Action +3; API `note.price` | Canlı UI API **+5 sabit**; action hâlâ +3; ikisi de `note.price` değil |
| Onay audit | Milk/`addCredits` ima | Onay path’leri çoğunlukla **Transaction’sız increment** |
| Not fiyatı | Şema yorumu 1–3 | Upload **1–5** |
| `/api/upload-blob` | Vurgulanmamış | Kayıt kimliği için **oturumsuz** |
| Chat | Canlı varsayımı | **`CHAT_ENABLED = false`** |
| Top-noder / `/note/[id]` | — | **dummyData** mock |

Wiki sayfaları bu tablodaki **kod** sütununu doğru kabul eder.

## İlgili Sayfalar

- [[Index]]
- [[Süt Ekonomisi]]
- [[Not Sistemi]]
- [[Sistem Mimari]]
