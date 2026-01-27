import { getPartnerDashboard } from "@/app/actions/storeActions";
import PartnerDashboardClient from "@/components/partner/PartnerDashboardClient";
import { AlertTriangle, Lock } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function PartnerDashboardPage() {
    const res = await getPartnerDashboard();

    if (!res.success || !res.data) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-card border border-destructive/50 p-8 rounded-3xl text-center max-w-md shadow-2xl shadow-destructive/10">
                    <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-black mb-2">Erişim Reddedildi</h1>
                    <p className="text-muted-foreground mb-6">
                        Bu sayfayı görüntülemek için Partner yetkisine sahip olmalısınız.
                    </p>
                    <div className="text-xs font-mono bg-muted p-3 rounded-lg opacity-70">
                        {res.message || 'Yetkisiz Erişim'}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <PartnerDashboardClient store={res.data as any} />
        </div>
    );
}
