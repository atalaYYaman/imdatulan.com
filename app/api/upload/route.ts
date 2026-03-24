import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from '@vercel/blob';
import { checkRateLimit } from "@/lib/rate-limit";
import { PDFDocument } from "pdf-lib";
import { universities } from "@/lib/universityData";

const ALLOWED_EXT = new Set(['pdf', 'jpg', 'jpeg', 'png']);
const TRUSTED_DOMAINS = ['blob.vercel-storage.com', 'pub-'];

function getExtensionFromFileName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext && ALLOWED_EXT.has(ext) ? ext : 'pdf';
}

function isTrustedBlobUrl(url: string): boolean {
    if (typeof url !== 'string' || url.length > 500) return false;
    return TRUSTED_DOMAINS.some(domain => url.includes(domain));
}

function isValidAcademicSelection(universityName: string, facultyName: string, departmentName: string): boolean {
    const university = universities.find((item) => item.name === universityName);
    if (!university) return false;
    const faculty = university.faculties.find((item) => item.name === facultyName);
    if (!faculty) return false;
    return faculty.departments.includes(departmentName);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                approvalStatus: true,
                university: true,
                faculty: true,
                department: true
            }
        })
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 })
        }

        if (user.approvalStatus === 'BANNED' || user.approvalStatus === 'REJECTED') {
            return NextResponse.json({ message: "Account not authorized" }, { status: 403 });
        }

        const formData = await req.formData()
        const blobUrlsRaw = formData.get("blobUrls") as string | null
        const fileNamesRaw = formData.get("fileNames") as string | null

        // Legacy single-file support
        const file = formData.get("file") as File | null
        const blobUrl = formData.get("blobUrl") as string | null
        const fileName = formData.get("fileName") as string | null

        const courseName = formData.get("courseName") as string
        const term = formData.get("term") as string
        const selectedUniversity = formData.get("university") as string | null
        const selectedFaculty = formData.get("faculty") as string | null
        const selectedDepartment = formData.get("department") as string | null
        const noteType = formData.get("noteType") as string
        const description = formData.get("description") as string
        const priceStr = formData.get("price") as string

        const limitCheck = await checkRateLimit(`upload_${session.user.email}`, 5, 3600);
        if (!limitCheck.success) {
            return NextResponse.json({ message: limitCheck.message }, { status: 429 });
        }

        if (typeof courseName !== 'string' || courseName.length > 200 || courseName.length < 1) {
            return NextResponse.json({ message: "Invalid course name" }, { status: 400 });
        }

        if (selectedUniversity || selectedFaculty || selectedDepartment) {
            if (!selectedUniversity || !selectedFaculty || !selectedDepartment) {
                return NextResponse.json({ message: "Üniversite, fakülte ve bölüm birlikte seçilmelidir." }, { status: 400 });
            }

            if (!isValidAcademicSelection(selectedUniversity, selectedFaculty, selectedDepartment)) {
                return NextResponse.json({ message: "Geçersiz üniversite/fakülte/bölüm seçimi." }, { status: 400 });
            }
        }

        let blobUrls: string[];
        let fileNames: string[];

        if (blobUrlsRaw && fileNamesRaw) {
            try {
                blobUrls = JSON.parse(blobUrlsRaw) as string[];
                fileNames = JSON.parse(fileNamesRaw) as string[];
            } catch {
                return NextResponse.json({ message: "Invalid blobUrls/fileNames format" }, { status: 400 });
            }
            if (!Array.isArray(blobUrls) || !Array.isArray(fileNames) || blobUrls.length !== fileNames.length || blobUrls.length === 0) {
                return NextResponse.json({ message: "blobUrls and fileNames must be matching non-empty arrays" }, { status: 400 });
            }
            for (const url of blobUrls) {
                if (!isTrustedBlobUrl(url)) {
                    return NextResponse.json({ message: "Invalid file source" }, { status: 403 });
                }
            }
        } else if (blobUrl && fileName) {
            if (!isTrustedBlobUrl(blobUrl)) {
                return NextResponse.json({ message: "Invalid file source" }, { status: 403 });
            }
            blobUrls = [blobUrl];
            fileNames = [fileName];
        } else if (file) {
            const MAX_FILE_SIZE = 4 * 1024 * 1024;
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json({
                    message: `Dosya boyutu çok büyük! Seçilen dosya: ${(file.size / 1024 / 1024).toFixed(2)}MB`
                }, { status: 413 })
            }
            const blob = await put(file.name, file, { access: 'public', addRandomSuffix: true });
            blobUrls = [blob.url];
            fileNames = [file.name];
        } else {
            return NextResponse.json({ message: "Dosya ve Ders Adı zorunludur." }, { status: 400 })
        }

        let price = priceStr ? parseInt(priceStr) : 1;
        if (price < 1) price = 1;
        if (price > 5) return NextResponse.json({ message: "Fiyat 1-5 Süt arasında olmalıdır." }, { status: 400 });

        const noteFilesData: { fileUrl: string; fileName: string; fileExtension: string; sortOrder: number; pageCount: number | null }[] = [];
        let firstFileUrl = blobUrls[0];
        let firstFileExtension = getExtensionFromFileName(fileNames[0]);
        let firstPageCount: number | null = null;

        for (let i = 0; i < blobUrls.length; i++) {
            const url = blobUrls[i];
            const name = fileNames[i] || `file-${i}`;
            const ext = getExtensionFromFileName(name);

            let pageCount: number | null = null;
            if (ext === 'pdf') {
                try {
                    const res = await fetch(url);
                    if (res.ok) {
                        const buf = await res.arrayBuffer();
                        const pdfDoc = await PDFDocument.load(buf);
                        pageCount = pdfDoc.getPageCount();
                    }
                } catch (e) {
                    console.error("Error extracting PDF page count:", e);
                }
            }

            noteFilesData.push({
                fileUrl: url,
                fileName: name,
                fileExtension: ext,
                sortOrder: i,
                pageCount
            });

            if (i === 0) {
                firstPageCount = pageCount;
            }
        }

        const note = await prisma.note.create({
            data: {
                title: courseName,
                courseName: courseName,
                university: selectedUniversity || user.university || "Bilinmiyor",
                faculty: selectedFaculty || user.faculty || "Bilinmiyor",
                department: selectedDepartment || user.department || "Bilinmiyor",
                type: noteType,
                term: term,
                description: description,
                fileUrl: firstFileUrl,
                uploaderId: user.id,
                price: price,
                status: "PENDING",
                isAI: formData.get("isAI") === "true",
                pageCount: firstPageCount,
                fileExtension: firstFileExtension,
                files: {
                    create: noteFilesData
                }
            }
        })

        return NextResponse.json({ message: "Upload successful", note }, { status: 201 })
    } catch (error) {
        console.error("Upload error details:", error)
        return NextResponse.json({
            message: "Internal Error: " + (error instanceof Error ? error.message : String(error))
        }, { status: 500 })
    }
}
