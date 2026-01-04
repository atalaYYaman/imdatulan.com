'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function UploadPage() {
    const router = useRouter()
    const [file, setFile] = useState<File | null>(null)
    const [title, setTitle] = useState("")
    const [university, setUniversity] = useState("")
    const [faculty, setFaculty] = useState("")
    const [department, setDepartment] = useState("")
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) return

        setUploading(true)
        setError("")

        const formData = new FormData()
        formData.append("file", file)
        formData.append("title", title)
        formData.append("university", university)
        formData.append("faculty", faculty)
        formData.append("department", department)

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || "Upload failed")
            }

            router.push("/")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Not Paylaş</h1>
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
                {error && <div className="text-red-500 text-center">{error}</div>}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Not Başlığı</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-1 block w-full rounded-md border text-black border-gray-300 p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                        placeholder="Örn: MAT101 Final Notları"
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Üniversite</label>
                        <input
                            type="text"
                            value={university}
                            onChange={(e) => setUniversity(e.target.value)}
                            className="mt-1 block w-full rounded-md border text-black border-gray-300 p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required
                            placeholder="Örn: İTÜ"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Fakülte</label>
                        <input
                            type="text"
                            value={faculty}
                            onChange={(e) => setFaculty(e.target.value)}
                            className="mt-1 block w-full rounded-md border text-black border-gray-300 p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required
                            placeholder="Örn: Bilgisayar"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Bölüm</label>
                    <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="mt-1 block w-full rounded-md border text-black border-gray-300 p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                        placeholder="Örn: Bilgisayar Mühendisliği"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Dosya (PDF)</label>
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        required
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={uploading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {uploading ? 'Yükleniyor...' : 'Paylaş ve Kahraman Ol'}
                    </button>
                </div>
            </form>
        </div>
    )
}
