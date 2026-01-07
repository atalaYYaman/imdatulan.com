'use client';

interface NoteViewerProps {
    fileUrl: string;
    uploaderName: string;
}

export default function NoteViewer({ fileUrl, uploaderName }: NoteViewerProps) {
    return (
        <div className="w-full h-full relative group">
            {/* PDF Görüntüleyici */}
            <iframe
                src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full border-none"
                title="Not Görüntüleyici"
            />

            {/* Filigran Katmanı (Tıklanmaz) */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center overflow-hidden opacity-10 select-none z-10">
                <div className="absolute inset-0 flex flex-wrap content-center justify-center gap-20 p-10 transform -rotate-12">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <span className="text-4xl font-extrabold text-white">OTLAK</span>
                            <span className="text-xl font-bold text-white">{uploaderName}</span>
                            <span className="text-sm text-gray-300">İzinsiz Paylaşılması Yasaktır</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sağ Tık Engelleme Katmanı (Opsiyonel, basit koruma) */}
            <div
                className="absolute inset-0 z-20"
                onContextMenu={(e) => {
                    e.preventDefault();
                    return false;
                }}
            />
        </div>
    );
}
