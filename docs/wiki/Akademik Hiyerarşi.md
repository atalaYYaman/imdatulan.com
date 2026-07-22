# Akademik Hiyerarşi

Dosyalar: `lib/academicMaster.ts`, `lib/academicValidation.ts`, `app/actions/academic.ts`, Prisma `University` / `Faculty` / `Department`.

## Yapı

```
University
  └── (kullanıcı/not FK)
Faculty (global unique name)
  └── Department (unique per faculty: facultyId + name)
        └── User / Note FK
```

Hem **User** hem **Note** üzerinde:

- FK: `universityId`, `facultyId`, `departmentId`
- String mirror: `university`, `faculty`, `department` (gösterim / anonimleştirme)

## Server Actions

| Action | Amaç |
|--------|------|
| `getUniversities` | Aktif üniversiteler |
| `getFaculties` | Fakülte listesi |
| `getDepartments` | Fakülteye göre bölüm |
| `getAllDepartmentsForFilter` | Keşif filtreleri |
| `validateAcademicSelection` | ID → isim doğrulama |
| `getCurrentUserAcademic` | Oturum kullanıcısının academic bilgisi |

Kayıt (`registerUser`) ve upload (`/api/upload`) academic seçimi doğrular.

## Legacy

`lib/constants.ts` içinde sabit üniversite listesi hâlâ UI’nin bazı yerlerinde olabilir; kanonik veri `academicMaster` + DB kayıtlarıdır.

## İlgili Sayfalar

- [[Auth Servisi]]
- [[Not Sistemi]]
- [[Veritabanı Mimari]]
- [[Index]]
