import { getStoreProducts } from "@/app/actions/storeActions";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import StoreClient from "@/components/store/StoreClient";
import { prisma } from "@/lib/prisma";
import { StoreProduct } from "@prisma/client";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StorePage() {
    const session = await getServerSession(authOptions);

    // Fetch products
    const productsRes = await getStoreProducts();

    if (!productsRes.success && (productsRes as any).maintenance) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 max-w-md w-full space-y-8">
                    {/* Cow Animation/Image Area */}
                    <div className="relative w-64 h-64 mx-auto animate-pulse-slow">
                        {/* Bizim oluşturduğumuz OTLAK ineği */}
                        <div className="relative w-full h-full rounded-3xl overflow-hidden border-4 border-border bg-card shadow-2xl">
                            <img
                                src="/cow_eating_grass.png"
                                alt="Otlak İneği"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl font-black text-primary tracking-tight">
                            OTLANIYORUZ...
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            "Şu anda bu sayfa üzerinde otlanıyoruz, hazır olduğunda size haber vereceğiz."
                        </p>
                        <div className="text-xs text-primary/60 font-mono bg-card py-2 px-4 rounded-full inline-block border border-border">
                            Status: Grazing in progress... 🐄 🌿
                        </div>
                    </div>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mt-8 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Ana Sayfaya Dön
                    </Link>
                </div>
            </div>
        );
    }

    const products = productsRes.success ? (productsRes.data as StoreProduct[]) : [];

    // Fetch User Credits (if logged in)
    let userCredits = 0;
    if (session?.user?.id) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { credits: true }
        });
        userCredits = user?.credits || 0;
    }

    return (
        <div className="min-h-screen bg-background">
            <StoreClient products={products} userCredits={userCredits} />
        </div>
    );
}
