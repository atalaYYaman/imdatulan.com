'use client';

import { useState } from 'react';
import { Store } from '@prisma/client';
import { Plus, Search, ExternalLink, Trash2, Store as StoreIcon } from 'lucide-react';
import Link from 'next/link';
import { createStore } from '@/app/actions/storeActions';
import { toast } from 'sonner';

interface AdminStoreListProps {
    stores: (Store & {
        products?: any[]; // Allow arrays
        transactions?: any[]; // Allow arrays
        _count?: { products: number; transactions: number }; // Allow old format too
    })[];
}

export default function AdminStoreListClient({ stores }: AdminStoreListProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        // ... (Keep existing handler logic same, just updating interface)
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData();
        formData.append('name', name);

        try {
            const res = await createStore(formData);
            if (res.success) {
                toast.success(res.message);
                setIsCreating(false);
                setName('');
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error('Bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Actions Bar ... (Keep existing) */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Mağaza ara..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-card/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Mağaza
                </button>
            </div>

            {/* Create Dialog (Simple Inline) */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border border-border w-full max-w-md p-6 rounded-3xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                            <StoreIcon className="w-5 h-5 text-primary" />
                            Yeni Mağaza Oluştur
                        </h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-muted-foreground ml-1 mb-1 block">Mağaza Adı</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Örn: Kampüs Kırtasiye"
                                    className="w-full p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 py-3 font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={!name.trim() || isLoading}
                                    className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? 'Oluşturuluyor...' : 'Oluştur'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stores Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {stores.map(store => {
                    // Safe access to counts
                    const productCount = store._count?.products ?? store.products?.length ?? 0;
                    const transactionCount = store._count?.transactions ?? store.transactions?.length ?? 0;

                    return (
                        <div key={store.id} className="group bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border">
                                        {store.logo ? (
                                            <img src={store.logo} className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            <StoreIcon className="w-6 h-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight">{store.name}</h3>
                                        <p className="text-xs text-muted-foreground font-mono opacity-70">ID: {store.id.substring(0, 8)}...</p>
                                    </div>
                                </div>
                                <Link
                                    href={`/admin/stores/${store.id}`}
                                    className="p-2 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="bg-muted/30 p-2 rounded-lg text-center">
                                    <div className="text-xl font-black text-foreground">{productCount}</div>
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Ürün</div>
                                </div>
                                <div className="bg-muted/30 p-2 rounded-lg text-center">
                                    <div className="text-xl font-black text-foreground">{transactionCount}</div>
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Satış</div>
                                </div>
                            </div>

                            <Link
                                href={`/admin/stores/${store.id}`}
                                className="flex items-center justify-center w-full py-2.5 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all text-sm group-hover:translate-y-0.5"
                            >
                                Yönet
                            </Link>
                        </div>
                    );
                })}

                {stores.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed border-border rounded-3xl">
                        <StoreIcon className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-medium">Henüz hiç mağaza yok.</p>
                        <button onClick={() => setIsCreating(true)} className="text-primary font-bold hover:underline mt-2">
                            İlk mağazayı oluştur
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
