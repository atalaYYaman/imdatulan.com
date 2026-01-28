'use client';

import { useState } from 'react';
import { Store, User } from '@prisma/client';
import { Plus, Users, Mail, Store as StoreIcon, CalendarClock, BadgeCheck, Loader2 } from 'lucide-react';
import { createPartnerUser } from '@/app/actions/adminActions';
import { toast } from 'sonner';

type PartnerWithStore = User & {
    store: Store | null;
};

interface PartnerManagementClientProps {
    partners: PartnerWithStore[];
    stores: Store[];
}

export default function PartnerManagementClient({ partners: initialPartners, stores }: PartnerManagementClientProps) {
    const [partners, setPartners] = useState<PartnerWithStore[]>(initialPartners);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [storeId, setStoreId] = useState<string>('');

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setStoreId('');
    };

    const handleCloseModal = () => {
        if (isSubmitting) return;
        setIsModalOpen(false);
        resetForm();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await createPartnerUser({
                name,
                email,
                password,
                storeId: storeId || undefined,
            });

            if (!response || !response.success) {
                toast.error(response?.message || 'Partner oluşturulurken bir hata oluştu.');
                return;
            }

            const created = response.data as PartnerWithStore;
            setPartners((prev) => [created, ...prev]);

            toast.success(`Partner hesabı oluşturuldu. Giriş bilgileri: ${email} / ${password}`);

            handleCloseModal();
        } catch (error) {
            console.error(error);
            toast.error('Partner oluşturulurken bir hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasPartners = partners.length > 0;

    return (
        <div className="space-y-8">
            {/* Üst Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Partner Yönetimi</h1>
                        <p className="text-muted-foreground text-sm">
                            İş birlikçi mağaza hesaplarını görüntüleyin ve yönetin.
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleOpenModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Partner Ekle
                </button>
            </div>

            {/* Tablo */}
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-3xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-muted/60 border-b border-border/60">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Partner
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Bağlı Olduğu Mağaza
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Oluşturulma Tarihi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Durum
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {hasPartners ? (
                                partners.map((partner) => {
                                    const fullName =
                                        `${partner.firstName || ''} ${partner.lastName || ''}`.trim() ||
                                        partner.email.split('@')[0];
                                    const initials = fullName
                                        .split(' ')
                                        .filter(Boolean)
                                        .slice(0, 2)
                                        .map((n) => n[0])
                                        .join('')
                                        .toUpperCase();

                                    const createdAt =
                                        partner.createdAt instanceof Date
                                            ? partner.createdAt
                                            : new Date(partner.createdAt as any);

                                    const hasStore = !!partner.store;

                                    return (
                                        <tr
                                            key={partner.id}
                                            className="border-b border-border/40 hover:bg-muted/40 transition-colors"
                                        >
                                            {/* Avatar + İsim */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-border flex items-center justify-center text-xs font-bold text-violet-200">
                                                        {initials}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-foreground">{fullName}</span>
                                                        <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
                                                            PARTNER
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Email */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-foreground/90">
                                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm truncate max-w-[220px]">
                                                        {partner.email}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Store Badge */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {hasStore ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        <StoreIcon className="w-3 h-3" />
                                                        {partner.store?.name}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground/80 border border-border/60">
                                                        Atanmamış
                                                    </span>
                                                )}
                                            </td>

                                            {/* Created At */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                                    <CalendarClock className="w-3 h-3" />
                                                    <span>
                                                        {createdAt.toLocaleDateString('tr-TR', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    <BadgeCheck className="w-3 h-3" />
                                                    Aktif
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-10 text-center text-muted-foreground text-sm"
                                    >
                                        Henüz tanımlanmış bir partner hesabı bulunmuyor.
                                        <br />
                                        <button
                                            onClick={handleOpenModal}
                                            className="mt-3 text-primary font-semibold hover:underline"
                                        >
                                            İlk partner hesabını oluştur
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Yeni Partner Ekle Modalı */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    Yeni Partner Ekle
                                </h2>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Partner hesabı oluşturduktan sonra giriş bilgilerini paylaşmayı unutmayın.
                                </p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="text-muted-foreground hover:text-foreground rounded-full p-2 hover:bg-muted transition-colors"
                                disabled={isSubmitting}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">
                                    Ad Soyad
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Örn: Kampüs Büfe - Ahmet Yılmaz"
                                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    required
                                />
                            }
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="partner@ornek.com"
                                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">
                                    Geçici Şifre
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="En az 6 karakter"
                                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">
                                    Mağaza Ata (Opsiyonel)
                                </label>
                                <select
                                    value={storeId}
                                    onChange={(e) => setStoreId(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                >
                                    <option value="">Mağaza seçiniz (isteğe bağlı)</option>
                                    {stores.map((store) => (
                                        <option key={store.id} value={store.id}>
                                            {store.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/60 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !name || !email || !password}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-md shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Oluşturuluyor...
                                        </>
                                    ) : (
                                        <>Partner Oluştur</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

