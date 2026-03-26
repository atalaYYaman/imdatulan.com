import PurchaseLogListClient from '@/components/admin/PurchaseLogListClient';

export default function AdminPurchaseLogsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Satın Alma Logları</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Not satın alma işlemlerini alıcı, satıcı, kredi ve bakiye detaylarıyla takip edin.
                </p>
            </div>

            <PurchaseLogListClient />
        </div>
    );
}
