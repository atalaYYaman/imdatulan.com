import { getStoreProducts } from "@/app/actions/storeActions";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import StoreClient from "@/components/store/StoreClient";
import { prisma } from "@/lib/prisma";
import { StoreProduct } from "@prisma/client";

export const dynamic = 'force-dynamic';

export default async function StorePage() {
    const session = await getServerSession(authOptions);

    // Fetch products
    const productsRes = await getStoreProducts();

    if (!productsRes.success && (productsRes as any).maintenance) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="bg-card border border-border p-8 rounded-3xl text-center max-w-md shadow-2xl">
                    <div className="text-6xl mb-4">🚧</div>
                    <h2 className="text-2xl font-black mb-2">Mağaza Bakımda</h2>
                    <p className="text-muted-foreground">
                        {productsRes.message || "Şu anda hizmet veremiyoruz. Lütfen daha sonra tekrar gel."}
                    </p>
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
