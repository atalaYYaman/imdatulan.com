'use client';

import { useState } from 'react';
import { Store, StoreProduct } from '@prisma/client';
import {
    ShoppingBag,
    ArrowLeft,
    Package,
    Users,
    Plus,
    Save,
    Trash2,
    Ticket,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { addProduct, assignPartner } from '@/app/actions/storeActions';
import { cn } from '@/lib/utils';

interface AdminStoreDetailProps {
    store: Store & {
        products: StoreProduct[];
    };
    partners: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        // image: string | null; // Removed
    }[];
}

export default function AdminStoreDetailClient({ store, partners }: AdminStoreDetailProps) {
    const [activeTab, setActiveTab] = useState<'products' | 'partners'>('products');

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <Link href="/admin/stores" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Mağazalara Dön
                </Link>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center overflow-hidden">
                            {store.logo ? (
                                <img src={store.logo} className="w-full h-full object-cover" />
                            ) : (
                                <ShoppingBag className="w-8 h-8 text-muted-foreground opacity-50" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">{store.name}</h1>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                                <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs select-all">
                                    {store.id}
                                </span>
                                <span>•</span>
                                <span>{store.products.length} Ürün</span>
                                <span>•</span>
                                <span>{partners.length} Partner</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-border">
                <button
                    onClick={() => setActiveTab('products')}
                    className={cn(
                        "px-6 py-3 text-sm font-bold border-b-2 transition-colors",
                        activeTab === 'products' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    Ürünler
                </button>
                <button
                    onClick={() => setActiveTab('partners')}
                    className={cn(
                        "px-6 py-3 text-sm font-bold border-b-2 transition-colors",
                        activeTab === 'partners' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    Partnerler
                </button>
            </div>

            {/* Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'products' ? (
                    <ProductsTab storeId={store.id} products={store.products} />
                ) : (
                    <PartnersTab storeId={store.id} partners={partners} />
                )}
            </div>
        </div>
    );
}

// --- PRODUCTS TAB ---

function ProductsTab({ storeId, products }: { storeId: string; products: StoreProduct[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // New Product State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        stock: '',
        image: '',
        type: 'PHYSICAL_ITEM'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const data = {
            ...formData,
            price: Number(formData.price),
            stock: formData.stock ? Number(formData.stock) : 0,
            storeId
        };

        try {
            const res = await addProduct(data);
            if (res.success) {
                toast.success(res.message);
                setIsAdding(false);
                setFormData({ title: '', description: '', price: '', stock: '', image: '', type: 'PHYSICAL_ITEM' });
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Hata oluştu.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
                >
                    {isAdding ? 'İptal' : 'Yeni Ürün Ekle'}
                    {!isAdding && <Plus className="w-4 h-4" />}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="bg-card border border-border p-6 rounded-2xl space-y-4 animate-in fade-in zoom-in-95">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Ürün Adı</label>
                            <input
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Fiyat (Süt)</label>
                            <input
                                required
                                type="number"
                                min="0"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="col-span-full space-y-1">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Açıklama</label>
                            <textarea
                                required
                                rows={2}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Stok</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.stock}
                                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Tür</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="PHYSICAL_ITEM">Fiziksel Ürün</option>
                                <option value="COUPON">Kupon</option>
                                <option value="SERVICE">Hizmet</option>
                            </select>
                        </div>
                        <div className="col-span-full space-y-1">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Görsel URL</label>
                            <input
                                value={formData.image}
                                onChange={e => setFormData({ ...formData, image: e.target.value })}
                                placeholder="https://..."
                                className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
                    >
                        {isLoading ? 'Ekleniyor...' : 'Kaydet'}
                    </button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                    <div key={product.id} className="bg-card border border-border rounded-2xl p-4 flex gap-4 group hover:border-primary/50 transition-colors">
                        <div className="w-20 h-20 bg-muted rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {product.image ? (
                                <img src={product.image} className="w-full h-full object-cover" />
                            ) : (
                                <Package className="w-8 h-8 text-muted-foreground opacity-30" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <h3 className="font-bold truncate" title={product.title}>{product.title}</h3>
                                <span className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                    product.stock && product.stock > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                )}>
                                    {product.stock && product.stock > 0 ? `${product.stock} Stok` : 'Stok Yok'}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{product.description}</p>
                            <div className="mt-2 flex items-center justify-between">
                                <span className="font-bold text-primary">{product.price} 🥛</span>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    {product.type === 'PHYSICAL_ITEM' ? 'Eşya' : product.type === 'COUPON' ? 'Kupon' : 'Hizmet'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                {products.length === 0 && !isAdding && (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">
                        Bu mağazada henüz ürün yok.
                    </div>
                )}
            </div>
        </div>
    );
}

// --- PARTNERS TAB ---

function PartnersTab({ storeId, partners }: { storeId: string; partners: any[] }) {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await assignPartner({ email, storeId });
            if (res.success) {
                toast.success(res.message);
                setEmail('');
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Hata oluştu.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
                <div className="bg-card border border-border p-6 rounded-2xl">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Partner Ata
                    </h3>
                    <form onSubmit={handleAssign} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Kullanıcı E-posta</label>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="ornek@ogrenci.edu.tr"
                                className="w-full bg-background border border-border rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!email || isLoading}
                            className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Atanıyor...' : 'Partner Yap'}
                        </button>
                    </form>
                    <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                        Partner olarak atanan kullanıcı, bu mağazanın envanterini yönetebilir ve kupon kodlarını doğrulayabilir.
                    </p>
                </div>
            </div>

            <div className="md:col-span-2 space-y-4">
                <h3 className="font-bold text-lg text-muted-foreground">Mevcut Partnerler</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {partners.map(partner => (
                        <div key={partner.id} className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center font-bold text-foreground text-lg">
                                {(partner.firstName?.[0] || '?').toUpperCase()}
                            </div>
                            <div>
                                <div className="font-bold">{partner.firstName} {partner.lastName}</div>
                                <div className="text-sm text-muted-foreground">{partner.email}</div>
                                <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Aktif Partner
                                </div>
                            </div>
                        </div>
                    ))}
                    {partners.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">
                            Henüz partner atanmamış.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
