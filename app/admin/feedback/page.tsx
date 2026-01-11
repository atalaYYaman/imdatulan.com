import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Calendar, User, Printer, Quote, HelpCircle, Bug, Lightbulb } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminFeedbackPage() {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') redirect('/');

    const feedbacks = await prisma.feedback.findMany({
        include: {
            user: {
                select: { firstName: true, lastName: true, email: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col space-y-2">
                <h1 className="text-2xl md:text-3xl font-black text-foreground flex items-center gap-3">
                    <div className="bg-amber-500/10 text-amber-500 p-2 rounded-xl">
                        <MessageSquare className="w-8 h-8" />
                    </div>
                    Geri Bildirimler
                    <span className="text-sm font-bold bg-muted px-3 py-1 rounded-full text-muted-foreground border border-border ml-2">{feedbacks.length}</span>
                </h1>
                <p className="text-muted-foreground ml-14">Kullanıcılardan gelen öneri, şikayet ve hata bildirimleri.</p>
            </div>

            {feedbacks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-card/50 rounded-3xl border border-dashed border-border backdrop-blur-sm">
                    <div className="bg-muted p-4 rounded-full mb-4">
                        <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold">Geri Bildirim Kutusu Boş</h3>
                    <p className="text-muted-foreground">Henüz kullanıcılar tarafından gönderilen bir geri bildirim yok.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {feedbacks.map(item => (
                        <div key={item.id} className="group overflow-hidden bg-card/60 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Image Preview */}
                                {item.imageUrl && (
                                    <div className="shrink-0">
                                        <a href={item.imageUrl} target="_blank" rel="noopener noreferrer" className="block relative group/img overflow-hidden rounded-2xl border-2 border-border/50">
                                            <img src={item.imageUrl} alt="Feedback Attachment" className="h-40 w-40 object-cover group-hover/img:scale-110 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md px-2 py-1 rounded bg-black/20">Büyüt</span>
                                            </div>
                                        </a>
                                    </div>
                                )}

                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 border ${item.topic === 'Bug' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                item.topic === 'Öneri' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                            }`}>
                                            {item.topic === 'Bug' ? <Bug className="w-3 h-3" /> :
                                                item.topic === 'Öneri' ? <Lightbulb className="w-3 h-3" /> :
                                                    <HelpCircle className="w-3 h-3" />}
                                            {item.topic}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-background/50 px-2 py-1 rounded-lg border border-border/50">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(item.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-lg flex items-center gap-2">
                                            <User className="w-4 h-4 text-primary" />
                                            {item.user.firstName} {item.user.lastName}
                                            <span className="text-muted-foreground text-sm font-normal">({item.user.email})</span>
                                        </h3>
                                    </div>

                                    <div className="relative">
                                        <Quote className="absolute -top-2 -left-2 w-6 h-6 text-primary/10 rotate-180" />
                                        <p className="text-sm leading-relaxed bg-background/50 p-6 rounded-2xl border border-border/50 whitespace-pre-wrap font-medium text-foreground/90">
                                            "{item.message}"
                                        </p>
                                        <Quote className="absolute -bottom-2 -right-2 w-6 h-6 text-primary/10" />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 justify-center shrink-0 border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pl-4 md:pt-0">
                                    {/* Actions */}
                                    <button className="flex items-center gap-2 px-4 py-3 text-xs font-bold border border-border rounded-xl hover:bg-accent hover:text-accent-foreground transition-all hover:shadow-lg w-full justify-center">
                                        <Printer className="w-4 h-4" />
                                        Yazdır
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
