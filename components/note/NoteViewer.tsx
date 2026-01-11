'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
    const containerRef = useRef<HTMLDivElement>(null);

    // Canvas Refs for Images
    const imageCanvasRef = useRef<HTMLCanvasElement>(null);

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

    /**
     * Shared Watermark Drawing Function
     * Draws the watermark directly onto the provided canvas context.
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
     * Handle PDF Page Render Success
     * Locates the canvas within the specific page container and draws the watermark.
     */
    const handlePageRenderSuccess = useCallback((page: any) => {
        // react-pdf renders a canvas. We can access it via the page element reference or standard DOM query within the specific page div.
        // However, 'page' object passed here might contain reference to the canvas? 
        // Based on react-pdf docs, onRenderSuccess passes generic page info.
        // Best reliable way: Query selector looking for canvas inside the container for this specific page.
        // But we have multiple pages.
        // Alternative: The <Page> component renders a canvas as a direct child or wrapper.
        // We will try to find the canvas in the DOM for this specific page index.

        const pageNumber = page.pageNumber; // 1-based
        const pageElement = document.querySelector(`[data-page-number="${pageNumber}"]`);
        if (pageElement) {
            const canvas = pageElement.querySelector('canvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    drawWatermark(ctx, canvas.width, canvas.height);
                }
            }
        }
    }, [drawWatermark]);

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
                <div className="absolute inset-0 z-[60] backdrop-blur-xl bg-background/50 flex items-center justify-center pointer-events-auto p-4">
                    <div className="relative overflow-hidden bg-card/80 backdrop-blur-2xl border border-white/10 dark:border-white/5 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col items-center gap-6 max-w-sm text-center transform hover:scale-[1.02] transition-transform duration-300 animate-in fade-in zoom-in group">

                        {/* Animated Glow */}
                        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 rotate-45 pointer-events-none" />

                        <div className="relative w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center animate-bounce-slow ring-8 ring-primary/5">
                            <span className="text-5xl drop-shadow-md">🔒</span>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-foreground mb-3 tracking-tight">Bu Not Kilitli</h2>
                            <p className="text-muted-foreground text-sm leading-relaxed px-4">
                                Notun tamamını görüntülemek için sadece <span className='font-bold text-primary'>{price} Süt</span> harcamanız yeterli.
                            </p>
                            {errorMessage && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in slide-in-from-top-2">
                                    <p className="text-red-500 text-xs font-bold flex items-center justify-center gap-2">
                                        <span className="text-lg">⚠️</span>
                                        {errorMessage}
                                    </p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onUnlock}
                            disabled={isUnlocking}
                            className="w-full relative overflow-hidden py-4 bg-primary hover:bg-primary/90 disabled:opacity-70 text-primary-foreground font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn"
                        >
                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover/btn:translate-x-[150%] transition-transform duration-700 ease-in-out" />
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
                                        <div key={`page_${index + 1}`} className="relative bg-white shadow-md">
                                            <Page
                                                pageNumber={index + 1}
                                                scale={scale}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                                onRenderSuccess={handlePageRenderSuccess}
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
