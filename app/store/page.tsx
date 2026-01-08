import { getProducts } from "@/app/actions/storeActions";
import StoreClient from "@/components/store/StoreClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default async function StorePage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6 text-white bg-[#01353D]">
                <div className="bg-[#002A30] p-8 rounded-3xl border border-[#003E44] shadow-2xl max-w-lg w-full">
                    <div className="h-20 w-20 bg-[#22d3ee]/10 text-[#22d3ee] rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="h-10 w-10" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4">Mağazayı Görüntülemek İçin Giriş Yap</h1>
                    <p className="text-gray-400 mb-8">
                        Kazandığın sütleri harcamak için giriş yapmalısın.
                    </p>
                    <Link href="/auth/signin" className="px-8 py-3 bg-[#22d3ee] text-[#002A30] font-bold rounded-xl hover:bg-[#0ea5e9] transition-colors inline-block w-full">
                        Giriş Yap
                    </Link>
                </div>
            </div>
        )
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { credits: true }
    });

    const products = await getProducts();

    return <StoreClient products={products} userCredits={user?.credits ?? 0} />;
}
