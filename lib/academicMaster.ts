/**
 * Global master data: canonical faculty names and departments (shared by all Konya universities).
 * Single source for prisma/seed and migration backfill maps.
 */

export const UNIVERSITY_NAMES = [
    "Selçuk Üniversitesi",
    "Necmettin Erbakan Üniversitesi",
    "Konya Teknik Üniversitesi",
    "Konya Gıda ve Tarım Üniversitesi",
    "KTO Karatay Üniversitesi",
] as const

/** Faculty name -> department names */
export const ACADEMIC_TREE: { faculty: string; departments: string[] }[] = [
    {
        faculty: "Mühendislik Fakültesi",
        departments: [
            "Bilgisayar Mühendisliği",
            "Elektrik-Elektronik Mühendisliği",
            "Makine Mühendisliği",
            "İnşaat Mühendisliği",
            "Endüstri Mühendisliği",
            "Yazılım Mühendisliği",
            "Mekatronik Mühendisliği",
            "Harita Mühendisliği",
            "Çevre Mühendisliği",
            "Metalurji ve Malzeme Mühendisliği",
        ],
    },
    {
        faculty: "Mimarlık ve Tasarım Fakültesi",
        departments: ["Mimarlık", "İç Mimarlık", "Şehir ve Bölge Planlama"],
    },
    {
        faculty: "Tıp Fakültesi",
        departments: ["Tıp"],
    },
    {
        faculty: "Diş Hekimliği Fakültesi",
        departments: ["Diş Hekimliği"],
    },
    {
        faculty: "Eczacılık Fakültesi",
        departments: ["Eczacılık"],
    },
    {
        faculty: "Sağlık Bilimleri Fakültesi",
        departments: [
            "Hemşirelik",
            "Ebelik",
            "Fizyoterapi ve Rehabilitasyon",
            "Beslenme ve Diyetetik",
            "Odyoloji",
            "Sağlık Yönetimi",
        ],
    },
    {
        faculty: "Veteriner Fakültesi",
        departments: ["Veteriner"],
    },
    {
        faculty: "Eğitim Fakültesi",
        departments: [
            "Sınıf Öğretmenliği",
            "Okul Öncesi Öğretmenliği",
            "İngilizce Öğretmenliği",
            "Psikolojik Danışmanlık ve Rehberlik (PDR)",
            "İlköğretim Matematik Öğretmenliği",
            "Türkçe Öğretmenliği",
            "Özel Eğitim Öğretmenliği",
        ],
    },
    {
        faculty: "İktisadi ve İdari Bilimler Fakültesi (İİBF)",
        departments: [
            "İşletme",
            "İktisat",
            "Kamu Yönetimi",
            "Uluslararası İlişkiler",
            "Maliye",
            "Çalışma Ekonomisi",
            "Yönetim Bilişim Sistemleri (YBS)",
            "Uluslararası Ticaret",
            "Lojistik Yönetimi",
        ],
    },
    {
        faculty: "Fen Fakültesi",
        departments: ["Matematik", "Fizik", "Kimya", "Biyoloji"],
    },
    {
        faculty: "Edebiyat / İnsan ve Toplum Bilimleri Fakültesi",
        departments: [
            "Psikoloji",
            "Sosyoloji",
            "Tarih",
            "Türk Dili ve Edebiyatı",
            "Mütercim-Tercümanlık",
            "Felsefe",
        ],
    },
    {
        faculty: "İletişim Fakültesi",
        departments: [
            "Gazetecilik",
            "Halkla İlişkiler ve Tanıtım",
            "Radyo Televizyon ve Sinema",
        ],
    },
    {
        faculty: "Güzel Sanatlar ve Tasarım Fakültesi",
        departments: [
            "Görsel İletişim Tasarımı",
            "Grafik Tasarım",
            "Yeni Medya",
        ],
    },
    {
        faculty: "Hukuk Fakültesi",
        departments: ["Hukuk"],
    },
    {
        faculty: "İlahiyat / İslami İlimler Fakültesi",
        departments: ["İlahiyat", "İslami İlimler"],
    },
    {
        faculty: "Turizm Fakültesi",
        departments: ["Gastronomi ve Mutfak Sanatları", "Turizm İşletmeciliği"],
    },
    {
        faculty: "Ziraat / Tarım ve Doğa Bilimleri Fakültesi",
        departments: ["Tarım Ekonomisi", "Ziraat Mühendisliği"],
    },
    {
        faculty: "Spor Bilimleri Fakültesi",
        departments: [],
    },
    {
        faculty: "Sivil Havacılık Yüksekokulu",
        departments: [],
    },
    {
        faculty: "Meslek Yüksekokulu (Önlisans Bölümleri İçin Ortak Çatı)",
        departments: [
            "Bilgisayar Programcılığı",
            "Adalet",
            "İlk ve Acil Yardım (Paramedik)",
            "Anestezi",
            "Tıbbi Dokümantasyon",
            "Ağız ve Diş Sağlığı",
            "Çocuk Gelişimi",
            "Aşçılık",
        ],
    },
]

export const NOTE_FILTER_YEARS = [
    "2024-2025",
    "2023-2024",
    "2022-2023",
    "2021-2022",
    "Daha Eski",
] as const

/** Old DB / NEU-specific faculty label -> canonical faculty name in ACADEMIC_TREE */
export const FACULTY_ALIASES: Record<string, string> = {
    "Seydişehir Ahmet Cengiz Mühendislik Fakültesi": "Mühendislik Fakültesi",
    "Ahmet Keleşoğlu Eğitim Fakültesi": "Eğitim Fakültesi",
    "Meram Tıp Fakültesi": "Tıp Fakültesi",
    "İlahiyat Fakültesi": "İlahiyat / İslami İlimler Fakültesi",
    "Sosyal ve Beşeri Bilimler Fakültesi": "Edebiyat / İnsan ve Toplum Bilimleri Fakültesi",
    "Siyasal Bilgiler Fakültesi": "İktisadi ve İdari Bilimler Fakültesi (İİBF)",
    "Havacılık ve Uzay Bilimleri Fakültesi": "Mühendislik Fakültesi",
    "Güzel Sanatlar ve Mimarlık Fakültesi": "Mimarlık ve Tasarım Fakültesi",
    "Uygulamalı Bilimler Fakültesi": "İktisadi ve İdari Bilimler Fakültesi (İİBF)",
    "Ereğli Eğitim Fakültesi": "Eğitim Fakültesi",
    "Turizm Fakültesi": "Turizm Fakültesi",
    "Fen Fakültesi": "Fen Fakültesi",
    "Hukuk Fakültesi": "Hukuk Fakültesi",
    "Mühendislik Fakültesi": "Mühendislik Fakültesi",
    "Diş Hekimliği Fakültesi": "Diş Hekimliği Fakültesi",
    "Sağlık Bilimleri Fakültesi": "Sağlık Bilimleri Fakültesi",
}

/**
 * Old department string -> canonical department name (must exist under mapped faculty after alias).
 * Only entries that differ or need explicit mapping; otherwise same-name match is used.
 */
export const DEPARTMENT_ALIASES: Record<string, string> = {
    "Biyomedikal Mühendisliği": "Mekatronik Mühendisliği",
    "Gıda Mühendisliği": "Endüstri Mühendisliği",
    "Maden Mühendisliği": "Makine Mühendisliği",
    "Matematik-Bilgisayar Bilimleri": "Matematik",
    "Moleküler Biyoloji ve Genetik": "Biyoloji",
    "Biyoteknoloji": "Biyoloji",
    "Biyokimya": "Kimya",
    "İstatistik": "Matematik",
    "Halkla İlişkiler ve Reklamcılık": "Halkla İlişkiler ve Tanıtım",
    "Kütüphane ve Dokümantasyon": "Türk Dili ve Edebiyatı",
    "Sanat Tarihi": "Tarih",
    "Siyaset Bilimi ve Kamu Yönetimi": "Kamu Yönetimi",
    "Muhasebe ve Finans Yönetimi": "Maliye",
    "Bankacılık": "İşletme",
    "Kamu Hukuku": "Hukuk",
    "Özel Hukuk": "Hukuk",
    "Felsefe ve Din Bilimleri": "Felsefe",
    "İslam Tarihi ve Sanatları": "Tarih",
    "Temel İslam Bilimleri": "İslami İlimler",
    "İlköğretim Din Kültürü ve Ahlak Bilgisi Eğitimi": "İlahiyat",
    "Sosyal Hizmet": "Psikoloji",
    "Çocuk Gelişimi": "Çocuk Gelişimi",
    "Rekreasyon Yönetimi": "Turizm İşletmeciliği",
    "Turizm Rehberliği": "Turizm İşletmeciliği",
    "Uçak Mühendisliği": "Makine Mühendisliği",
    "Uzay ve Uydu Mühendisliği": "Elektrik-Elektronik Mühendisliği",
    "Havacılık Yönetimi": "Endüstri Mühendisliği",
    "İç Mimarlık ve Çevre Tasarımı": "İç Mimarlık",
    "Grafik": "Grafik Tasarım",
    "Çini": "Görsel İletişim Tasarımı",
    "Fotoğraf": "Görsel İletişim Tasarımı",
    "Heykel": "Görsel İletişim Tasarımı",
    "Resim": "Görsel İletişim Tasarımı",
    "Seramik": "Görsel İletişim Tasarımı",
    "Geleneksel Türk Sanatları": "Görsel İletişim Tasarımı",
    "Müzik": "Yeni Medya",
    "Cerrahi Tıp Bilimleri": "Tıp",
    "Dahili Tıp Bilimleri": "Tıp",
    "Temel Tıp Bilimleri": "Tıp",
    "Ağız, Diş ve Çene Cerrahisi": "Diş Hekimliği",
    "Ağız, Diş ve Çene Radyolojisi": "Diş Hekimliği",
    "Diş Hastalıkları ve Tedavisi": "Diş Hekimliği",
    "Endodonti": "Diş Hekimliği",
    "Ortodonti": "Diş Hekimliği",
    "Pedodonti": "Diş Hekimliği",
    "Periodontoloji": "Diş Hekimliği",
    "Protetik Diş Tedavisi": "Diş Hekimliği",
    "Bilgisayar ve Öğretim Teknolojileri Eğitimi": "Sınıf Öğretmenliği",
    "Eğitim Bilimleri": "Psikolojik Danışmanlık ve Rehberlik (PDR)",
    "Güzel Sanatlar Eğitimi": "Özel Eğitim Öğretmenliği",
    "Matematik ve Fen Bilimleri Eğitimi": "İlköğretim Matematik Öğretmenliği",
    "Özel Eğitim": "Özel Eğitim Öğretmenliği",
    "Temel Eğitim": "Sınıf Öğretmenliği",
    "Türkçe ve Sosyal Bilimler Eğitimi": "Türkçe Öğretmenliği",
    "Yabancı Diller Eğitimi": "İngilizce Öğretmenliği",
}
