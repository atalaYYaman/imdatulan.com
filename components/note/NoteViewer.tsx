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
}

export default function NoteViewer({ fileUrl, viewerUser, isLocked, onUnlock, isUnlocking, price = 1 }: NoteViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [scale, setScale] = useState<number>(isLocked ? 0.6 : 1.0); // Kilitliyse biraz daha küçük göster
    const [isLoading, setIsLoading] = useState(true);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setIsLoading(false);
    }

    // Zoom Handlers - Kilitliyse devre dışı
    const zoomIn = () => !isLocked && setScale(prev => Math.min(prev + 0.2, 3.0));
    const zoomOut = () => !isLocked && setScale(prev => Math.max(prev - 0.2, 0.5));

    return (
        <div className="flex flex-col h-full bg-gray-900 relative">

            {/* Kilitli Durum Overlay */}
            {isLocked && !isLoading && (
                <div className="absolute inset-0 z-[60] backdrop-blur-sm bg-black/40 flex items-center justify-center pointer-events-auto">
                    <div className="bg-[#002A30] border-2 border-[#22d3ee] p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 max-w-sm text-center transform hover:scale-105 transition-transform duration-300 animate-in fade-in zoom-in">
                        <div className="w-20 h-20 bg-[#22d3ee]/10 rounded-full flex items-center justify-center animate-bounce-slow">
                            <span className="text-4xl">🔒</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Bu Not Kilitli</h2>
                            <p className="text-gray-400 text-sm">
                                Notun tamamını görüntülemek için sütünüzden harcamanız gerekmektedir.
                            </p>
                        </div>
                        <button
                            onClick={onUnlock}
                            disabled={isUnlocking}
                            className="w-full py-4 bg-[#22d3ee] hover:bg-[#0ea5e9] disabled:opacity-70 text-[#002A30] font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2"
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

            {/* Toolbar - Floating Zoom Controls (Kilitliyse Gizle) */}
            {!isLocked && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#002A30]/90 backdrop-blur-md px-6 py-3 rounded-full border border-[#22d3ee]/30 shadow-2xl transition-transform hover:scale-105 select-none">
                    <button
                        onClick={zoomOut}
                        className="p-1 text-white hover:text-[#22d3ee] transition-colors active:scale-90"
                        title="Uzaklaştır"
                    >
                        <ZoomOut className="w-6 h-6" />
                    </button>
                    <div className="w-px h-6 bg-gray-600/50"></div>
                    <span className="text-sm font-bold text-[#22d3ee] min-w-[3rem] text-center select-none font-mono">
                        {Math.round(scale * 100)}%
                    </span>
                    <div className="w-px h-6 bg-gray-600/50"></div>
                    <button
                        onClick={zoomIn}
                        className="p-1 text-white hover:text-[#22d3ee] transition-colors active:scale-90"
                        title="Yakınlaştır"
                    >
                        <ZoomIn className="w-6 h-6" />
                    </button>
                </div>
            )}

            {/* Main Scrollable Area */}
            <div className={`flex-1 w-full overflow-y-auto bg-gray-900 scroll-smooth ${isLocked ? 'overflow-hidden pointer-events-none' : ''}`}>
                <div className="max-w-max mx-auto px-4 py-20 min-h-full flex flex-col items-center gap-8">

                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center text-[#22d3ee]">
                            <div className="flex flex-col items-center gap-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
                                <span className="text-sm font-medium animate-pulse">Not yükleniyor...</span>
                            </div>
                        </div>
                    )}

                    <Document
                        file={fileUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={null}
                        className={`flex flex-col gap-6 transition-all duration-500 ${isLocked ? 'blur-sm grayscale opacity-50' : ''}`}
                        error={
                            <div className="mt-20 p-6 bg-red-900/20 border border-red-500/50 rounded-xl text-center">
                                <p className="text-red-400 font-bold mb-2">PDF görüntülenemedi</p>
                                <p className="text-xs text-red-300">Dosya bozuk olabilir veya tarayıcı desteği yok.</p>
                            </div>
                        }
                    >
                        {Array.from(new Array(numPages), (el, index) => {
                            // Kilitliyse sadece ilk sayfanın üst kısmını göster (bunu blur ve overflow-hidden ile yapıyoruz zaten ama burada ekstra güvenlik olarak ilk sayfa hariç render etmeyebiliriz veya hepsini render edip blurlayabiliriz. İstenen: "Üst taraftan ufak bir bölüm gösterilir")
                            // Basitlik için: Hepsini render et ama parent div 'blur-sm' ve 'overflow-hidden' olduğu için kullanıcı aşağı inemez.
                            // Ancak react-pdf hepsini render etmeye çalışırsa performans kaybı olabilir.
                            // Kilitliyken sadece ilk sayfayı render edelim.
                            if (isLocked && index > 0) return null;

                            return (
                                <div key={`page_${index + 1}`} className="relative group shadow-lg transition-transform duration-200">
                                    <Page
                                        pageNumber={index + 1}
                                        scale={scale}
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                        className="border border-[#003E44] rounded-sm bg-white"
                                        loading={
                                            <div
                                                className="bg-white/5 animate-pulse rounded-sm"
                                                style={{ width: 600 * scale, height: 850 * scale }}
                                            />
                                        }
                                    />

                                    {/* Kişisel Filigran Katmanı */}
                                    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-10 transition-opacity duration-300">
                                        <div className="w-full h-full opacity-25 flex flex-wrap content-center justify-center gap-20 transform -rotate-12 scale-110">
                                            {Array.from({ length: 12 }).map((_, i) => (
                                                <div key={i} className="text-center p-8 backdrop-blur-[1px] rounded-3xl border border-black/5">
                                                    <div className="text-4xl font-black text-slate-400/80 tracking-tighter">OTLAK</div>
                                                    <div className="text-lg font-bold text-red-500/60 mt-1 uppercase">
                                                        {viewerUser.name}
                                                    </div>
                                                    <div className="text-xs font-mono text-slate-500/60 mt-0.5">
                                                        {viewerUser.studentNumber || 'Misafir'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Kilitliyse sayfa üzerine maske - Üst kısım açık kalsın diye gradient maske */}
                                    {isLocked && index === 0 && (
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/60 to-gray-900 z-20"></div>
                                    )}
                                </div>
                            );
                        })}
                    </Document>
                </div>
            </div>

            {/* Right Click Blocker */}
            <div
                className="absolute inset-0 z-[100] pointer-events-none"
                onContextMenu={(e) => {
                    e.preventDefault();
                    return false;
                }}
            />
        </div>
    );
}
