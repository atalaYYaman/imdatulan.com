'use client';

import { useState, useEffect } from 'react';
import { getReports, resolveReport } from '@/app/actions/adminActions';
import { Button } from '@/components/ui/Button';
import { Loader2, AlertTriangle, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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

    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6 p-6">
            <h1 className="text-2xl font-bold">Şikayet Yönetimi</h1>

            {reports.length === 0 ? (
                <div className="text-center p-10 bg-card rounded-xl border border-border text-muted-foreground">
                    Bekleyen şikayet yok.
                </div>
            ) : (
                <div className="grid gap-4">
                    {reports.map((report) => (
                        <div key={report.id} className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border border-red-500/20">
                                        {report.reason}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(report.createdAt).toLocaleDateString('tr-TR')}
                                    </span>
                                </div>

                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Link href={`/notes/${report.noteId}`} target="_blank" className="hover:underline flex items-center gap-1">
                                        {report.note.title}
                                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                    </Link>
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-muted/30 p-3 rounded-lg">
                                    <div>
                                        <span className="text-muted-foreground block text-xs uppercase">Şikayet Eden</span>
                                        <span className="font-medium">{report.reporter.firstName} {report.reporter.lastName} ({report.reporter.email})</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs uppercase">İçerik Sahibi</span>
                                        <span className="font-medium">{report.note.uploader.firstName} ({report.note.uploader.email})</span>
                                    </div>
                                </div>

                                {report.details && (
                                    <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                                        <p className="text-sm font-medium text-red-800 dark:text-red-200">"{report.details}"</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 justify-center min-w-[200px]">
                                <Button
                                    onClick={() => handleOpenSuspend(report)}
                                    disabled={!!processingId}
                                    variant="destructive"
                                    className="w-full"
                                >
                                    {processingId === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                                    İçeriği Askıya Al
                                </Button>

                                <Button
                                    onClick={() => handleReject(report)}
                                    disabled={!!processingId}
                                    variant="outline"
                                    className="w-full hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/50"
                                >
                                    {processingId === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                    Şikayeti Reddet
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Suspend Modal */}
            {isSuspendModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-card w-full max-w-md p-6 rounded-2xl border border-border shadow-2xl">
                        <h3 className="font-bold text-lg mb-4">İçeriği Askıya Al</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Bu işlem içeriği genel erişime kapatacak (askıya alacak). İçerik sahibi ve satın alanlar görmeye devam edebilecek.
                        </p>

                        <label className="block text-sm font-medium mb-2">Askıya Alma Sebebi (Kullanıcıya Gönderilecek):</label>
                        <textarea
                            value={suspendReason}
                            onChange={(e) => setSuspendReason(e.target.value)}
                            className="w-full h-32 bg-input border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-destructive resize-none mb-6"
                        ></textarea>

                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setIsSuspendModalOpen(false)}>İptal</Button>
                            <Button variant="destructive" onClick={handleSuspend} disabled={!!processingId}>
                                {processingId ? 'İşleniyor...' : 'Onayla ve Askıya Al'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
