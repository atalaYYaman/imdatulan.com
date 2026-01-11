import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

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
        <div className="p-8 text-foreground">
            <h1 className="text-3xl font-bold mb-8">Geri Bildirimler ({feedbacks.length})</h1>

            <div className="grid gap-6">
                {feedbacks.map(item => (
                    <div key={item.id} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-6">
                        {/* Image Preview */}
                        {item.imageUrl && (
                            <div className="shrink-0">
                                <a href={item.imageUrl} target="_blank" rel="noopener noreferrer">
                                    <img src={item.imageUrl} alt="Feedback Attachment" className="h-32 w-32 object-cover rounded-lg border border-border hover:opacity-90 transition-opacity" />
                                </a>
                            </div>
                        )}

                        <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.topic === 'Bug' ? 'bg-red-500/10 text-red-500' :
                                        item.topic === 'Öneri' ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-500'
                                    }`}>
                                    {item.topic}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(item.createdAt).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <h3 className="font-semibold text-lg">{item.user.firstName} {item.user.lastName} <span className="text-muted-foreground text-sm font-normal">({item.user.email})</span></h3>

                            <p className="text-sm bg-muted/30 p-4 rounded-lg border border-border/50 whitespace-pre-wrap">
                                {item.message}
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 justify-center shrink-0">
                            {/* Placeholder Actions */}
                            <button className="px-4 py-2 text-xs font-bold border border-border rounded hover:bg-accent transition-colors">
                                Detay & Yazdır 🖨️
                            </button>
                        </div>
                    </div>
                ))}

                {feedbacks.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        Henüz hiç geri bildirim yok.
                    </div>
                )}
            </div>
        </div>
    );
}
