import { prisma } from '@/lib/prisma';
import AdminStoreListClient from '@/components/admin/AdminStoreListClient';
import { ShoppingBag } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminStoresPage() {
    // Fetch all stores with product counts
    const stores = await prisma.store.findMany({
        include: {
            _count: {
                select: { products: true, transactions: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                    <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Mağaza Yönetimi</h1>
                    <p className="text-muted-foreground">Platformdaki mağazaları ve partnerleri yönetin.</p>
                </div>
            </div>

            {/* Store List Client Component */}
            <AdminStoreListClient stores={stores} />
        </div>
    );
}
