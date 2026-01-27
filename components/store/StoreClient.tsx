'use client';

import { StoreProduct } from "@prisma/client";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import ProductCard from "./ProductCard";
import StoreFilters from "./StoreFilters";

interface StoreClientProps {
    products: StoreProduct[];
    userCredits: number;
}

export default function StoreClient({ products, userCredits }: StoreClientProps) {
    const [activeFilter, setActiveFilter] = useState('ALL');

    const filteredProducts = products.filter(product => {
        if (activeFilter === 'ALL') return true;
        return product.type === activeFilter;
    });

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground">Süt Mağazası</h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Biriktirdiğin sütlerle harika ödüller kap!
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-card px-5 py-3 rounded-2xl border border-border shadow-sm">
                    <span className="text-muted-foreground font-medium text-sm">Bakiye:</span>
                    <span className="text-2xl font-black text-primary">{userCredits}</span>
                    <span className="text-xl">🥛</span>
                </div>
            </div>

            {/* Filters */}
            <StoreFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />

            {/* Products Grid - Masonry-ish with columns */}
            {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-muted/20 rounded-3xl border border-dashed border-border text-center">
                    <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-bold text-foreground">Ürün Bulunamadı</h3>
                    <p className="text-muted-foreground mt-2 max-w-xs">
                        Bu kategoride henüz ürünümüz yok. Başka bir kategori dene veya daha sonra tekrar gel.
                    </p>
                </div>
            ) : (
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                    {filteredProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            userCredits={userCredits}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
