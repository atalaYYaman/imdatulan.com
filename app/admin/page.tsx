import Link from 'next/link'
import { User, FileText, MessageSquare } from 'lucide-react'

export default function AdminDashboard() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Admin Paneli</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                    href="/admin/users"
                    className="bg-card p-6 rounded-2xl border border-border hover:border-primary transition-colors group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                            <User className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-xl font-semibold">Kullanıcı Onayları</h2>
                    </div>
                    <p className="text-muted-foreground">Yeni kayıt olan kullanıcıların kimlik ve bilgilerini onayla.</p>
                </Link>

                <Link
                    href="/admin/notes"
                    className="bg-card p-6 rounded-2xl border border-border hover:border-primary transition-colors group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                            <FileText className="w-8 h-8 text-purple-400" />
                        </div>
                        <h2 className="text-xl font-semibold">Not Onayları</h2>
                    </div>
                    <p className="text-muted-foreground">Yüklenen ders notlarını incele ve onayla.</p>
                </Link>

                <Link
                    href="/admin/reports"
                    className="bg-card p-6 rounded-2xl border border-border hover:border-red-500 transition-colors group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-red-500/20 rounded-xl group-hover:bg-red-500/30 transition-colors">
                            <div className="w-8 h-8 flex items-center justify-center text-red-500 font-bold text-xl">!</div>
                        </div>
                        <h2 className="text-xl font-semibold">Şikayet Yönetimi</h2>
                    </div>
                    <p className="text-muted-foreground">İçerik şikayetlerini incele ve işlem yap.</p>
                </Link>

                <Link
                    href="/admin/stats"
                    className="bg-card p-6 rounded-2xl border border-border hover:border-green-500 transition-colors group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
                            <div className="w-8 h-8 flex items-center justify-center text-green-500 font-bold text-xl">📊</div>
                        </div>
                        <h2 className="text-xl font-semibold">Sistem Özeti</h2>
                    </div>
                    <p className="text-muted-foreground">Kullanıcı ve not istatistiklerini görüntüle.</p>
                </Link>

                <Link
                    href="/admin/feedback"
                    className="bg-card p-6 rounded-2xl border border-border hover:border-yellow-500 transition-colors group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-yellow-500/20 rounded-xl group-hover:bg-yellow-500/30 transition-colors">
                            <MessageSquare className="w-8 h-8 text-yellow-500" />
                        </div>
                        <h2 className="text-xl font-semibold">Geri Bildirimler</h2>
                    </div>
                    <p className="text-muted-foreground">Kullanıcı öneri ve şikayetlerini incele.</p>
                </Link>
            </div>
        </div>
    )
}
