import { getUserCoupons } from "@/app/actions/storeActions";
import TicketCard from "@/components/store/TicketCard";
import { Ticket } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function WalletPage() {
    const couponsRes = await getUserCoupons();
    const coupons = couponsRes.success ? (couponsRes.data as any[]) : [];

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <span className="p-2 bg-primary/10 rounded-xl text-primary">
                                <Ticket className="w-8 h-8" />
                            </span>
                            Cüzdanı
                        </h1>
                        <p className="text-muted-foreground mt-2 ml-1">
                            Satın aldığın kuponlar ve biletler burada.
                        </p>
                    </div>
                </div>

                {/* Content */}
                {coupons.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border-2 border-dashed border-border text-center">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                            <Ticket className="w-10 h-10 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">Cüzdanın Boş</h3>
                        <p className="text-muted-foreground mt-2 mb-6 max-w-xs mx-auto">
                            Henüz hiç kuponun yok. Süt Mağazası'ndan harika ödüller alabilirsin!
                        </p>
                        <Link
                            href="/store"
                            className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
                        >
                            Mağazaya Git
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {coupons.map((coupon) => (
                            <TicketCard key={coupon.id} transaction={coupon} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
