'use client';

import { Product } from "@prisma/client";
import { useState } from "react";
import { ShoppingBag, Star, AlertCircle } from "lucide-react";

interface StoreClientProps {
    products: Product[];
    userCredits: number;
}

export default function StoreClient({ products, userCredits }: StoreClientProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleBuy = async (product: Product) => {
        if (userCredits < product.price) {
            alert("Yetersiz Süt Bakiyesi!");
            return;
        }

        if (!confirm(`${product.name} ürününü ${product.price} Süt karşılığında almak istiyor musunuz?`)) return;

        setLoadingId(product.id);
        try {
            const { buyProduct } = await import("@/app/actions/storeActions");
            const res = await buyProduct(product.id);
            if (res.success) {
                alert("Satın alma başarılı! 🎉");
            } else {
                alert(res.message || "Hata oluştu");
            }
        } catch (error) {
            console.error(error);
            alert("Bir hata oluştu");
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#01353D] text-white p-4 md:p-12 pb-24 md:pb-12">
            <div className="max-w-6xl mx-auto">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Süt Mağazası</h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        Biriktirdiğin sütleri harika ödüllere dönüştür. Sponsorlarımızdan hediyeler, indirim çekleri ve daha fazlası.
                    </p>
                    <div className="mt-6 inline-flex items-center gap-2 bg-[#002A30] border border-[#22d3ee] px-6 py-3 rounded-full">
                        <span className="text-gray-400">Bakiyen:</span>
                        <span className="text-2xl font-bold text-[#22d3ee]">{userCredits} Süt</span>
                        <span className="text-xl">🥛</span>
                    </div>
                </div>

                {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-[#002A30] rounded-3xl border border-[#003E44]">
                        <ShoppingBag className="w-16 h-16 text-gray-600 mb-4" />
                        <h3 className="text-xl font-bold text-white">Henüz Ürün Yok</h3>
                        <p className="text-gray-400 mt-2">Mağazamız çok yakında açılacak!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map(product => (
                            <div key={product.id} className="bg-[#002A30] border border-[#003E44] rounded-3xl overflow-hidden hover:border-[#22d3ee]/50 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(34,211,238,0.1)] flex flex-col">
                                <div className="aspect-video bg-gray-800 relative overflow-hidden">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[#003E44] text-[#22d3ee]">
                                            <ShoppingBag className="w-12 h-12 opacity-50" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#22d3ee] border border-[#22d3ee]/30">
                                        {product.stock !== null ? (product.stock > 0 ? `${product.stock} Adet` : 'Tükendi') : 'Sınırsız'}
                                    </div>
                                </div>

                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                                    <p className="text-gray-400 text-sm mb-6 line-clamp-2">{product.description}</p>

                                    <div className="mt-auto flex items-center justify-between gap-4">
                                        <div className="text-2xl font-black text-[#22d3ee]">
                                            {product.price} <span className="text-base font-normal text-gray-400">Süt</span>
                                        </div>
                                        <button
                                            onClick={() => handleBuy(product)}
                                            disabled={loadingId === product.id || (product.stock !== null && product.stock <= 0) || userCredits < product.price}
                                            className={`px-6 py-3 rounded-xl font-bold transition-all active:scale-95 ${loadingId === product.id ? 'bg-gray-700 cursor-wait' :
                                                    (product.stock !== null && product.stock <= 0) ? 'bg-gray-800 text-gray-500 cursor-not-allowed' :
                                                        userCredits < product.price ? 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20' :
                                                            'bg-[#22d3ee] text-[#002A30] hover:bg-[#0ea5e9] shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                                                }`}
                                        >
                                            {loadingId === product.id ? 'İşleniyor...' :
                                                (product.stock !== null && product.stock <= 0) ? 'Tükendi' :
                                                    userCredits < product.price ? 'Yetersiz Süt' : 'Satın Al'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
