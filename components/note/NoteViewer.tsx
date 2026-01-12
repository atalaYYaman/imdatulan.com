'use client';

import '@/lib/polyfills'; // Import polyfills first
import { useState, useRef, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ZoomIn, ZoomOut } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// PDF Worker Ayarı
// Use legacy build for better compatibility on older devices (Tablets/Mobile)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

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
    fileExtension?: string;
    errorMessage?: string | null;
}

export default function NoteViewer({ fileUrl, viewerUser, isLocked, onUnlock, isUnlocking, price = 1, errorMessage, fileExtension }: NoteViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [scale, setScale] = useState<number>(1.0);
    const [isLoading, setIsLoading] = useState(true);
    const [pageWidth, setPageWidth] = useState<number | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);


    // Reset state when fileUrl changes or lock state changes
    useEffect(() => {
        setIsLoading(true);
        setLoadError(null);
    }, [fileUrl, isLocked]);

    // Handle Resize Logic
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                if (width) {
                    setPageWidth(width);
                }
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setIsLoading(false);
        setLoadError(null);
    }

    function onDocumentLoadError(error: Error) {
        console.error("PDF Load Error:", error);
        setIsLoading(false);
        setLoadError("PDF yüklenirken bir sorun oluştu. Cihazınız bu formatı desteklemiyor olabilir veya bağlantı sorunu yaşıyorsunuz.");
    }

    // Dosya uzantısı kontrolü
    const getExtension = (url: string) => url.split('.').pop()?.toLowerCase() || '';
    const ext = fileExtension ? fileExtension.toLowerCase() : getExtension(fileUrl);

    const isPdf = ext === 'pdf' || (!fileExtension && fileUrl.toLowerCase().endsWith('.pdf'));
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) || (!fileExtension && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl));

    // Zoom Handlers - Kilitliyse devre dışı
    const zoomIn = () => !isLocked && setScale(prev => Math.min(prev + 0.2, 3.0));
    const zoomOut = () => !isLocked && setScale(prev => Math.max(prev - 0.2, 0.5));

    /**
     * Shared Watermark Drawing Function
     */
    const drawWatermark = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
        if (!ctx) return;

        ctx.save();
        const text = "OTLAK.COM.TR";
        const subText = viewerUser.name.toUpperCase();
        const studentNumber = viewerUser.studentNumber;

        // Reduced density: 4x6 -> 2x4
        const cols = 2;
        const rows = 4;
        const xSpacing = width / cols;
        const ySpacing = height / rows;

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                ctx.save();
                // Add offset to every other row for a brick pattern look
                const xOffset = (j % 2 === 0) ? 0 : xSpacing / 2;
                const x = i * xSpacing + xOffset + (xSpacing / 2) * 0.5; // Centering adjustment
                const y = j * ySpacing + (ySpacing / 2);

                ctx.translate(x, y);
                // Sharp diagonal rotation
                ctx.rotate(-30 * Math.PI / 180);

                ctx.font = "900 40px Inter, Roboto, sans-serif";
                // Reduced Opacity: 0.3 -> 0.15
                ctx.fillStyle = "rgba(203, 213, 225, 0.15)";
                ctx.textAlign = "center";
                ctx.fillText(text, 0, 0);

                ctx.font = "bold 20px Inter, Roboto, sans-serif";
                // Reduced Opacity: 0.2 -> 0.12
                ctx.fillStyle = "rgba(239, 68, 68, 0.12)";
                ctx.fillText(subText, 0, 30);

                ctx.font = "monospace 14px monospace";
                // Reduced Opacity: 0.3 -> 0.1
                ctx.fillStyle = "rgba(148, 163, 184, 0.1)";
                ctx.fillText(studentNumber, 0, 50);

                ctx.restore();
            }
        }
        ctx.restore();
    }, [viewerUser]);


    const imgRef = useRef<HTMLImageElement>(null);

    // Check if image is already loaded (cached) to remove spinner
    useEffect(() => {
        if (imgRef.current?.complete) {
            setIsLoading(false);
        }
    }, [isLoading]); // Check whenever loading state is true

    return (
        <div
            className="flex flex-col h-full bg-muted/20 relative select-none"
            onContextMenu={(e) => e.preventDefault()}
            ref={containerRef}
        >
            {/* Kilitli Durum Overlay */}
            {isLocked && (
                <div className="absolute inset-0 z-[60] bg-background/95 backdrop-blur-3xl flex items-center justify-center pointer-events-auto p-4 select-none">
                    <div className="relative overflow-hidden bg-card border border-border/50 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 max-w-sm text-center animate-in fade-in zoom-in duration-300">

                        {/* Animated Glow */}
                        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50 rotate-45 pointer-events-none" />

                        <div className="relative w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center shadow-inner">
                            <span className="text-5xl drop-shadow-sm">🔒</span>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-foreground mb-3 tracking-tight">Kilitli İçerik</h2>
                            <p className="text-muted-foreground text-sm leading-relaxed px-4">
                                Bu notun tamamını ve yüksek kaliteli halini görüntülemek için <span className='font-bold text-primary'>{price} Süt</span> harcayın.
                            </p>
                            {errorMessage && (
                                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl animate-in fade-in slide-in-from-top-2">
                                    <p className="text-destructive text-xs font-bold flex items-center justify-center gap-2">
                                        <span className="text-lg">⚠️</span>
                                        {errorMessage}
                                    </p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onUnlock}
                            disabled={isUnlocking}
                            className="w-full relative overflow-hidden py-4 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 disabled:opacity-70 text-white font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn"
                        >
                            {isUnlocking ? (
                                <span className="flex items-center gap-2 animate-pulse">
                                    <span className="w-2 h-2 rounded-full bg-white animate-bounce" />
                                    <span className="w-2 h-2 rounded-full bg-white animate-bounce delay-100" />
                                    <span className="w-2 h-2 rounded-full bg-white animate-bounce delay-200" />
                                    Açılıyor...
                                </span>
                            ) : (
                                <>
                                    <span>{price} Süt Harca</span>
                                    <span className="text-xl">🥛</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Toolbar - Floating Zoom Controls */}
            {!isLocked && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-6 bg-card/80 backdrop-blur-md px-8 py-4 rounded-full border border-primary/20 shadow-2xl transition-transform hover:scale-105 select-none ring-1 ring-black/5">
                    <button onClick={zoomOut} className="p-2 hover:bg-primary/10 text-foreground hover:text-primary rounded-full transition-colors active:scale-90"><ZoomOut className="w-6 h-6" /></button>
                    <div className="w-px h-8 bg-border"></div>
                    <span className="text-base font-bold text-primary min-w-[3.5rem] text-center font-mono">{Math.round(scale * 100)}%</span>
                    <div className="w-px h-8 bg-border"></div>
                    <button onClick={zoomIn} className="p-2 hover:bg-primary/10 text-foreground hover:text-primary rounded-full transition-colors active:scale-90"><ZoomIn className="w-6 h-6" /></button>
                </div>
            )}

            {/* Main Scrollable Area */}
            <div className={`flex-1 w-full overflow-y-auto bg-muted/20 scroll-smooth ${isLocked ? 'overflow-hidden pointer-events-none' : ''}`}>
                <div className="max-w-max mx-auto px-4 py-20 min-h-full flex flex-col items-center gap-8 relative">

                    {/* ONLY RENDER CONTENT IF UNLOCKED */}
                    {!isLocked && (
                        <>
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center text-primary z-40 pointer-events-none">
                                    <div className="flex flex-col items-center gap-4 bg-background/80 p-6 rounded-2xl backdrop-blur-sm border border-border/50 shadow-xl">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
                                        <span className="text-sm font-medium animate-pulse">İçerik yükleniyor...</span>
                                    </div>
                                </div>
                            )}

                            <div className="relative shadow-2xl min-h-[500px] min-w-[300px] bg-white transition-all duration-500 animate-in fade-in" id="content-container">
                                {isPdf ? (
                                    <Document
                                        file={fileUrl}
                                        onLoadSuccess={onDocumentLoadSuccess}
                                        onLoadError={onDocumentLoadError}
                                        loading={null}
                                        className="flex flex-col gap-6"
                                        error={
                                            <div className="p-10 text-center text-red-500 bg-red-50/50 rounded-xl">
                                                <p className="font-bold">PDF Açılmadı</p>
                                                <p className="text-sm mt-2 max-w-xs mx-auto text-muted-foreground">{loadError || "Bilinmeyen bir hata oluştu."}</p>
                                                <a href={fileUrl} target="_blank" className="mt-4 inline-block text-xs text-primary underline">Dosyayı İndirip Açmayı Dene</a>
                                            </div>
                                        }
                                    >
                                        {Array.from(new Array(numPages), (_, index) => (
                                            <div key={`page_${index + 1}`} className="relative bg-white shadow-md">
                                                <Page
                                                    pageNumber={index + 1}
                                                    width={pageWidth ? (Math.min(pageWidth - 48, 800) * scale) : undefined}
                                                    scale={pageWidth ? 1 : scale}
                                                    renderTextLayer={false}
                                                    renderAnnotationLayer={false}
                                                    loading={<div className="bg-muted animate-pulse" style={{ width: 600 * scale, height: 800 * scale }} />}
                                                    className="nod-pdf-page relative"
                                                >
                                                    <WatermarkOverlay drawWatermark={drawWatermark} />
                                                </Page>
                                            </div>
                                        ))}
                                    </Document>
                                ) : isImage ? (
                                    <div className="relative bg-white p-2 shadow-md inline-block">
                                        <div
                                            style={{
                                                transform: `scale(${scale})`,
                                                transformOrigin: 'top center',
                                            }}
                                            className="relative"
                                        >
                                            <img
                                                ref={imgRef}
                                                src={fileUrl}
                                                className="max-w-[90vw] object-contain pointer-events-auto"
                                                onLoad={() => setIsLoading(false)}
                                                onError={() => {
                                                    setIsLoading(false);
                                                    setLoadError("Resim yüklenemedi");
                                                }}
                                                alt="Note content"
                                                draggable={false}
                                            />
                                            {/* Watermark Overlay on top of image */}
                                            <WatermarkOverlay drawWatermark={drawWatermark} />
                                        </div>
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

                                {/* Transparent Interaction Blocker */}
                                <div className="absolute inset-0 z-50 bg-transparent" onContextMenu={(e) => e.preventDefault()}></div>
                            </div>
                        </>
                    )}

                    {/* PLACEHOLDER BACKGROUND IF LOCKED */}
                    {isLocked && (
                        <div className="w-full max-w-2xl h-screen opacity-50 flex flex-col gap-4 items-center">
                            {/* Fake Pages / Content to look like a blurred document */}
                            <div className="w-full aspect-[3/4] bg-white shadow-lg rounded-sm blur-sm"></div>
                            <div className="w-full aspect-[3/4] bg-white shadow-lg rounded-sm blur-sm"></div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

// Separate component for Watermark to handle its own canvas context and sizing
function WatermarkOverlay({ drawWatermark }: { drawWatermark: (ctx: CanvasRenderingContext2D, width: number, height: number) => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Use ResizeObserver to keep watermark in sync with page size
        const resizeObserver = new ResizeObserver(() => {
            const { width, height } = canvas.getBoundingClientRect();
            // Scaling for high DPI screens could be added here if needed, but simple sync is good for now
            // We set internal resolution to match display size
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) drawWatermark(ctx, width, height);
            }
        });

        resizeObserver.observe(canvas.parentElement || canvas);

        // Initial draw
        const { width, height } = canvas.getBoundingClientRect();
        if (width && height) {
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) drawWatermark(ctx, width, height);
        }

        return () => resizeObserver.disconnect();
    }, [drawWatermark]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />
    );
}
