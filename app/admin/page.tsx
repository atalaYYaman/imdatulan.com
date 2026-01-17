import Link from 'next/link'
import { User, FileText, MessageSquare, AlertOctagon, BarChart3, Shield, ArrowRight, ScrollText } from 'lucide-react'

export default function AdminDashboard() {
    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Admin Paneli</h1>
                    <p className="text-muted-foreground mt-1">Platform yönetim ve denetim merkezi.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-full text-sm font-bold border border-emerald-500/20">
                    <Shield className="w-4 h-4" />
                    <span>Sistem Güvenli</span>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Users Module */}
                <Link
                    href="/admin/users"
                    className="group relative overflow-hidden bg-card/60 backdrop-blur-xl border border-white/10 dark:border-white/5 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <User className="w-24 h-24" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="mb-4 p-3 bg-blue-500/10 text-blue-500 w-fit rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">Kullanıcı Onayları</h2>
                            <p className="text-sm text-muted-foreground">Yeni kayıt olan kullanıcıların kimlik ve bilgilerini onayla/reddet.</p>
                        </div>
                        <div className="mt-6 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                            Yönet <ArrowRight className="w-3 h-3 ml-1" />
                        </div>
                    </div>
                </Link>

                {/* Notes Module */}
                <Link
                    href="/admin/notes"
                    className="group relative overflow-hidden bg-card/60 backdrop-blur-xl border border-white/10 dark:border-white/5 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <FileText className="w-24 h-24" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="mb-4 p-3 bg-purple-500/10 text-purple-500 w-fit rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">Not Onayları</h2>
                            <p className="text-sm text-muted-foreground">Yüklenen ders notlarını incele, fiyatlandır ve yayına al.</p>
                        </div>
                        <div className="mt-6 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                            Yönet <ArrowRight className="w-3 h-3 ml-1" />
                        </div>
                    </div>
                </Link>

                {/* Reports Module */}
                <Link
                    href="/admin/reports"
                    className="group relative overflow-hidden bg-card/60 backdrop-blur-xl border border-white/10 dark:border-white/5 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <AlertOctagon className="w-24 h-24" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="mb-4 p-3 bg-rose-500/10 text-rose-500 w-fit rounded-xl group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300">
                            <AlertOctagon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">Şikayet Yönetimi</h2>
                            <p className="text-sm text-muted-foreground">İçerik şikayetlerini incele, içerikleri askıya al veya şikayetleri reddet.</p>
                        </div>
                        <div className="mt-6 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                            Yönet <ArrowRight className="w-3 h-3 ml-1" />
                        </div>
                    </div>
                </Link>

                {/* Feedback Module */}
                <Link
                    href="/admin/feedback"
                    className="group relative overflow-hidden bg-card/60 backdrop-blur-xl border border-white/10 dark:border-white/5 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <MessageSquare className="w-24 h-24" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="mb-4 p-3 bg-amber-500/10 text-amber-500 w-fit rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">Geri Bildirimler</h2>
                            <p className="text-sm text-muted-foreground">Kullanıcı önerilerini ve genel geri bildirimlerini incele.</p>
                        </div>
                        <div className="mt-6 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                            Yönet <ArrowRight className="w-3 h-3 ml-1" />
                        </div>
                    </div>
                </Link>

                {/* Analytics Module */}
                <Link
                    href="/admin/stats"
                    className="group relative overflow-hidden bg-card/60 backdrop-blur-xl border border-white/10 dark:border-white/5 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <BarChart3 className="w-24 h-24" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="mb-4 p-3 bg-emerald-500/10 text-emerald-500 w-fit rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">Sistem Özeti</h2>
                            <p className="text-sm text-muted-foreground">Kullanıcı, not ve gelir istatistiklerini detaylı görüntüle.</p>
                        </div>
                        <div className="mt-6 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                            Yönet <ArrowRight className="w-3 h-3 ml-1" />
                        </div>
                    </div>
                </Link>

                {/* Changelog Module */}
                <Link
                    href="/admin/changelog"
                    className="group relative overflow-hidden bg-card/60 backdrop-blur-xl border border-white/10 dark:border-white/5 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ScrollText className="w-24 h-24" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="mb-4 p-3 bg-pink-500/10 text-pink-500 w-fit rounded-xl group-hover:bg-pink-500 group-hover:text-white transition-colors duration-300">
                            <ScrollText className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">Geliştirme Notları</h2>
                            <p className="text-sm text-muted-foreground">Kullanıcılar için yeni güncelleme ve sürüm notları paylaş.</p>
                        </div>
                        <div className="mt-6 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                            Yönet <ArrowRight className="w-3 h-3 ml-1" />
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    )
}
