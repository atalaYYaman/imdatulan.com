
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const NEU_DATA = [
    {
        name: "Ahmet Keleşoğlu Eğitim Fakültesi",
        depts: [
            "Bilgisayar ve Öğretim Teknolojileri Eğitimi", "Eğitim Bilimleri", "Güzel Sanatlar Eğitimi",
            "Matematik ve Fen Bilimleri Eğitimi", "Özel Eğitim", "Temel Eğitim",
            "Türkçe ve Sosyal Bilimler Eğitimi", "Yabancı Diller Eğitimi"
        ]
    },
    {
        name: "Meram Tıp Fakültesi",
        depts: ["Cerrahi Tıp Bilimleri", "Dahili Tıp Bilimleri", "Temel Tıp Bilimleri"]
    },
    {
        name: "Mühendislik Fakültesi",
        depts: [
            "Bilgisayar Mühendisliği", "Biyomedikal Mühendisliği", "Çevre Mühendisliği",
            "Elektrik-Elektronik Mühendisliği", "Endüstri Mühendisliği", "Gıda Mühendisliği",
            "Harita Mühendisliği", "İnşaat Mühendisliği", "Makine Mühendisliği",
            "Metalurji ve Malzeme Mühendisliği", "Mekatronik Mühendisliği", "Yazılım Mühendisliği"
        ]
    },
    {
        name: "İlahiyat Fakültesi",
        depts: ["Felsefe ve Din Bilimleri", "İslam Tarihi ve Sanatları", "Temel İslam Bilimleri", "İlköğretim Din Kültürü ve Ahlak Bilgisi Eğitimi"]
    },
    {
        name: "Sosyal ve Beşeri Bilimler Fakültesi",
        depts: [
            "Felsefe", "Halkla İlişkiler ve Reklamcılık", "Psikoloji", "Sanat Tarihi",
            "Sosyoloji", "Tarih", "Türk Dili ve Edebiyatı", "Mütercim-Tercümanlık", "Kütüphane ve Dokümantasyon"
        ]
    },
    {
        name: "Siyasal Bilgiler Fakültesi",
        depts: ["İktisat", "İşletme", "Siyaset Bilimi ve Kamu Yönetimi", "Uluslararası İlişkiler"]
    },
    {
        name: "Havacılık ve Uzay Bilimleri Fakültesi",
        depts: ["Havacılık Yönetimi", "Uçak Mühendisliği", "Uzay ve Uydu Mühendisliği"]
    },
    {
        name: "Diş Hekimliği Fakültesi",
        depts: [
            "Ağız, Diş ve Çene Cerrahisi", "Ağız, Diş ve Çene Radyolojisi", "Diş Hastalıkları ve Tedavisi",
            "Endodonti", "Ortodonti", "Pedodonti", "Periodontoloji", "Protetik Diş Tedavisi"
        ]
    },
    {
        name: "Güzel Sanatlar ve Mimarlık Fakültesi",
        depts: [
            "Çini", "Fotoğraf", "Geleneksel Türk Sanatları", "Grafik", "Heykel", "İç Mimarlık ve Çevre Tasarımı",
            "Mimarlık", "Müzik", "Resim", "Seramik", "Şehir ve Bölge Planlama"
        ]
    },
    {
        name: "Sağlık Bilimleri Fakültesi",
        depts: ["Beslenme ve Diyetetik", "Çocuk Gelişimi", "Fizyoterapi ve Rehabilitasyon", "Hemşirelik", "Odyoloji", "Sağlık Yönetimi", "Sosyal Hizmet"]
    },
    {
        name: "Turizm Fakültesi",
        depts: ["Gastronomi ve Mutfak Sanatları", "Rekreasyon Yönetimi", "Turizm Rehberliği", "Turizm İşletmeciliği"]
    },
    {
        name: "Uygulamalı Bilimler Fakültesi",
        depts: ["Bankacılık", "Lojistik Yönetimi", "Muhasebe ve Finans Yönetimi", "Yönetim Bilişim Sistemleri"]
    },
    {
        name: "Hukuk Fakültesi",
        depts: ["Kamu Hukuku", "Özel Hukuk"]
    },
    {
        name: "Fen Fakültesi",
        depts: ["Biyoloji", "Biyokimya", "Biyoteknoloji", "Fizik", "İstatistik", "Kimya", "Matematik-Bilgisayar Bilimleri", "Moleküler Biyoloji ve Genetik"]
    },
    {
        name: "Seydişehir Ahmet Cengiz Mühendislik Fakültesi",
        depts: ["Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Makine Mühendisliği", "Maden Mühendisliği", "Metalurji ve Malzeme Mühendisliği"]
    },
    {
        name: "Ereğli Eğitim Fakültesi",
        depts: ["Bilgisayar ve Öğretim Teknolojileri Eğitimi", "Matematik ve Fen Bilimleri Eğitimi", "Temel Eğitim", "Türkçe ve Sosyal Bilimler Eğitimi"]
    }
]

const OTHER_UNIVERSITIES = [
    "Selçuk Üniversitesi",
    "KTO Karatay Üniversitesi",
    "Konya Teknik Üniversitesi",
    "Konya Gıda ve Tarım Üniversitesi"
]

async function main() {
    console.log(`Start seeding ...`)

    // 1. Seed Necmettin Erbakan University (Active)
    const neu = await prisma.university.upsert({
        where: { name: "Necmettin Erbakan Üniversitesi" },
        update: { isActive: true },
        create: { name: "Necmettin Erbakan Üniversitesi", isActive: true }
    })
    console.log(`Updated/Created: ${neu.name}`)

    // Default Faculty/Dept cleanup for NEU could be complex, assuming fresh or overwrite
    // For simplicity in this dev environment, we will try to create faculties if not exist. 
    // Ideally we might want to delete old ones, but 'upsert' loops are safer for now.

    for (const f of NEU_DATA) {
        // Check if faculty exists
        let faculty = await prisma.faculty.findFirst({
            where: { name: f.name, universityId: neu.id }
        })

        if (!faculty) {
            faculty = await prisma.faculty.create({
                data: { name: f.name, universityId: neu.id }
            })
        }

        const existingDepts = await prisma.department.findMany({ where: { facultyId: faculty.id } })
        const existingDeptNames = existingDepts.map(d => d.name)

        for (const d of f.depts) {
            if (!existingDeptNames.includes(d)) {
                await prisma.department.create({
                    data: { name: d, facultyId: faculty.id }
                })
            }
        }
    }

    // 2. Seed Other Universities (Passive)
    for (const uniName of OTHER_UNIVERSITIES) {
        await prisma.university.upsert({
            where: { name: uniName },
            update: { isActive: false },
            create: { name: uniName, isActive: false }
        })
        console.log(`Updated/Created (Passive): ${uniName}`)
    }

    console.log(`Seeding finished.`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
