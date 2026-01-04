import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const session = await getServerSession(authOptions)

  // Fetch Approved Notes
  const notes = await prisma.note.findMany({
    where: { status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    take: 50 // Limit for MVP
  })

  // Check Access
  let hasAccess = false
  let daysRemaining = 0

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (user) {
      if (user.role === 'ADMIN') {
        hasAccess = true
        daysRemaining = 999
      } else if (user.lastApprovedUploadAt) {
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - user.lastApprovedUploadAt.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        if (diffDays <= 30) {
          hasAccess = true
          daysRemaining = 30 - diffDays
        }
      }
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header / Call to Action */}
        <div className="mb-8 text-center">
          {!session ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-yellow-700">
                Notları görmek için <Link href="/auth/signin" className="font-bold underline">Giriş Yapmalısın</Link>.
              </p>
            </div>
          ) : !hasAccess ? (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-blue-700 font-bold">Kardeşim notları görmek istiyorsan pamuk eller cebe!</p>
                  <p className="text-blue-600 text-sm">Son 30 gün içinde onaylanmış bir notun yok. Hemen bir not paylaş, 30 gün boyunca kütüphaneyi sömür.</p>
                </div>
                <Link href="/upload" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium whitespace-nowrap ml-4">
                  Not Yükle (+30 Gün)
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <p className="text-green-700">🎉 Erişim Hakkın Var! (Kalan: {daysRemaining} gün)</p>
            </div>
          )}
        </div>

        {/* Filters (Basic for visual, functionality could be query params) */}
        <div className="mb-6 flex flex-wrap gap-2 justify-center hidden">
          {/* MVP Note: Filters would go here, implemented as Links updating searchParams */}
          <span className="px-3 py-1 bg-white border rounded-full text-sm text-gray-600">Üniversite: Tümü</span>
          <span className="px-3 py-1 bg-white border rounded-full text-sm text-gray-600">Bölüm: Tümü</span>
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {notes.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg shadow">
              Henüz onaylanmış not yok. İlk sen ol!
            </div>
          ) : (
            notes.map((note: any) => (
              <div key={note.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 truncate" title={note.title}>
                    {note.title}
                  </h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p><span className="font-semibold">Üniv:</span> {note.university}</p>
                    <p><span className="font-semibold">Bölüm:</span> {note.department}</p>
                    <p><span className="font-semibold">Ders:</span> {note.faculty}</p>
                  </div>
                  <div className="mt-5">
                    {hasAccess ? (
                      <a
                        href={note.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        İndir / Görüntüle
                      </a>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center justify-center w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
                      >
                        Önce Not Yükle
                      </button>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-xs text-gray-500 text-right">
                    {new Date(note.createdAt).toLocaleDateString("tr-TR")}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
