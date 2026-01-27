'use client';

import { StoreProduct, StoreTransaction, Store } from "@prisma/client";
import { Copy, CheckCircle2, Ticket } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TicketCardProps {
    transaction: StoreTransaction & {
        product: StoreProduct;
        store: Store;
    };
}

export default function TicketCard({ transaction }: TicketCardProps) {
    const isRedeemed = transaction.isRedeemed;

    const handleCopy = () => {
        navigator.clipboard.writeText(transaction.redemptionCode);
        toast.success("Kod kopyalandı!");
    };

    return (
        <div className="relative group filter drop-shadow-md hover:drop-shadow-xl transition-all duration-300">
            {/* Ticket Shape */}
            <div className={cn(
                "relative flex bg-card rounded-2xl overflow-hidden min-h-[140px]",
                isRedeemed ? "opacity-60 grayscale" : ""
            )}>

                {/* Left Part (Product/Store Info) */}
                <div className="flex-[2] p-5 border-r-2 border-dashed border-border flex flex-col justify-center relative bg-gradient-to-br from-card to-muted/20">
                    {/* Perforation Circles Top/Bottom */}
                    <div className="absolute -top-3 -right-3 w-6 h-6 bg-background rounded-full z-10" />
                    <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-background rounded-full z-10" />

                    <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{transaction.store.name}</span>
                        {isRedeemed && (
                            <span className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">
                                KULLANILDI
                            </span>
                        )}
                    </div>

                    <h3 className="text-xl font-black text-foreground mb-1 leading-tight group-hover:text-primary transition-colors">
                        {transaction.product.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {transaction.product.description}
                    </p>
                </div>

                {/* Right Part (Code) */}
                <div className="flex-1 min-w-[140px] bg-muted/30 p-4 flex flex-col items-center justify-center gap-2 relative">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase text-center w-full">
                        Kupon Kodu
                    </div>

                    <div
                        onClick={handleCopy}
                        className={cn(
                            "w-full py-2 bg-background border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/5 hover:border-primary transition-all active:scale-95 group/code",
                            isRedeemed ? "border-muted cursor-default" : ""
                        )}
                    >
                        <span className="font-mono font-bold text-lg tracking-widest text-primary group-hover/code:scale-105 transition-transform">
                            {transaction.redemptionCode}
                        </span>
                        {!isRedeemed && <Copy className="w-3 h-3 text-muted-foreground opacity-50" />}
                    </div>

                    <div className="text-[9px] text-muted-foreground text-center opacity-70">
                        {new Date(transaction.createdAt).toLocaleDateString('tr-TR')}
                    </div>
                </div>
            </div>
        </div>
    );
}
