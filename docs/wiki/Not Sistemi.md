# Not Sistemi

Dosyalar: `app/actions/noteActions.ts`, `app/actions/getNotes.ts`, `app/api/upload*`, `components/note/*`, `app/notes/*`.

## Yaşam Döngüsü

1. Kullanıcı `/upload` ile meta + dosya(lar) yükler
2. `Note` + `NoteFile[]` oluşur (`status: PENDING`)
3. Admin onay/red (`/api/admin/notes/approve|reject`)
4. Keşif: `getNotes` (filtreler, grade ortalaması; **ham fileUrl yok**)
5. Detay: `/notes/[noteId]` → `getNoteDetail`
6. Unlock / grade / comment / report / soft-delete

## Çoklu Dosya (`NoteFile`)

- Sıra: `sortOrder`
- Alanlar: `fileUrl`, `fileName`, `fileExtension`, `pageCount` (PDF)
- Legacy: `Note.fileUrl` = ilk dosya (geriye uyumluluk)
- Proxy: `/api/files/[noteId]?fileIndex=`

## Unlock

`unlockNote`: alıcı fiyat kadar Süt öder, yükleyici aynı miktarı alır, `UnlockedNote` + iki `Transaction`. Bkz. [[Süt Ekonomisi]].

## NoteGrade (eski Like yerine)

- Enum: `AA` … `FF` → skor 10…1 (`lib/noteGrades.ts`)
- Yalnız unlock edilmiş kullanıcılar
- `submitNoteGrade` upsert; **Süt ödülü yok**
- Eski `toggleLike` / like milestone **kodda yok**

## Etkileşimler

| Action | Not |
|--------|-----|
| `incrementView` | `(userId, noteId)` unique |
| `addComment` | rate limit |
| `createReport` | rate limit → Admin raporlar |
| `deleteNote` | soft delete (`deletedAt`) |

## Görüntüleme Güvenliği

Birincil indirme: `/api/download/[noteId]`. Canvas watermark: `NoteViewer`. Detay: [[Dosya Proxy ve Watermark]].

## Meta

`lib/noteMetadata.ts` — not tipi / dönem sabitleri. Akademik seçim: [[Akademik Hiyerarşi]].

## İlgili Sayfalar

- [[Veri Akışları]]
- [[Admin Modülü]]
- [[Veritabanı Mimari]]
- [[Index]]
