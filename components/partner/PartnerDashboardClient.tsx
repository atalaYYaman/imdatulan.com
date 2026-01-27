'use client';

import { Store, StoreProduct, StoreTransaction, User } from "@prisma/client";
import { useState, useTransition } from "react";
import { Package, QrCode, Search, CheckCircle, AlertCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { redeemProduct, updateProductStock } from "@/app/actions/storeActions";
import { cn } from "@/lib/utils";

interface PartnerDashboardClientProps {
    store: Store & {
        products: StoreProduct[];
        transactions: (StoreTransaction & { user: User; product: StoreProduct })[];
    };
}

export default function PartnerDashboardClient({ store }: PartnerDashboardClientProps) {
    const [activeTab, setActiveTab] = useState<'inventory' | 'redemption'>('inventory');

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-6 rounded-3xl border border-border shadow-sm">
                <div className="flex items-center gap-4">
                    {store.logo && <img src={store.logo} alt={store.name} className="w-16 h-16 rounded-xl object-cover" />}
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">{store.name}</h1>
                        <p className="text-muted-foreground">Partner Paneli</p>
                    </div>
                </div>

                <div className="flex bg-muted/50 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={cn("px-6 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'inventory' ? "bg-background shadow text-primary" : "text-muted-foreground hover:text-foreground")}
                    >
                        Envanter
                    </button>
                    <button
                        onClick={() => setActiveTab('redemption')}
                        className={cn("px-6 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'redemption' ? "bg-background shadow text-primary" : "text-muted-foreground hover:text-foreground")}
                    >
                        Kupon Kullan
                    </button>
                </div>
            </div>

            {activeTab === 'inventory' ? (
                <InventoryTab products={store.products} />
            ) : (
                <RedemptionTab transactions={store.transactions} />
            )}
        </div>
    );
}

function InventoryTab({ products }: { products: StoreProduct[] }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                    <ProductStockCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}

function ProductStockCard({ product }: { product: StoreProduct }) {
    const [stock, setStock] = useState(product.stock || 0);
    const [isPending, startTransition] = useTransition();

    const handleUpdate = () => {
        if (stock < 0) {
            toast.error("Stok sayısı negatif olamaz");
            return;
        }

        startTransition(async () => {
            const res = await updateProductStock(product.id, stock);
            if (res.success) {
                toast.success("Stok güncellendi");
            } else {
                toast.error(res.message);
            }
        });
    };

    return (
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-4">
            <div className="flex items-start gap-4">
                {product.image ? (
                    <img src={product.image} className="w-16 h-16 rounded-lg object-cover bg-muted" />
                ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="w-8 h-8 opacity-20" />
                    </div>
                )}
                <div>
                    <h3 className="font-bold line-clamp-1">{product.title}</h3>
                    <p className="text-xs text-muted-foreground">{product.price} Süt</p>
                </div>
            </div>

            <div className="mt-auto flex items-center gap-2">
                <div className="flex-1 flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Stok Adedi</label>
                    <input
                        type="number"
                        min="0"
                        value={stock}
                        onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                        className="bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono w-full focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>
                <button
                    onClick={handleUpdate}
                    disabled={isPending || stock === product.stock}
                    className="h-[38px] px-3 mt-auto bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Save className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function RedemptionTab({ transactions }: { transactions: (StoreTransaction & { user: User; product: StoreProduct })[] }) {
    const [code, setCode] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleRedeem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;

        startTransition(async () => {
            const res = await redeemProduct(code.toUpperCase());
            if (res.success) {
                toast.success(`Başarılı! ${res.product} teslim edildi.`);
                setCode('');
            } else {
                toast.error(res.message);
            }
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Redemption Form */}
            <div className="lg:col-span-1">
                <div className="bg-card border border-border rounded-2xl p-6 sticky top-8">
                    <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                        <QrCode className="w-6 h-6 text-primary" />
                        Kupon Kullan
                    </h2>

                    <form onSubmit={handleRedeem} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Kupon Kodu</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="RD-XXXXXXXX"
                                className="w-full bg-background border-2 border-dashed border-border p-4 text-center font-mono text-xl font-bold rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none uppercase placeholder:opacity-30"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!code || isPending}
                            className="w-full py-4 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
                        >
                            {isPending ? 'Kontrol Ediliyor...' : 'KULLAN'}
                        </button>
                    </form>
                </div>
            </div>

            {/* History List */}
            <div className="lg:col-span-2 space-y-6">
                <h3 className="text-lg font-bold text-muted-foreground">Son İşlemler</h3>
                <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
                    {transactions.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">Henüz işlem yok.</div>
                    ) : (
                        transactions.map(tx => (
                            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center",
                                        tx.isRedeemed ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"
                                    )}>
                                        {tx.isRedeemed ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="font-bold">{tx.product.title}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                                            <span>{tx.user.firstName || tx.userId}</span>
                                            <span>•</span>
                                            <span className="font-mono">{tx.redemptionCode}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium">
                                        {tx.isRedeemed ? 'Kullanıldı' : 'Bekliyor'}
                                    </div>
                                    <div className="text-xs text-muted-foreground opacity-50">
                                        {new Date(tx.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
