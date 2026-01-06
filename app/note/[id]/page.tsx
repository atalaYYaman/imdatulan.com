'use client';

import { useParams } from "next/navigation";
import { notes, users } from "@/lib/dummyData"; // Importing mock data
import { Eye, Clock, Download, FileText, Star, User, Lock, Send, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function NoteDetailPage() {
    const { id } = useParams();
    const note = notes.find(n => n.id === id);
    const uploader = users.find(u => u.id === note?.uploaderId);

    if (!note || !uploader) {
        return <div className="p-10 text-center text-white">Not bulunamadı.</div>;
    }

    return (
        <div className="min-h-screen bg-[#01353D] text-white p-4 md:p-8 pb-24 md:pb-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN: Main Content & Preview */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-[#22d3ee]/10 text-[#22d3ee] px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                                {note.type}
                            </div>
                            <div className="text-gray-400 text-xs flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {new Date(note.createdAt).toLocaleDateString('tr-TR')}
                            </div>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{note.title}</h1>
                        <div className="flex flex-wrap text-sm text-gray-300 gap-x-4 gap-y-1">
                            <span className="flex items-center gap-1"><span className="text-[#22d3ee]">Uni:</span> {note.university}</span>
                            <span className="flex items-center gap-1"><span className="text-[#22d3ee]">Bölüm:</span> {note.department}</span>
                            <span className="flex items-center gap-1"><span className="text-[#22d3ee]">Ders:</span> {note.course}</span>
                            {note.instructor && <span className="flex items-center gap-1"><span className="text-[#22d3ee]">Hoca:</span> {note.instructor}</span>}
                        </div>
                    </div>

                    {/* Preview Area (Mock) */}
                    <div className="bg-[#002A30] border border-[#003E44] rounded-2xl p-1 shadow-2xl relative overflow-hidden group">
                        <div className="aspect-[3/4] md:aspect-[16/9] bg-white rounded-xl relative flex items-center justify-center">
                            {/* Mock Preview Content */}
                            <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center p-8 text-gray-800 text-center select-none blur-[2px] hover:blur-none transition-all duration-300">
                                <FileText className="h-16 w-16 text-gray-300 mb-4" />
                                <h3 className="text-xl font-bold mb-2">{note.title}</h3>
                                <p className="text-sm">Bu bir önizlemedir. Tam içeriği görüntülemek için lütfen erişim sağlayın.</p>

                                {/* Watermark */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 rotate-[-45deg]">
                                    <span className="text-9xl font-black text-black">NOD</span>
                                </div>
                            </div>

                            {/* Paywall Overlay */}
                            <div className="absolute inset-0 bg-[#002A30]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
                                <Lock className="h-12 w-12 text-[#22d3ee] mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Bu NOD'a Erişmek İçin...</h3>
                                <p className="text-gray-300 mb-6 max-w-md">
                                    NOD sisteminde "Al gülüm ver gülüm" kuralı geçerlidir.
                                    Son 30 gün içinde onaylanmış bir notun yoksa diğer içerikleri göremezsin.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                                    <Button variant="primary" className="w-full">
                                        Hemen Not Yükle
                                    </Button>
                                    <Button variant="outline" className="w-full">
                                        Satın Al (Premium)
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="bg-[#002A30] border border-[#003E44] rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Yorumlar (3)</h3>

                        {/* Comment Input */}
                        <div className="flex gap-4 mb-6">
                            <div className="h-10 w-10 rounded-full bg-gray-700 flex-shrink-0" />
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Bu not hakkında bir şeyler söyle..."
                                    className="w-full bg-[#01353D] border border-[#003E44] rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:border-[#22d3ee] outline-none"
                                />
                                <button className="absolute right-2 top-2 p-1 text-[#22d3ee] hover:bg-[#22d3ee]/10 rounded-lg">
                                    <Send className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Mock Comments */}
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="flex gap-3 border-b border-[#003E44] last:border-0 pb-4 last:pb-0">
                                    <div className="h-8 w-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-xs font-bold">U{i}</div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-semibold text-white">Kullanıcı {i}</span>
                                            <span className="text-[10px] text-gray-500">2 gün önce</span>
                                        </div>
                                        <p className="text-sm text-gray-300">Teşekkürler hocam, çok işime yaradı! Özellikle son kısımdaki örnekler harika.</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Sidebar Info */}
                <div className="space-y-6">
                    {/* Author Card */}
                    <div className="bg-[#002A30] border border-[#003E44] rounded-2xl p-6 sticky top-24">
                        <div className="flex flex-col items-center text-center">
                            <div className="h-20 w-20 rounded-full border-2 border-[#22d3ee] p-1 mb-3">
                                {uploader.avatar ? (
                                    <img src={uploader.avatar} alt={uploader.name} className="h-full w-full rounded-full object-cover" />
                                ) : (
                                    <div className="h-full w-full rounded-full bg-gray-700 flex items-center justify-center">
                                        <User className="h-8 w-8 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-white">{uploader.name}</h3>
                            <p className="text-xs text-gray-400 mb-4">{uploader.department}</p>

                            <div className="flex justify-center gap-6 w-full mb-6 border-y border-[#003E44] py-4">
                                <div>
                                    <div className="text-lg font-bold text-white">{uploader.stats.followers}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Takipçi</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-white">{uploader.stats.totalNotes}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Not</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-[#22d3ee] flex items-center gap-1 justify-center">
                                        {uploader.stats.rating} <Star className="h-3 w-3 fill-current" />
                                    </div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Puan</div>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full mb-2">Takip Et</Button>
                            <Button variant="ghost" size="sm" className="w-full text-gray-400">Profili Görüntüle</Button>
                        </div>
                    </div>

                    {/* Note Stats / Actions */}
                    <div className="bg-[#002A30] border border-[#003E44] rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-gray-300">
                                <Eye className="h-4 w-4 text-[#22d3ee]" />
                                <span className="text-sm font-medium">{note.viewCount} Görüntülenme</span>
                            </div>
                            <button className="text-gray-400 hover:text-white">
                                <Share2 className="h-4 w-4" />
                            </button>
                        </div>
                        <Button variant="secondary" className="w-full flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            PDF İndir
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
