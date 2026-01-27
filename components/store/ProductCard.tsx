'use client';

import { StoreProduct } from "@prisma/client";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useOptimistic, useTransition, useState } from "react";
import { buyStoreProduct } from "@/app/actions/storeActions";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ProductCardProps {
    product: StoreProduct;
    userCredits: number;
}

export default function ProductCard({ product, userCredits }: ProductCardProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleBuy = async () => {
        if (userCredits < product.price) {
            toast.error("Yetersiz Süt Bakiyesi!", {
                description: "Daha fazla süt kazanmak için not yükle veya arkadaşını davet et."
            });
            return;
        }

        if (!confirm(`${product.title} ürününü ${product.price} Süt karşılığında almak istiyor musunuz?`)) return;

        startTransition(async () => {
            try {
                const res = await buyStoreProduct(product.id);
                if (res.success) {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#10b981', '#ffffff'] // Emerald & White
                    });
                    toast.success("Satın alma başarılı! 🎉", {
                        description: "Kupon kodun cüzdanına eklendi."
                    });
                    // Redirect to wallet or just refresh
                    router.refresh();
                } else {
                    toast.error("Hata", { description: res.message });
                }
            } catch (error) {
                toast.error("Hata", { description: "Bir şeyler ters gitti." });
            }
        });
    };

    const isOutOfStock = product.stock !== null && product.stock <= 0;
    const canAfford = userCredits >= product.price;

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col hover:shadow-lg hover:border-primary/30 transition-all duration-300 group break-inside-avoid mb-4">
            {/* Image Area */}
            <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ShoppingBag className="w-10 h-10 opacity-20" />
                    </div>
                )}

                {/* Stock Badge */}
                <div className={cn(
                    "absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold border backdrop-blur-md",
                    isOutOfStock
                        ? "bg-red-500/20 text-red-500 border-red-500/30"
                        : "bg-emerald-500/80 text-white border-emerald-400/50"
                )}>
                    {isOutOfStock ? "Tükendi" : (product.stock ? `${product.stock} Adet` : "Sınırsız")}
                </div>

                {/* Type Badge */}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-white backdrop-blur-sm uppercase tracking-wide">
                    {product.type === 'PHYSICAL_ITEM' ? 'Eşya' : product.type === 'COUPON' ? 'Kupon' : 'Hizmet'}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col gap-3">
                <div>
                    <h3 className="font-bold text-lg leading-tight line-clamp-1">{product.title}</h3>
                    <p className="text-muted-foreground text-xs mt-1 line-clamp-2 min-h-[2.5em]">{product.description}</p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-primary">{product.price}</span>
                        <span className="text-xs text-muted-foreground font-medium">Süt</span>
                    </div>

                    <button
                        onClick={handleBuy}
                        disabled={isPending || isOutOfStock || !canAfford}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95",
                            isPending ? "bg-muted text-muted-foreground cursor-wait" :
                                isOutOfStock ? "bg-muted/50 text-muted-foreground cursor-not-allowed" :
                                    !canAfford ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" :
                                        "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                        )}
                    >
                        {isPending ? "..." :
                            isOutOfStock ? "❌" :
                                !canAfford ? "Yetersiz" : "Satın Al"}
                    </button>
                </div>
            </div>
        </div>
    );
}
