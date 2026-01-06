
export const universities = [
    {
        id: 1,
        name: "Necmettin Erbakan Üniversitesi",
        departments: [
            "Endüstri Mühendisliği",
            "Bilgisayar Mühendisliği",
            "Tıp Fakültesi",
            "Hukuk Fakültesi",
        ],
    },
    {
        id: 2,
        name: "Selçuk Üniversitesi",
        departments: [
            "Makine Mühendisliği",
            "İnşaat Mühendisliği",
            "Edebiyat Fakültesi",
        ],
    },
    {
        id: 3,
        name: "İstanbul Teknik Üniversitesi",
        departments: [
            "Mimarlık",
            "Uçak Mühendisliği",
            "Elektronik Haberleşme",
        ],
    },
];

export const users = [
    {
        id: "u1",
        name: "Atalay Yaman",
        email: "atalay@example.com",
        role: "student",
        university: "Necmettin Erbakan Üniversitesi",
        department: "Endüstri Mühendisliği",
        stats: {
            followers: 120,
            following: 15,
            totalNotes: 23,
            rating: 4.3,
        },
        wallet: 500,
        avatar: "https://i.pravatar.cc/150?u=atalay",
    },
    {
        id: "u2",
        name: "Zeynep Yılmaz",
        email: "zeynep@example.com",
        role: "student",
        university: "Selçuk Üniversitesi",
        department: "Makine Mühendisliği",
        stats: {
            followers: 85,
            following: 40,
            totalNotes: 10,
            rating: 4.8,
        },
        wallet: 250,
        avatar: "https://i.pravatar.cc/150?u=zeynep",
    },
];

export const notes = [
    {
        id: "n1",
        title: "Endüstri Müh. Giriş Vize Notları",
        type: "Ders Notu", // Ders Notu, Çıkmış Sorular, Ödev, Slayt
        university: "Necmettin Erbakan Üniversitesi",
        faculty: "Mühendislik Fakültesi",
        department: "Endüstri Mühendisliği",
        course: "Endüstri Mühendisliğine Giriş",
        instructor: "Prof. Dr. Ahmet Yılmaz",
        uploaderId: "u1",
        rating: 4.5,
        viewCount: 150,
        price: 0, // 0 = Free
        createdAt: "2023-10-15T10:00:00Z",
        fileUrl: "/sample.pdf",
        previewImage: "/note-preview.jpg",
    },
    {
        id: "n2",
        title: "Matematik 1 Final Çıkmış Sorular",
        type: "Çıkmış Sorular",
        university: "Necmettin Erbakan Üniversitesi",
        faculty: "Mühendislik Fakültesi",
        department: "Bilgisayar Mühendisliği",
        course: "Matematik 1",
        instructor: "Doç. Dr. Ayşe Kaya",
        uploaderId: "u2",
        rating: 4.9,
        viewCount: 320,
        price: 0,
        createdAt: "2024-01-05T14:30:00Z",
        fileUrl: "/sample2.pdf",
        previewImage: "/note-preview-2.jpg",
    },
    {
        id: "n3",
        title: "Fizik 2 Laboratuvar Föyü",
        type: "Ders Notu",
        university: "Selçuk Üniversitesi",
        faculty: "Mühendislik Fakültesi",
        department: "Makine Mühendisliği",
        course: "Fizik 2",
        instructor: "Dr. Mehmet Demir",
        uploaderId: "u2",
        rating: 3.8,
        viewCount: 45,
        price: 0,
        createdAt: "2024-02-10T09:15:00Z",
        fileUrl: "/sample3.pdf",
        previewImage: "/note-preview-3.jpg",
    },
];

export const leaderboard = [
    {
        userId: "u1",
        shareCount: 23,
        rating: 4.3,
        earnings: 500,
        period: "thisMonth", // or 'lastMonth'
    },
    {
        userId: "u2",
        shareCount: 10,
        rating: 4.8,
        earnings: 250,
        period: "thisMonth",
    },
];
