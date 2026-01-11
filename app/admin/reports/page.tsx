'use client';

import { useState, useEffect } from 'react';
import { getReports, resolveReport } from '@/app/actions/adminActions';
import { Button } from '@/components/ui/Button';
import { Loader2, AlertTriangle, CheckCircle, XCircle, ExternalLink, ShieldAlert, User, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface Report {
    id: string;
    reason: string;
    details: string | null;
    createdAt: Date;
    noteId: string;
    note: {
        title: string;
        uploader: {
            email: string;
            firstName: string | null;
        };
    };
    reporter: {
        email: string;
        firstName: string | null;
        lastName: string | null;
    };
}

export default function AdminReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Modal State
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [suspendReason, setSuspendReason] = useState("");
    const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);

    useEffect(() => {
        loadReports();
    }, []);

    async function loadReports() {
        setIsLoading(true);
        const res = await getReports();
        if (res.success && res.data) {
            setReports(res.data as any); // Type casting for ease
        }
        setIsLoading(false);
    }

    const handleOpenSuspend = (report: Report) => {
        setSelectedReport(report);
        setSuspendReason(`Bu içerik "${report.reason}" sebebiyle askıya alınmıştır.`);
        setIsSuspendModalOpen(true);
    };

    const handleSuspend = async () => {
        if (!selectedReport) return;
        setProcessingId(selectedReport.id);

        const res = await resolveReport(selectedReport.id, "SUSPEND", selectedReport.noteId, suspendReason);

        if (res?.success) {
            setReports(prev => prev.filter(r => r.id !== selectedReport.id));
            setIsSuspendModalOpen(false);
            setSelectedReport(null);
        } else {
            alert("İşlem başarısız.");
        }
        setProcessingId(null);
    };

    const handleReject = async (report: Report) => {
        if (!confirm("Şikayeti reddetmek (silmek) istediğinize emin misiniz?")) return;
        setProcessingId(report.id);

        const res = await resolveReport(report.id, "REJECT", report.noteId);

        if (res?.success) {
            setReports(prev => prev.filter(r => r.id !== report.id));
        } else {
            alert("İşlem başarısız.");
        }
        setProcessingId(null);
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-20 min-h-[50vh]">
            <Loader2 className="animate-spin w-10 h-10 text-primary mb-4" />
            <p className="text-muted-foreground font-medium animate-pulse">Şikayetler yükleniyor...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ShieldAlert className="w-8 h-8 text-rose-500" />
                    Şikayet Yönetimi
                </h1>
                <p className="text-muted-foreground mt-1 ml-10">Kullanıcılar tarafından bildirilen içerik şikayetlerini inceleyin.</p>
            </div>

            {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-card/50 rounded-3xl border border-dashed border-border backdrop-blur-sm">
                    <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-full mb-4 ring-1 ring-emerald-500/20">
                        <CheckCircle className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold">Harika! Hiç Şikayet Yok</h3>
                    <p className="text-muted-foreground">Şu an incelenecek bir şikayet bulunmuyor.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {reports.map((report) => (
                        <div key={report.id} className="group relative bg-card/60 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                <AlertTriangle className="w-32 h-32" />
                            </div>

                            <div className="relative z-10 flex flex-col lg:flex-row gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-rose-500/20">
                                            {report.reason}
                                        </span>
                                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                            <span>•</span> {new Date(report.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    <h3 className="font-black text-xl flex items-center gap-2 text-foreground group-hover:text-primary transition-colors cursor-pointer w-fit">
                                        <Link href={`/notes/${report.noteId}`} target="_blank" className="hover:underline flex items-center gap-2">
                                            {report.note.title}
                                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                        </Link>
                                    </h3>

                                    <div className="bg-background/50 rounded-xl p-4 border border-border/50 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-primary/10 p-2 rounded-lg text-primary mt-1">
                                                <ShieldAlert className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Şikayet Eden</span>
                                                <div className="font-semibold text-sm">{report.reporter.firstName} {report.reporter.lastName}</div>
                                                <div className="text-xs text-muted-foreground">{report.reporter.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="bg-blue-500/10 p-2 rounded-lg text-blue-500 mt-1">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">İçerik Sahibi</span>
                                                <div className="font-semibold text-sm">{report.note.uploader.firstName || 'İsimsiz'}</div>
                                                <div className="text-xs text-muted-foreground">{report.note.uploader.email}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {report.details && (
                                        <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30 flex gap-3">
                                            <MessageSquare className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block mb-1">DETAYLAR</span>
                                                <p className="text-sm font-medium text-rose-800 dark:text-rose-200 italic">"{report.details}"</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col lg:flex-row gap-3 justify-center min-w-[240px] border-t lg:border-t-0 lg:border-l border-border/50 pt-6 lg:pt-0 lg:pl-6">
                                    <div className="flex flex-col gap-3 w-full justify-center">
                                        <Button
                                            onClick={() => handleOpenSuspend(report)}
                                            disabled={!!processingId}
                                            variant="destructive"
                                            className="w-full h-auto py-3 font-bold shadow-lg shadow-rose-500/20"
                                        >
                                            {processingId === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4 mr-2" />}
                                            İçeriği Askıya Al
                                        </Button>

                                        <Button
                                            onClick={() => handleReject(report)}
                                            disabled={!!processingId}
                                            variant="outline"
                                            className="w-full h-auto py-3 font-bold border-emerald-500/20 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                                        >
                                            {processingId === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                            Şikayeti Reddet (Sil)
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Suspend Modal */}
            {isSuspendModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-lg p-8 rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-destructive/10 text-destructive rounded-full">
                                <ShieldAlert className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="font-black text-2xl">İçeriği Askıya Al</h3>
                                <p className="text-sm text-muted-foreground">Bu işlem içeriği genel erişime kapatacaktır.</p>
                            </div>
                        </div>

                        <div className="bg-muted/50 p-4 rounded-xl mb-6 text-sm">
                            ⚠️ İçerik sahibi ve satın alanlar görmeye devam edebilecek, ancak yeni satın alımlara kapatılacaktır.
                        </div>

                        <label className="block text-sm font-bold mb-2 ml-1">Askıya Alma Sebebi (Kullanıcıya Gönderilecek):</label>
                        <textarea
                            value={suspendReason}
                            onChange={(e) => setSuspendReason(e.target.value)}
                            className="w-full h-32 bg-background border border-border rounded-xl p-4 text-sm focus:ring-2 focus:ring-destructive resize-none mb-8 outline-none shadow-inner"
                            placeholder="Askıya alma sebebini detaylıca yazınız..."
                        ></textarea>

                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setIsSuspendModalOpen(false)} className="rounded-xl px-6 font-bold">İptal</Button>
                            <Button variant="destructive" onClick={handleSuspend} disabled={!!processingId} className="rounded-xl px-6 font-bold shadow-lg shadow-destructive/20">
                                {processingId ? <Loader2 className="animate-spin w-4 h-4" /> : 'Onayla ve Askıya Al'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
