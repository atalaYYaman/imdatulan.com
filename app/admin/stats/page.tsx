'use client';

import { useState, useEffect } from 'react';
import { getAdminStats } from '@/app/actions/adminActions';
import { Loader2, Users, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function AdminStatsPage() {
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const res = await getAdminStats();
            if (res.success) {
                setStats(res.data);
            }
            setIsLoading(false);
        }
        load();
    }, []);

    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    if (!stats) return <div>Data yüklenemedi.</div>;

    const cards = [
        { title: "Toplam Kullanıcı", value: stats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
        { title: "Onay Bekleyen Üye", value: stats.pendingUsers, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" },

        { title: "Toplam Not", value: stats.totalNotes, icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10" },
        { title: "Onay Bekleyen Not", value: stats.pendingNotes, icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },

        { title: "Askıdaki Notlar", value: stats.suspendedNotes, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
        { title: "Bekleyen Şikayet", value: stats.pendingReports, icon: AlertTriangle, color: "text-pink-500", bg: "bg-pink-500/10" },
    ];

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Sistem Özeti</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div key={i} className="bg-card border border-border rounded-xl p-6 flex items-center gap-4 hover:shadow-lg transition-shadow">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${card.bg} ${card.color}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
                                <p className="text-3xl font-bold text-foreground">{card.value}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
