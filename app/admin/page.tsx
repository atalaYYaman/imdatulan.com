import Link from 'next/link'
import { User, FileText } from 'lucide-react'

export default function AdminDashboard() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Admin Paneli</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                    href="/admin/users"
                    className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-[#22d3ee] transition-colors group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                            <User className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-xl font-semibold">Kullanıcı Onayları</h2>
                    </div>
                    <p className="text-gray-400">Yeni kayıt olan kullanıcıların kimlik ve bilgilerini onayla.</p>
                </Link>

                <Link
                    href="/admin/notes"
                    className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-[#22d3ee] transition-colors group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                            <FileText className="w-8 h-8 text-purple-400" />
                        </div>
                        <h2 className="text-xl font-semibold">Not Onayları</h2>
                    </div>
                    <p className="text-gray-400">Yüklenen ders notlarını incele ve onayla.</p>
                </Link>
            </div>
        </div>
    )
}
