'use client';

import { useState } from 'react';
import { approveUser, rejectUser } from '@/app/actions/adminActions';
import Image from 'next/image';
import { Check, X, CreditCard, Mail, School, BookOpen, User, ZoomIn, Loader2 } from 'lucide-react';

type UserData = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    tcIdentityNo: string | null;
    studentIdCardUrl: string | null;
    studentNumber: string | null;
    university: string | null;
    department: string | null;
    createdAt: Date;
};

export default function UserApprovalList({ users }: { users: UserData[] }) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleApprove = async (userId: string) => {
        if (!confirm('Kullanıcıyı onaylamak istediğinize emin misiniz?')) return;
        setActionLoading(userId);
        await approveUser(userId);
        setActionLoading(null);
    };

    const handleReject = async (userId: string) => {
        const reason = prompt('Reddetme sebebi?');
        if (!reason) return;

        setActionLoading(userId);
        await rejectUser(userId, reason);
        setActionLoading(null);
    };

    if (users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-card/50 rounded-3xl border border-dashed border-border">
                <div className="bg-muted p-4 rounded-full mb-4">
                    <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold">Başvuru Yok</h3>
                <p className="text-muted-foreground">Şu an bekleyen kullanıcı onayı bulunmuyor.</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid gap-6">
                {users.map(user => (
                    <div key={user.id} className="group relative overflow-hidden bg-card/60 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300">
                        <div className="flex flex-col lg:flex-row gap-8">

                            {/* ID Card Image */}
                            <div
                                className="w-full lg:w-1/3 relative h-64 lg:h-auto min-h-[250px] rounded-2xl overflow-hidden cursor-pointer group/image border-2 border-border/50 hover:border-primary/50 transition-colors bg-black/5"
                                onClick={() => user.studentIdCardUrl && setSelectedImage(user.studentIdCardUrl)}
                            >
                                {user.studentIdCardUrl ? (
                                    <>
                                        <Image
                                            src={user.studentIdCardUrl}
                                            alt="Student ID"
                                            fill
                                            className="object-contain p-2 group-hover/image:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white font-bold flex items-center gap-2">
                                                <ZoomIn className="w-4 h-4" /> Büyüt
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                                        <div className="p-4 bg-muted/50 rounded-full">
                                            <CreditCard className="w-8 h-8 opacity-50" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider">Görsel Yok</span>
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 flex flex-col justify-between py-2">
                                <div>
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <h3 className="text-2xl font-black text-foreground">{user.firstName} {user.lastName}</h3>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">
                                                Başvuru: <span className="text-foreground">{new Date(user.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-xs font-bold rounded-full border border-blue-500/20 animate-pulse">
                                            Yeni Başvuru
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        <div className="flex items-center gap-3 p-3 bg-background/40 rounded-xl border border-border/50">
                                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                <CreditCard className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase text-muted-foreground font-bold">TC Kimlik No</div>
                                                <div className="text-sm font-mono font-bold text-foreground">{user.tcIdentityNo}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-background/40 rounded-xl border border-border/50">
                                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                <BookOpen className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase text-muted-foreground font-bold">Öğrenci No</div>
                                                <div className="text-sm font-mono font-bold text-foreground">{user.studentNumber}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-background/40 rounded-xl border border-border/50">
                                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase text-muted-foreground font-bold">Email</div>
                                                <div className="text-sm font-medium text-foreground truncate max-w-[200px]">{user.email}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-background/40 rounded-xl border border-border/50 bg-secondary/10">
                                            <div className="p-2 bg-secondary/20 rounded-lg text-secondary-foreground">
                                                <School className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase text-muted-foreground font-bold">{user.university}</div>
                                                <div className="text-sm font-bold text-foreground">{user.department}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-4 mt-8">
                                    <button
                                        onClick={() => handleApprove(user.id)}
                                        disabled={!!actionLoading}
                                        className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {actionLoading === user.id ? <Loader2 className="animate-spin w-5 h-5" /> : <><Check className="w-5 h-5" /> Onayla</>}
                                    </button>
                                    <button
                                        onClick={() => handleReject(user.id)}
                                        disabled={!!actionLoading}
                                        className="flex-1 px-6 py-3 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 rounded-xl font-bold border border-rose-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <X className="w-5 h-5" /> Reddet
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative w-full max-w-5xl h-[85vh] animate-in zoom-in-95 duration-300">
                        <Image
                            src={selectedImage}
                            alt="Student ID Full"
                            fill
                            className="object-contain drop-shadow-2xl"
                        />
                        <button
                            className="absolute top-4 right-4 text-white hover:text-white/80 transition-colors bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/10"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">Kapatmak için boşluğa tıklayın</p>
                    </div>
                </div>
            )}
        </>
    );
}
