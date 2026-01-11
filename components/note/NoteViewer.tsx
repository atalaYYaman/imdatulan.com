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
    const [scale, setScale] = useState<number>(isLocked ? 0.6 : 1.0); // Kilitliyse biraz daha küçük göster
    const [isLoading, setIsLoading] = useState(true);
    const [pageWidth, setPageWidth] = useState<number | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null); // Local error state
    const containerRef = useRef<HTMLDivElement>(null);

    // Canvas Refs for Images
    const imageCanvasRef = useRef<HTMLCanvasElement>(null);

    // Handle Resize Logic
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                // Use contentRect or contentBoxSize
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
     * Draws the watermark directly onto the provided canvas context.
     * USED ONLY FOR IMAGES NOW (Server handles PDF watermark)
     */
    const drawWatermark = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
        if (!ctx) return;

        // Save context state
        ctx.save();

        // Watermark Configuration
        const text = "OTLAK.COM.TR";
        const subText = viewerUser.name.toUpperCase();
        const studentNumber = viewerUser.studentNumber;

        // Calculate spacing
        const cols = 4; // Number of columns
        const rows = 6; // Number of rows
        const xSpacing = width / cols;
        const ySpacing = height / rows;

        ctx.rotate(-12 * Math.PI / 180); // Rotate entire context slightly or individually? 
        // Better to rotate individually or rotate context once?
        // Let's rotate individual blocks to match previous design: transform -rotate-12
        ctx.restore(); // Restore to remove global rotation if we want local rotation

        // Loop to fill the canvas
        // We actually want a grid of watermarks.
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                ctx.save();

                // Position logic
                // Add some offset for "brick" pattern if desired, or simple grid
                const x = i * xSpacing + (j % 2 === 0 ? 0 : xSpacing / 2);
                const y = j * ySpacing;

                // Move to position
                ctx.translate(x, y);
                ctx.rotate(-12 * Math.PI / 180);

                // Draw Branding
                ctx.font = "900 40px Inter, Roboto, sans-serif"; // Tailwind text-5xl approx
                ctx.fillStyle = "rgba(203, 213, 225, 0.3)"; // slate-300/50 approx
                ctx.textAlign = "center";
                ctx.fillText(text, 0, 0);

                // Draw Name
                ctx.font = "bold 20px Inter, Roboto, sans-serif"; // text-xl approx
                ctx.fillStyle = "rgba(239, 68, 68, 0.2)"; // red-500/40 approx
                ctx.fillText(subText, 0, 30);

                // Draw Student Number
                ctx.font = "monospace 14px monospace"; // text-sm font-mono
                ctx.fillStyle = "rgba(148, 163, 184, 0.3)"; // slate-400/50 approx
                ctx.fillText(studentNumber, 0, 50);

                ctx.restore();
            }
        }
    }, [viewerUser]);

    /**
     * Handle Image Rendering on Canvas
     */
    useEffect(() => {
        if (isImage && fileUrl && imageCanvasRef.current && !isLoading) {
            const canvas = imageCanvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const img = new Image();
            img.crossOrigin = "anonymous"; // Needed if images are on different domain (Blob storage)
            img.src = fileUrl;
            img.onload = () => {
                // Set canvas size to match image
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;

                // Draw image
                ctx.drawImage(img, 0, 0);

                // Draw Watermark
                drawWatermark(ctx, canvas.width, canvas.height);
            };
        }
    }, [isImage, fileUrl, isLoading, drawWatermark, scale]);
    // Re-run if scale changes? No, canvas internal resolution should be high quality (natural size).
    // CSS handle scaling.

    return (
        <div
            className="flex flex-col h-full bg-muted/20 relative select-none"
            onContextMenu={(e) => e.preventDefault()}
            ref={containerRef}
        >
            {/* Kilitli Durum Overlay */}
            {isLocked && !isLoading && (
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
                                onLoadError={onDocumentLoadError}
                                loading={null}
                                className={`flex flex-col gap-6 transition-all duration-500 ${isLocked ? 'blur-md grayscale opacity-50' : ''}`}
                                error={
                                    <div className="p-10 text-center text-red-500 bg-red-50/50 rounded-xl">
                                        <p className="font-bold">PDF Açılmadı</p>
                                        <p className="text-sm mt-2 max-w-xs mx-auto text-muted-foreground">{loadError || "Bilinmeyen bir hata oluştu."}</p>
                                        <a href={fileUrl} target="_blank" className="mt-4 inline-block text-xs text-primary underline">Dosyayı İndirip Açmayı Dene</a>
                                    </div>
                                }
                            >
                                {Array.from(new Array(numPages), (_, index) => {
                                    if (isLocked && index > 0) return null;
                                    return (
                                        <div key={`page_${index + 1}`} className="relative bg-white shadow-md">
                                            <Page
                                                pageNumber={index + 1}
                                                // Responsive width logic:
                                                // Fit to container width (safe margin) * scale
                                                width={pageWidth ? (Math.min(pageWidth - 48, 800) * scale) : undefined}
                                                // If width is undefined (initial load), react-pdf uses original width.
                                                // 'scale' prop is ignored if width is provided in some versions, or acts as multiplier? 
                                                // To be safe, we rely on 'width' for Zooming.
                                                // If pageWidth is null, we can pass scale prop for initial render (though it might flicker).
                                                scale={pageWidth ? 1 : scale}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                                loading={<div className="bg-muted animate-pulse" style={{ width: 600 * scale, height: 800 * scale }} />}
                                                className="nod-pdf-page"
                                            />
                                        </div>
                                    );
                                })}
                            </Document>
                        ) : isImage ? (
                            <div className={`relative bg-white p-2 shadow-md ${isLocked ? 'blur-md grayscale opacity-50' : ''}`}>
                                <canvas
                                    ref={imageCanvasRef}
                                    className="max-w-[90vw] object-contain pointer-events-none"
                                    style={{
                                        transform: `scale(${scale})`,
                                        transformOrigin: 'top center',
                                        width: 'auto',
                                        height: 'auto',
                                        maxWidth: '90vw'
                                    }}
                                    onContextMenu={(e) => e.preventDefault()}
                                />
                                {isLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center text-primary z-40 bg-white/80">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
                                            <span className="text-sm font-medium animate-pulse">Resim işleniyor...</span>
                                        </div>
                                    </div>
                                )}
                                {/* Trigger loading completion for images */}
                                <img
                                    src={fileUrl}
                                    className="hidden"
                                    onLoad={() => setIsLoading(false)}
                                    alt="Hidden loader"
                                />
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
