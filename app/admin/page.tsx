import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { approveNote, rejectNote } from '@/app/actions'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) redirect('/auth/signin')

    const admin = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (admin?.role !== 'ADMIN') redirect('/')

    const pendingNotes = await prisma.note.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        include: { uploader: { select: { email: true } } }
    })

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-gray-800">Admin Panel - Onay Bekleyenler</h1>

                <div className="bg-white shadow overflow-hidden rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {pendingNotes.length === 0 ? (
                            <li className="px-6 py-4 text-center text-gray-500">Onay bekleyen not yok. Temiz!</li>
                        ) : (
                            pendingNotes.map((note: any) => (
                                <li key={note.id} className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-medium text-gray-900 truncate">{note.title}</h3>
                                            <div className="mt-1 text-sm text-gray-500">
                                                <p>Gönderen: {note.uploader.email}</p>
                                                <p>Üniv: {note.university} | Blm: {note.department} | Ders: {note.faculty}</p>
                                                <p>Dosya: <a href={note.fileUrl} target="_blank" className="text-blue-600 hover:underline">Görüntüle (Watermarked)</a></p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2 ml-4">
                                            <form action={approveNote.bind(null, note.id, note.uploaderId)}>
                                                <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-medium">
                                                    Onayla
                                                </button>
                                            </form>
                                            <form action={rejectNote.bind(null, note.id)}>
                                                <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-medium">
                                                    Red
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </div>
    )
}
