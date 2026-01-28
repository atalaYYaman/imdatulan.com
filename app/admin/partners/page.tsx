import { prisma } from '@/lib/prisma';
import { getAllPartners } from '@/app/actions/adminActions';
import PartnerManagementClient from '@/components/admin/PartnerManagementClient';

export const dynamic = 'force-dynamic';

export default async function AdminPartnersPage() {
    const [{ success, data }, stores] = await Promise.all([
        getAllPartners(),
        prisma.store.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        }),
    ]);

    if (!success || !data) {
        return (
            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm">
                Partner listesi yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.
            </div>
        );
    }

    return <PartnerManagementClient partners={data as any} stores={stores} />;
}

