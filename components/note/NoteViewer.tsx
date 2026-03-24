'use client';

import '@/lib/polyfills'; // Import polyfills first
import { useState, useRef, useEffect, useCallback } from 'react';
import { isPdfFile, isImageFile } from '@/lib/fileType';
import { Document, Page, pdfjs } from 'react-pdf';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
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
    fileCount?: number;
    fileExtensions?: string[];
}

export default function NoteViewer({ fileUrl, viewerUser, isLocked, onUnlock, isUnlocking, price = 1, errorMessage, fileExtension, fileCount = 1, fileExtensions }: NoteViewerProps) {
    const [fileIndex, setFileIndex] = useState(0);
    const [numPages, setNumPages] = useState<number>(0);
    const [scale, setScale] = useState<number>(1.0);
    const [isLoading, setIsLoading] = useState(true);
    const [pageWidth, setPageWidth] = useState<number | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [retryKey, setRetryKey] = useState(0);
    const [blobObjectUrl, setBlobObjectUrl] = useState<string | null>(null);
    /** Server returned SVG placeholder (e.g. locked single-page PDF); render as image, not react-pdf */
    const [servedAsSvgPlaceholder, setServedAsSvgPlaceholder] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const effectiveFileUrl = fileCount > 1
        ? `${fileUrl}${fileUrl.includes('?') ? '&' : '?'}fileIndex=${fileIndex}`
        : fileUrl;
    const effectiveFileExtension = (fileExtensions && fileExtensions[fileIndex]) ?? fileExtension ?? 'pdf';

    const handleRetry = useCallback(() => {
        setLoadError(null);
        setIsLoading(true);
        setRetryKey(k => k + 1);
    }, []);

    // Reset state when effectiveFileUrl or lock state changes
    useEffect(() => {
        setIsLoading(true);
        setLoadError(null);
        setServedAsSvgPlaceholder(false);
    }, [effectiveFileUrl, isLocked]);

    // Fetch file and create blob URL for in-viewer display (no external URL exposure)
    useEffect(() => {
        const input = { extension: effectiveFileExtension, url: effectiveFileUrl };
        if (!isPdfFile(input) && !isImageFile(input)) return;

        let revoked = false;
        setServedAsSvgPlaceholder(false);
        fetch(effectiveFileUrl, { credentials: 'include' })
            .then((res) => {
                if (!res.ok) throw new Error('Dosya yüklenemedi');
                const ct = res.headers.get('content-type') ?? '';
                const isLockedSvg = ct.includes('image/svg+xml');
                return res.blob().then((blob) => ({ blob, isLockedSvg }));
            })
            .then(({ blob, isLockedSvg }) => {
                if (revoked) return;
                setServedAsSvgPlaceholder(isLockedSvg);
                const url = URL.createObjectURL(blob);
                setBlobObjectUrl(url);
            })
            .catch((err) => {
                if (!revoked) {
                    console.error('Blob fetch error:', err);
                    setLoadError('İçerik yüklenirken bir hata oluştu.');
                    setIsLoading(false);
                }
            });

        return () => {
            revoked = true;
            setServedAsSvgPlaceholder(false);
            setBlobObjectUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
        };
    }, [effectiveFileUrl, effectiveFileExtension, isLocked]);

    // Handle Resize Logic
    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                if (width) setPageWidth(width);
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
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

    const fileTypeInput = { extension: effectiveFileExtension, url: effectiveFileUrl };
    const isPdf = isPdfFile(fileTypeInput);
    const isImage = isImageFile(fileTypeInput);
    const showPdfViewer = isPdf && !servedAsSvgPlaceholder;
    const showImageViewer = isImage || servedAsSvgPlaceholder;

    const canGoPrev = fileCount > 1 && fileIndex > 0;
    const canGoNext = fileCount > 1 && fileIndex < fileCount - 1;
    const goPrev = () => {
        setFileIndex(i => Math.max(0, i - 1));
        scrollAreaRef.current?.scrollTo({ top: 0 });
    };
    const goNext = () => {
        setFileIndex(i => Math.min(fileCount - 1, i + 1));
        scrollAreaRef.current?.scrollTo({ top: 0 });
    };

    // Zoom Handlers - Kilitliyse devre dışı
    const zoomIn = () => !isLocked && setScale(prev => Math.min(prev + 0.2, 3.0));
    const zoomOut = () => !isLocked && setScale(prev => Math.max(prev - 0.2, 0.5));

    /**
     * Shared Watermark Drawing Function
     * Renders directly onto the same canvas context
     */
    const drawWatermark = useCallback((canvas: HTMLCanvasElement | null) => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

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
                const x = i * xSpacing + xOffset + (xSpacing / 2) * 0.5;
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

    return (
        <div
            className="flex flex-col h-full bg-muted/20 relative select-none"
            onContextMenu={(e) => e.preventDefault()}
            ref={containerRef}
        >
            {/* Kilitli Durum Banner - Floating at top */}
            {isLocked && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-4 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="relative overflow-hidden bg-card/95 backdrop-blur-md border border-primary/20 p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-auto">
                        {/* Animated Glow */}
                        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50 rotate-45 pointer-events-none" />
                        
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                <span className="text-2xl">🔒</span>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-foreground">
                                    Önizleme Modu
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Tamamını görmek için <span className='font-bold text-primary'>{price} Süt</span> harcayın
                                </p>
                            </div>
                        </div>
                        
                        {errorMessage && (
                            <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-lg animate-in fade-in slide-in-from-top-2 relative z-10">
                                <p className="text-destructive text-xs font-bold flex items-center gap-2">
                                    <span>⚠️</span>
                                    {errorMessage}
                                </p>
                            </div>
                        )}
                        
                        <button
                            onClick={onUnlock}
                            disabled={isUnlocking}
                            className="relative z-10 shrink-0 px-6 py-2.5 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 disabled:opacity-70 text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn"
                        >
                            {isUnlocking ? (
                                <span className="flex items-center gap-2 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce delay-100" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce delay-200" />
                                    Açılıyor...
                                </span>
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

            {/* Toolbar - File navigation + Zoom Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 bg-card/80 backdrop-blur-md px-6 py-3 rounded-full border border-primary/20 shadow-2xl transition-transform hover:scale-105 select-none ring-1 ring-black/5">
                {fileCount > 1 && (
                    <>
                        <button
                            onClick={goPrev}
                            disabled={!canGoPrev}
                            className="p-2 hover:bg-primary/10 text-foreground hover:text-primary rounded-full transition-colors active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Önceki dosya"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <span className="text-sm font-bold text-muted-foreground min-w-[4rem] text-center">
                            {fileIndex + 1} / {fileCount}
                        </span>
                        <button
                            onClick={goNext}
                            disabled={!canGoNext}
                            className="p-2 hover:bg-primary/10 text-foreground hover:text-primary rounded-full transition-colors active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Sonraki dosya"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                        <div className="w-px h-6 bg-border" />
                    </>
                )}
                <button
                    onClick={zoomOut}
                    disabled={isLocked}
                    className="p-2 hover:bg-primary/10 text-foreground hover:text-primary rounded-full transition-colors active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ZoomOut className="w-6 h-6" />
                </button>
                <div className="w-px h-8 bg-border" />
                <span className="text-base font-bold text-primary min-w-[3.5rem] text-center font-mono">{Math.round(scale * 100)}%</span>
                <div className="w-px h-8 bg-border" />
                <button
                    onClick={zoomIn}
                    disabled={isLocked}
                    className="p-2 hover:bg-primary/10 text-foreground hover:text-primary rounded-full transition-colors active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ZoomIn className="w-6 h-6" />
                </button>
            </div>

            {/* Main Scrollable Area - Always show content (preview for locked, full for unlocked) */}
            <div ref={scrollAreaRef} className="flex-1 w-full overflow-y-auto bg-muted/20 scroll-smooth">
                <div className="max-w-max mx-auto px-4 py-20 min-h-full flex flex-col items-center gap-8 relative">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center text-primary z-40 pointer-events-none">
                            <div className="flex flex-col items-center gap-4 bg-background/80 p-6 rounded-2xl backdrop-blur-sm border border-border/50 shadow-xl">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
                                <span className="text-sm font-medium animate-pulse">İçerik yükleniyor...</span>
                            </div>
                        </div>
                    )}

                    <div className="relative shadow-2xl min-h-[500px] min-w-[300px] bg-white transition-all duration-500 animate-in fade-in" id="content-container">
                        {showPdfViewer ? (
                            blobObjectUrl ? (
                            <Document
                                key={`${retryKey}-${fileIndex}`}
                                file={blobObjectUrl}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={onDocumentLoadError}
                                loading={null}
                                className="flex flex-col gap-6"
                                error={
                                    <div className="p-10 text-center text-red-500 bg-red-50/50 rounded-xl">
                                        <p className="font-bold">PDF Açılmadı</p>
                                        <p className="text-sm mt-2 max-w-xs mx-auto text-muted-foreground">{loadError || "Bilinmeyen bir hata oluştu."}</p>
                                        <button
                                            type="button"
                                            onClick={handleRetry}
                                            className="mt-4 inline-block text-sm text-primary font-medium underline hover:no-underline focus:outline-none"
                                        >
                                            Tekrar Dene
                                        </button>
                                    </div>
                                }
                            >
                                {Array.from(new Array(numPages), (_, index) => (
                                    <SecurePage
                                        key={`page_${index + 1}`}
                                        pageNumber={index + 1}
                                        width={pageWidth ? (Math.min(pageWidth - 48, 800) * scale) : undefined}
                                        scale={pageWidth ? 1 : scale}
                                        drawWatermark={drawWatermark}
                                    />
                                ))}
                            </Document>
                            ) : null
                        ) : showImageViewer ? (
                            blobObjectUrl ? (
                            <SecureImage
                                key={`${retryKey}-${fileIndex}`}
                                fileUrl={blobObjectUrl}
                                scale={scale}
                                drawWatermark={drawWatermark}
                                onLoad={() => setIsLoading(false)}
                                onError={() => {
                                    setIsLoading(false);
                                    setLoadError("Resim yüklenemedi");
                                }}
                            />
                            ) : null
                        ) : (
                            <div className="flex flex-col items-center justify-center h-96 p-8 text-center bg-card rounded-2xl border border-border">
                                <p className="text-xl font-bold mb-4">Önizleme Kullanılamıyor</p>
                                <p className="text-muted-foreground">Bu dosya formatı ({effectiveFileExtension || "bilinmiyor"}) şu an için tarayıcıda görüntülenemiyor. Desteklenen formatlar: PDF, JPG, PNG, WebP, GIF.</p>
                            </div>
                        )}
                    </div>

                    {/* Locked Content Notice at bottom of preview */}
                    {isLocked && numPages > 0 && (
                        <div className="w-full max-w-2xl p-6 bg-primary/5 border border-primary/20 rounded-2xl text-center animate-in fade-in slide-in-from-bottom-2">
                            <p className="text-sm text-muted-foreground mb-3">
                                <span className="font-bold text-primary">Önizleme Modu:</span> Şu anda sadece ilk {numPages} sayfa görüntüleniyor.
                            </p>
                            <p className="text-xs text-muted-foreground/80">
                                Notun tamamını görmek için yukarıdaki butona tıklayarak {price} Süt harcayın.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Security Wrapper for PDF Page
interface SecurePageProps {
    pageNumber: number;
    width?: number;
    scale: number;
    drawWatermark: (canvas: HTMLCanvasElement | null) => void;
}

function SecurePage({ pageNumber, width, scale, drawWatermark }: SecurePageProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    return (
        <div className="relative bg-white shadow-md">
            <Page
                pageNumber={pageNumber}
                width={width}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                canvasRef={canvasRef}
                onRenderSuccess={() => drawWatermark(canvasRef.current)}
                loading={<div className="bg-muted animate-pulse" style={{ width: width || 600, height: (width || 600) * 1.41 }} />}
                className="nod-pdf-page relative"
            />
            {/* Transparent overlay strictly for event blocking, NOT for visual watermarking */}
            <div className="absolute inset-0 z-50 bg-transparent" onContextMenu={(e) => e.preventDefault()} />
        </div>
    );
}

// Security Wrapper for Image
interface SecureImageProps {
    fileUrl: string;
    scale: number;
    drawWatermark: (canvas: HTMLCanvasElement | null) => void;
    onLoad: () => void;
    onError: () => void;
}

function SecureImage({ fileUrl, scale, drawWatermark, onLoad, onError }: SecureImageProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Draw image + watermark on a single canvas
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = fileUrl;

        img.onload = () => {
            onLoad();
            setImageLoaded(true);
            const canvas = canvasRef.current;
            if (!canvas) return;

            // Set canvas size to match image natural size
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                // 1. Draw Image
                ctx.drawImage(img, 0, 0);
                // 2. Bake Watermark
                drawWatermark(canvas);
            }
        };
        img.onerror = onError;
    }, [fileUrl, drawWatermark, onLoad, onError]);

    return (
        <div className="relative bg-white p-2 shadow-md inline-block">
            <div
                style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'top center',
                }}
                className="relative"
            >
                {/* We render ONLY the canvas, no <img> tag that can be inspected separately */}
                <canvas
                    ref={canvasRef}
                    className="max-w-[90vw] object-contain pointer-events-auto block"
                />
                <div className="absolute inset-0 z-50 bg-transparent" onContextMenu={(e) => e.preventDefault()} />
            </div>
        </div>
    );
}
