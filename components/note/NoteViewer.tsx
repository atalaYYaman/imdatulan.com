'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ZoomIn, ZoomOut } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// PDF Worker Ayarı
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface NoteViewerProps {
    fileUrl: string;
    viewerUser: {
        name: string;
        studentNumber: string;
    };
    isLocked: boolean;
    onUnlock?: () => void;
    isUnlocking?: boolean;
    price?: number;
    errorMessage?: string | null;
}

export default function NoteViewer({ fileUrl, viewerUser, isLocked, onUnlock, isUnlocking, price = 1, errorMessage }: NoteViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [scale, setScale] = useState<number>(isLocked ? 0.6 : 1.0); // Kilitliyse biraz daha küçük göster
    const [isLoading, setIsLoading] = useState(true);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setIsLoading(false);
    }

    // Dosya uzantısı kontrolü
    const isPdf = fileUrl.toLowerCase().endsWith('.pdf');
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);

    // Zoom Handlers - Kilitliyse devre dışı
    const zoomIn = () => !isLocked && setScale(prev => Math.min(prev + 0.2, 3.0));
    const zoomOut = () => !isLocked && setScale(prev => Math.max(prev - 0.2, 0.5));

    // Watermark Component
    const Watermark = () => (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-30 flex flex-wrap content-center justify-center gap-20">
            {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="transform -rotate-12 scale-110 opacity-40 p-10 select-none">
                    <div className="text-5xl font-black text-slate-300/50 tracking-tighter whitespace-nowrap">OTLAK.COM.TR</div>
                    <div className="text-xl font-bold text-red-500/40 mt-1 uppercase text-center">
                        {viewerUser.name}
                    </div>
                    <div className="text-sm font-mono text-slate-400/50 text-center">
                        {viewerUser.studentNumber}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div
            className="flex flex-col h-full bg-muted/20 relative select-none"
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Kilitli Durum Overlay */}
            {isLocked && !isLoading && (
                <div className="absolute inset-0 z-[60] backdrop-blur-md bg-background/60 flex items-center justify-center pointer-events-auto">
                    <div className="bg-card border-2 border-primary p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 max-w-sm text-center transform hover:scale-105 transition-transform duration-300 animate-in fade-in zoom-in">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-bounce-slow">
                            <span className="text-4xl">🔒</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">Bu Not Kilitli</h2>
                            <p className="text-muted-foreground text-sm">
                                Notun tamamını görüntülemek için sütünüzden harcamanız gerekmektedir.
                            </p>
                            {errorMessage && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl animate-in fade-in slide-in-from-top-2">
                                    <p className="text-red-400 text-xs font-bold flex items-center justify-center gap-2">
                                        <span className="text-lg">⚠️</span>
                                        {errorMessage}
                                    </p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onUnlock}
                            disabled={isUnlocking}
                            className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-70 text-primary-foreground font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isUnlocking ? (
                                <span className="animate-pulse">Açılıyor...</span>
                            ) : (
                                <>
                                    <span>{price} Süt Harca</span>
                                    <span className="text-lg">🥛</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Toolbar - Floating Zoom Controls */}
            {!isLocked && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 bg-card/90 backdrop-blur-md px-6 py-3 rounded-full border border-primary/30 shadow-2xl transition-transform hover:scale-105 select-none">
                    <button onClick={zoomOut} className="p-1 hover:text-primary transition-colors"><ZoomOut className="w-6 h-6" /></button>
                    <div className="w-px h-6 bg-border"></div>
                    <span className="text-sm font-bold text-primary min-w-[3rem] text-center font-mono">{Math.round(scale * 100)}%</span>
                    <div className="w-px h-6 bg-border"></div>
                    <button onClick={zoomIn} className="p-1 hover:text-primary transition-colors"><ZoomIn className="w-6 h-6" /></button>
                </div>
            )}

            {/* Main Scrollable Area */}
            <div className={`flex-1 w-full overflow-y-auto bg-muted/20 scroll-smooth ${isLocked ? 'overflow-hidden pointer-events-none' : ''}`}>
                <div className="max-w-max mx-auto px-4 py-20 min-h-full flex flex-col items-center gap-8 relative">

                    {isLoading && isPdf && (
                        <div className="absolute inset-0 flex items-center justify-center text-primary z-40">
                            <div className="flex flex-col items-center gap-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
                                <span className="text-sm font-medium animate-pulse">Not yükleniyor...</span>
                            </div>
                        </div>
                    )}

                    <div className="relative shadow-2xl" id="content-container">
                        {isPdf ? (
                            <Document
                                file={fileUrl}
                                onLoadSuccess={onDocumentLoadSuccess}
                                loading={null}
                                className={`flex flex-col gap-6 transition-all duration-500 ${isLocked ? 'blur-md grayscale opacity-50' : ''}`}
                                error={
                                    <div className="p-10 text-center text-red-400">
                                        <p>PDF görüntülenemedi.</p>
                                    </div>
                                }
                            >
                                {Array.from(new Array(numPages), (_, index) => {
                                    if (isLocked && index > 0) return null;
                                    return (
                                        <div key={`page_${index + 1}`} className="relative bg-white">
                                            <Page
                                                pageNumber={index + 1}
                                                scale={scale}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                                loading={<div className="bg-muted animate-pulse" style={{ width: 600 * scale, height: 800 * scale }} />}
                                            />
                                            <Watermark />
                                        </div>
                                    );
                                })}
                            </Document>
                        ) : isImage ? (
                            <div className={`relative bg-white p-2 ${isLocked ? 'blur-md grayscale opacity-50' : ''}`}>
                                <img
                                    src={fileUrl}
                                    className="max-w-[90vw] object-contain pointer-events-none"
                                    style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
                                    draggable={false}
                                    onContextMenu={(e) => e.preventDefault()}
                                    alt="Not içeriği"
                                    onLoad={() => setIsLoading(false)}
                                />
                                <Watermark />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-96 p-8 text-center bg-card rounded-2xl border border-border">
                                <p className="text-xl font-bold mb-4">Önizleme Kullanılamıyor</p>
                                <p className="text-muted-foreground mb-6">Bu dosya formatı ({fileUrl.split('.').pop()}) şu an için tarayıcıda görüntülenemez.</p>
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
                                >
                                    Dosyayı İndir
                                </a>
                            </div>
                        )}

                        {/* Transparent Interaction Blocker for extra security */}
                        <div className="absolute inset-0 z-50 bg-transparent" onContextMenu={(e) => e.preventDefault()}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
