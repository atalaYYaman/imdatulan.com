'use client';

import { cn } from "@/lib/utils";

interface StoreFiltersProps {
    activeFilter: string;
    onFilterChange: (filter: string) => void;
}

const FILTERS = [
    { id: 'ALL', label: 'Tümü' },
    { id: 'PHYSICAL_ITEM', label: 'Eşyalar' },
    { id: 'COUPON', label: 'Kuponlar' },
    { id: 'SERVICE', label: 'Hizmetler' },
];

export default function StoreFilters({ activeFilter, onFilterChange }: StoreFiltersProps) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
            {FILTERS.map((filter) => (
                <button
                    key={filter.id}
                    onClick={() => onFilterChange(filter.id)}
                    className={cn(
                        "px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                        activeFilter === filter.id
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    {filter.label}
                </button>
            ))}
        </div>
    );
}
