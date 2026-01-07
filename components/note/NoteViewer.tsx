'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
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
}

export default function NoteViewer({ fileUrl, viewerUser }: NoteViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [scale, setScale] = useState<number>(1.0); // Başlangıç scale'i
    const [isLoading, setIsLoading] = useState(true);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setIsLoading(false);
    }

    return (
        <div className="flex flex-col h-full bg-gray-900 overflow-hidden relative select-none">

            {/* Toolbar - Zoom Kontrolleri */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#002A30]/80 backdrop-blur-md p-2 rounded-xl border border-[#22d3ee]/30 shadow-2xl">
                <button
                    onClick={() => setScale(s => Math.max(0.6, s - 0.2))}
                    className="p-2 text-white hover:text-[#22d3ee] transition-colors"
                >
                    <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-xs font-bold text-[#22d3ee] w-12 text-center">
                    {Math.round(scale * 100)}%
                </span>
                <button
                    onClick={() => setScale(s => Math.min(3.0, s + 0.2))}
                    className="p-2 text-white hover:text-[#22d3ee] transition-colors"
                >
                    <ZoomIn className="w-5 h-5" />
                </button>
            </div>

            {/* PDF Alanı (Infinite Scroll + Pan/Zoom) */}
            <div className="flex-1 w-full h-full overflow-y-auto bg-gray-900/50 touch-pan-y">

                {isLoading && (
                    <div className="flex h-full items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#22d3ee]"></div>
                    </div>
                )}

                <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="flex flex-col items-center gap-4 py-8 min-h-screen"
                    loading={null}
                    error={<div className="text-red-400 mt-20">PDF yüklenemedi.</div>}
                >
                    <TransformWrapper
                        initialScale={1}
                        minScale={0.5}
                        maxScale={4}
                        centerOnInit
                        wheel={{ disabled: true }} // Mouse scroll zoom yerine kaydırma yapsın
                        panning={{ disabled: false }} // Her yöne kaydırma açık
                    >
                        <TransformComponent wrapperClass="!w-full !h-full flex justify-center" contentClass="!w-full flex flex-col items-center gap-4">
                            {/* Tüm Sayfaların Loop'u */}
                            {Array.from(new Array(numPages), (el, index) => (
                                <div key={`page_${index + 1}`} className="relative shadow-2xl group">
                                    {/* Sayfa */}
                                    <Page
                                        pageNumber={index + 1}
                                        scale={scale}
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                        className="border border-[#003E44] rounded-sm overflow-hidden bg-white"
                                        loading={<div className="h-[800px] w-[600px] bg-white/5 animate-pulse" />}
                                    />

                                    {/* KİŞİSEL FİLİGRAN (Her sayfa üzerinde tekrarlayan) */}
                                    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden flex flex-col justify-center items-center">
                                        {/* Çapraz tekrar eden metinler */}
                                        <div className="w-[150%] h-[150%] flex flex-wrap content-center justify-center gap-24 transform -rotate-45 opacity-20">
                                            {Array.from({ length: 12 }).map((_, i) => (
                                                <div key={i} className="text-center">
                                                    <div className="text-3xl font-black text-slate-900/50">OTLAK</div>
                                                    <div className="text-xl font-bold text-red-500/40">
                                                        {viewerUser.name}
                                                    </div>
                                                    <div className="text-sm font-mono text-slate-800/40">
                                                        {viewerUser.studentNumber}
                                                    </div>
                                                    <div className="text-[10px] text-slate-600/30">
                                                        {new Date().toLocaleDateString('tr-TR')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </TransformComponent>
                    </TransformWrapper>
                </Document>
            </div>

            {/* Sağ Tık Engelleme Katmanı */}
            <div
                className="absolute inset-0 z-[60]"
                onContextMenu={(e) => {
                    e.preventDefault();
                    return false;
                }}
            />
        </div>
    );
}
