'use client';

import { useEffect, useState } from 'react';
import { getPurchaseLogsAdmin } from '@/app/actions/adminActions';
import { Loader2, Search } from 'lucide-react';

type PurchaseLogItem = {
    id: string;
    purchasedAt: Date;
    noteId: string | null;
    noteTitle: string;
    creditAmount: number;
    buyer: {
        id: string;
        email: string;
        name: string;
        balanceAfter: number;
    };
    seller: {
        id: string | null;
        email: string | null;
        name: string;
        balanceAfter: number | null;
    };
};

const DEFAULT_PAGE_SIZE = 20;

export default function PurchaseLogListClient() {
    const [items, setItems] = useState<PurchaseLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [minCredit, setMinCredit] = useState('');
    const [maxCredit, setMaxCredit] = useState('');
    const [page, setPage] = useState(1);

    const [meta, setMeta] = useState({
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        total: 0,
        totalPages: 1,
    });

    const loadLogs = async (nextPage: number) => {
        setLoading(true);
        setError(null);

        const minCreditNum = minCredit.trim() === '' ? undefined : Number(minCredit);
        const maxCreditNum = maxCredit.trim() === '' ? undefined : Number(maxCredit);

        const res = await getPurchaseLogsAdmin({
            page: nextPage,
            pageSize: DEFAULT_PAGE_SIZE,
            search: search.trim() || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            minCredit: Number.isNaN(minCreditNum) ? undefined : minCreditNum,
            maxCredit: Number.isNaN(maxCreditNum) ? undefined : maxCreditNum,
        });

        if (!res.success || !res.data) {
            setItems([]);
            setError(res.message || 'Satın alma logları yüklenemedi.');
            setLoading(false);
            return;
        }

        setItems(res.data.items as PurchaseLogItem[]);
        setMeta(res.data.pagination);
        setPage(res.data.pagination.page);
        setLoading(false);
    };

    useEffect(() => {
        loadLogs(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onFilterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await loadLogs(1);
    };

    const clearFilters = async () => {
        setSearch('');
        setStartDate('');
        setEndDate('');
        setMinCredit('');
        setMaxCredit('');
        await loadLogs(1);
    };

    return (
        <div className="space-y-6">
            <form onSubmit={onFilterSubmit} className="bg-card border border-border rounded-2xl p-4 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Not adı, alıcı veya satıcı ara..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    />
                    <input
                        type="number"
                        min={0}
                        value={minCredit}
                        onChange={(e) => setMinCredit(e.target.value)}
                        placeholder="Min kredi"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    />
                    <input
                        type="number"
                        min={0}
                        value={maxCredit}
                        onChange={(e) => setMaxCredit(e.target.value)}
                        placeholder="Max kredi"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold"
                    >
                        Filtrele
                    </button>
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="px-4 py-2 rounded-xl border border-border font-semibold"
                    >
                        Temizle
                    </button>
                </div>
            </form>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-10 flex items-center justify-center text-muted-foreground gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Yükleniyor...
                    </div>
                ) : error ? (
                    <div className="p-6 text-red-500">{error}</div>
                ) : items.length === 0 ? (
                    <div className="p-6 text-muted-foreground">Filtreye uygun kayıt bulunamadı.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted/40">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold">Tarih</th>
                                    <th className="text-left px-4 py-3 font-semibold">Not</th>
                                    <th className="text-left px-4 py-3 font-semibold">Alıcı</th>
                                    <th className="text-left px-4 py-3 font-semibold">Satıcı</th>
                                    <th className="text-left px-4 py-3 font-semibold">Kredi</th>
                                    <th className="text-left px-4 py-3 font-semibold">Alıcı Son Bakiye</th>
                                    <th className="text-left px-4 py-3 font-semibold">Satıcı Son Bakiye</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id} className="border-t border-border">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {new Date(item.purchasedAt).toLocaleString('tr-TR')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{item.noteTitle}</div>
                                            <div className="text-xs text-muted-foreground">{item.noteId ?? '-'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>{item.buyer.name}</div>
                                            <div className="text-xs text-muted-foreground">{item.buyer.email}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>{item.seller.name}</div>
                                            <div className="text-xs text-muted-foreground">{item.seller.email ?? '-'}</div>
                                        </td>
                                        <td className="px-4 py-3 font-semibold">{item.creditAmount}</td>
                                        <td className="px-4 py-3">{item.buyer.balanceAfter}</td>
                                        <td className="px-4 py-3">{item.seller.balanceAfter ?? '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Toplam {meta.total} kayıt
                </p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={loading || page <= 1}
                        onClick={() => loadLogs(page - 1)}
                        className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40"
                    >
                        Önceki
                    </button>
                    <span className="text-sm">
                        {meta.page} / {meta.totalPages}
                    </span>
                    <button
                        type="button"
                        disabled={loading || page >= meta.totalPages}
                        onClick={() => loadLogs(page + 1)}
                        className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40"
                    >
                        Sonraki
                    </button>
                </div>
            </div>
        </div>
    );
}
