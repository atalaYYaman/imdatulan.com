
export const UNIVERSITIES = [
    { label: "İstanbul Teknik Üniversitesi", value: "ITU" },
    { label: "Orta Doğu Teknik Üniversitesi", value: "ODTU" },
    { label: "Boğaziçi Üniversitesi", value: "BOUN" },
    { label: "Yıldız Teknik Üniversitesi", value: "YTU" },
    { label: "Hacettepe Üniversitesi", value: "HACETTEPE" },
    { label: "İstanbul Üniversitesi", value: "ISTANBUL" },
    { label: "Marmara Üniversitesi", value: "MARMARA" },
    // Add more as needed or fetch from API
];

export const PROGRAM_LEVELS = [
    { label: "Ön Lisans", value: "Associate" },
    { label: "Lisans", value: "Undergraduate" },
    { label: "Yüksek Lisans", value: "Master" },
    { label: "Doktora", value: "Phd" },
];

export const DEPARTMENTS = [
    { label: "Bilgisayar Mühendisliği", value: "CS" },
    { label: "Elektrik-Elektronik Mühendisliği", value: "EE" },
    { label: "Makine Mühendisliği", value: "ME" },
    { label: "İnşaat Mühendisliği", value: "CE" },
    { label: "Mimarlık", value: "ARCH" },
    { label: "Hukuk", value: "LAW" },
    { label: "Tıp", value: "MED" },
    // Dynamic loading would be better but this is a start
];

export const CLASSES_BY_LEVEL: Record<string, { label: string, value: string }[]> = {
    "Associate": [
        { label: "Hazırlık", value: "Prep" },
        { label: "1. Sınıf", value: "1" },
        { label: "2. Sınıf", value: "2" },
    ],
    "Undergraduate": [
        { label: "Hazırlık", value: "Prep" },
        { label: "1. Sınıf", value: "1" },
        { label: "2. Sınıf", value: "2" },
        { label: "3. Sınıf", value: "3" },
        { label: "4. Sınıf", value: "4" },
    ],
    "Master": [
        { label: "Yüksek Lisans 1", value: "1" },
        { label: "Yüksek Lisans 2", value: "2" },
    ],
    "Phd": [
        { label: "Doktora", value: "PhD" } // Simplified
    ]
}

// Special case for Medicine/Dentistry if we want 6 years, but keeping simple for now.
export const CLASSES_EXTENDED = [
    { label: "5. Sınıf", value: "5" },
    { label: "6. Sınıf", value: "6" },
];
