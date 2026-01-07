'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// PDF Worker Ayarı
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface NoteViewerProps {
    fileUrl: string;
    uploaderName: string;
}

export default function NoteViewer({ fileUrl, uploaderName }: NoteViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [rotation, setRotation] = useState<number>(0);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    const changePage = (offset: number) => {
        setPageNumber(prev => Math.min(Math.max(1, prev + offset), numPages));
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 overflow-hidden relative select-none">

            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 bg-[#002A30] border-b border-[#003E44] z-20 shadow-lg">

                {/* Sol Taraf: Sayfa Kontrolleri */}
                <div className="flex items-center gap-4 bg-black/20 px-4 py-2 rounded-xl">
                    <button
                        onClick={() => changePage(-1)}
                        disabled={pageNumber <= 1}
                        className="p-1 hover:text-[#22d3ee] disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    <span className="text-sm font-bold text-gray-300 min-w-[3rem] text-center">
                        {pageNumber} / {numPages || '--'}
                    </span>

                    <button
                        onClick={() => changePage(1)}
                        disabled={pageNumber >= numPages}
                        className="p-1 hover:text-[#22d3ee] disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                {/* Sağ Taraf: Zoom & Rotate */}
                <div className="flex items-center gap-2">
                    <div className="flex bg-black/20 rounded-xl overflow-hidden p-1">
                        <button
                            onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
                            className="p-2 hover:bg-white/10 text-gray-300 hover:text-white transition-colors rounded-lg"
                        >
                            <ZoomOut className="w-5 h-5" />
                        </button>
                        <span className="flex items-center justify-center w-12 text-xs font-bold text-[#22d3ee]">
                            {Math.round(scale * 100)}%
                        </span>
                        <button
                            onClick={() => setScale(s => Math.min(3.0, s + 0.2))}
                            className="p-2 hover:bg-white/10 text-gray-300 hover:text-white transition-colors rounded-lg"
                        >
                            <ZoomIn className="w-5 h-5" />
                        </button>
                    </div>

                    <button
                        onClick={() => setRotation(r => (r + 90) % 360)}
                        className="p-3 bg-black/20 hover:bg-white/10 rounded-xl text-gray-300 hover:text-[#22d3ee] transition-colors"
                        title="Döndür"
                    >
                        <RotateCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* PDF Alanı */}
            <div className="flex-1 overflow-auto flex justify-center p-8 relative bg-gray-900/50">
                <div className="relative shadow-2xl">
                    <Document
                        file={fileUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={
                            <div className="flex items-center justify-center h-64 text-[#22d3ee]">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
                            </div>
                        }
                        error={
                            <div className="text-red-400 p-4 bg-red-900/20 rounded-xl border border-red-500/30">
                                PDF yüklenemedi. Lütfen sayfayı yenileyin.
                            </div>
                        }
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            rotate={rotation}
                            className="border border-[#003E44] rounded-lg overflow-hidden"
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                        />
                    </Document>

                    {/* Gelişmiş Filigran - Sayfanın Tam Ortasına  */}
                    <div
                        className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden"
                        style={{ transform: `rotate(${rotation}deg)` }}
                    >
                        <div className="opacity-30 transform -rotate-45 flex flex-col items-center justify-center text-center select-none space-y-4">
                            <div className="bg-[#002A30]/50 backdrop-blur-sm p-8 rounded-3xl border border-[#22d3ee]/30">
                                <span className="block text-6xl md:text-8xl font-black text-[#22d3ee] tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                                    OTLAK
                                </span>
                                <span className="block text-2xl md:text-3xl font-bold text-white mt-2 drop-shadow-md">
                                    {uploaderName}
                                </span>
                                <span className="block text-sm text-gray-300 mt-2 font-mono bg-black/40 px-3 py-1 rounded">
                                    izinsiz paylaşmayınız
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
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
