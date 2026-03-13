'use client';

import { useState } from "react";
import { Search, Filter, Layers, LayoutGrid, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { universities, years } from "@/lib/universityData";
import { NoteCard } from "@/components/ui/NoteCard";
import { useSession } from "next-auth/react";
import Link from 'next/link';
import { Lock } from "lucide-react";

interface Note {
    id: string;
    title: string;
    description: string | null;
    courseName: string | null;
    university: string;
    faculty: string;
    department: string;
    term: string | null;
    type: string | null;
    fileUrl: string;
    createdAt: Date;
    price: number;
    uploader: {
        id: string;
        department?: string | null;
        anonymousName: string;
    };
}

export default function NotesClient({ initialNotes }: { initialNotes: any[] }) {
    const { data: session } = useSession();
    const [searchQuery, setSearchQuery] = useState("");
    const [isFiltersOpen, setIsFiltersOpen] = useState(true); // Default open on desktop, controlled by effect or media query ideally, but state is fine

    // Auto-collapse filters on mobile initially? We can use CSS hidden/block logic or just let user toggle.
    // Let's stick to user toggle for simplicity.

    const [filters, setFilters] = useState({
        university: "",
        faculty: "",
        department: "",
        year: "",
    });

    const selectedUni = universities.find(u => u.name === filters.university);
    const faculties = selectedUni ? selectedUni.faculties : [];

    const selectedFaculty = faculties.find(f => f.name === filters.faculty);
    const departments = selectedFaculty ? selectedFaculty.departments : [];

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'university' ? { faculty: '', department: '' } : {}),
            ...(name === 'faculty' ? { department: '' } : {}),
        }));
    };

    const filteredNotes = initialNotes.filter(note => {
        const titleMatch = (note.title || "").toLowerCase().includes(searchQuery.toLowerCase());
        const courseMatch = (note.courseName || "").toLowerCase().includes(searchQuery.toLowerCase());
        const topicMatch = (note.description || "").toLowerCase().includes(searchQuery.toLowerCase());

        const matchesSearch = titleMatch || courseMatch || topicMatch;
        const matchesUni = filters.university ? note.university === filters.university : true;
        const matchesFaculty = filters.faculty ? note.faculty === filters.faculty : true;
        const matchesDept = filters.department ? note.department === filters.department : true;
        const matchesYear = filters.year ? note.term?.includes(filters.year) : true;

        return matchesSearch && matchesUni && matchesFaculty && matchesDept && matchesYear;
    });

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6 text-foreground bg-background">
                <div className="bg-card p-8 rounded-3xl border border-border shadow-2xl max-w-lg w-full relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors" />
                    <div className="relative z-10">
                        <div className="h-20 w-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-primary/5">
                            <Lock className="h-10 w-10" />
                        </div>
                        <h1 className="text-2xl font-bold mb-4 text-foreground">Notlara Erişmek İçin Giriş Yap</h1>
                        <p className="text-muted-foreground mb-8 text-sm">
                            Binlerce ders notuna, çıkmış sorulara ve ödev kaynaklarına erişmek için hemen topluluğumuza katıl.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/auth/signin" className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
                                Giriş Yap
                            </Link>
                            <Link href="/auth/signup" className="px-8 py-3 border border-border text-foreground font-bold rounded-xl hover:bg-accent transition-all hover:scale-105 active:scale-95">
                                Kayıt Ol
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const hasActiveFilters = Boolean(filters.university || filters.faculty || filters.department || filters.year || searchQuery.trim());
    const clearFilters = () => {
        setFilters({ university: '', faculty: '', department: '', year: '' });
        setSearchQuery('');
        setIsFiltersOpen(true);
    };

    return (
        <div className="flex flex-col min-h-screen bg-background p-4 md:p-6 lg:p-8 text-foreground pb-24 md:pb-8 max-w-7xl mx-auto">
            {/* Başlık ve arama */}
            <header className="mb-6 md:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                        Notlar
                    </h1>
                    <span className="text-sm font-medium text-muted-foreground bg-muted/80 px-3 py-1.5 rounded-lg border border-border inline-flex items-center w-fit">
                        <span className="font-semibold text-foreground">{filteredNotes.length}</span>
                        <span className="ml-1">not</span>
                    </span>
                </div>

                <label className="sr-only" htmlFor="notes-search">Notlarda ara</label>
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" aria-hidden />
                    <input
                        id="notes-search"
                        type="search"
                        placeholder="Ders adı, konu veya açıklama ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl py-3 pl-12 pr-4 text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none shadow-sm transition-all placeholder:text-muted-foreground/70 relative z-10"
                        autoComplete="off"
                    />
                </div>
            </header>

            {/* Filtreler bölümü */}
            <section className="mb-6 md:mb-8" aria-label="Filtreler">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <button
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        className="md:hidden flex items-center justify-between w-full p-4 bg-card border border-border rounded-xl text-sm font-medium text-foreground shadow-sm active:scale-[0.99] transition-transform"
                    >
                        <span className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-primary" aria-hidden />
                            Filtreler
                            {hasActiveFilters && (
                                <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                                    Aktif
                                </span>
                            )}
                        </span>
                        {isFiltersOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    <div className="hidden md:flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Filtreler</span>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
                            >
                                Filtreleri temizle
                            </button>
                        )}
                    </div>
                </div>

                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 transition-all duration-300 ease-in-out ${isFiltersOpen ? 'opacity-100 max-h-[600px]' : 'opacity-0 max-h-0 overflow-hidden md:opacity-100 md:max-h-none'}`}>
                    {/* Üniversite */}
                    <div className="space-y-1.5">
                        <label htmlFor="filter-university" className="block text-xs font-medium text-muted-foreground">
                            Üniversite
                        </label>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden />
                            <select
                                id="filter-university"
                                name="university"
                                value={filters.university}
                                onChange={handleFilterChange}
                                className="w-full bg-card border border-border rounded-xl py-2.5 pl-9 pr-8 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer hover:bg-accent/50 transition-colors shadow-sm outline-none"
                                aria-label="Üniversite seçin"
                            >
                                <option value="">Tümü</option>
                                {universities.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden />
                        </div>
                    </div>

                    {/* Fakülte */}
                    <div className="space-y-1.5">
                        <label htmlFor="filter-faculty" className="block text-xs font-medium text-muted-foreground">
                            Fakülte
                        </label>
                        <div className="relative">
                            <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden />
                            <select
                                id="filter-faculty"
                                name="faculty"
                                value={filters.faculty}
                                onChange={handleFilterChange}
                                disabled={!filters.university}
                                className="w-full bg-card border border-border rounded-xl py-2.5 pl-9 pr-8 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm outline-none"
                                aria-label="Fakülte seçin"
                            >
                                <option value="">Tümü</option>
                                {faculties.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden />
                        </div>
                    </div>

                    {/* Bölüm */}
                    <div className="space-y-1.5">
                        <label htmlFor="filter-department" className="block text-xs font-medium text-muted-foreground">
                            Bölüm
                        </label>
                        <div className="relative">
                            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden />
                            <select
                                id="filter-department"
                                name="department"
                                value={filters.department}
                                onChange={handleFilterChange}
                                disabled={!filters.faculty}
                                className="w-full bg-card border border-border rounded-xl py-2.5 pl-9 pr-8 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm outline-none"
                                aria-label="Bölüm seçin"
                            >
                                <option value="">Tümü</option>
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden />
                        </div>
                    </div>

                    {/* Dönem */}
                    <div className="space-y-1.5">
                        <label htmlFor="filter-year" className="block text-xs font-medium text-muted-foreground">
                            Dönem
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden />
                            <select
                                id="filter-year"
                                name="year"
                                value={filters.year}
                                onChange={handleFilterChange}
                                className="w-full bg-card border border-border rounded-xl py-2.5 pl-9 pr-8 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer hover:bg-accent/50 transition-colors shadow-sm outline-none"
                                aria-label="Dönem seçin"
                            >
                                <option value="">Tümü</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden />
                        </div>
                    </div>
                </div>

                {/* Mobil: Filtreleri temizle */}
                {hasActiveFilters && (
                    <div className="md:hidden mt-3">
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            Filtreleri temizle
                        </button>
                    </div>
                )}
            </section>

            {filteredNotes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
                    {filteredNotes.map((note) => {
                        const author = {
                            name: note.uploader.anonymousName,
                            avatar: '',
                        };

                        const mappedNote = {
                            id: note.id,
                            title: note.title,
                            course: note.courseName || note.title,
                            university: note.university,
                            department: note.department,
                            instructor: "",
                            views: 0,
                            likes: 0,
                            price: note.price || 0,
                            uploaderId: note.uploader.id,
                            previewUrl: "/doc.png",
                            fileUrl: `/api/download/${note.id}`,
                            description: note.description,
                            type: note.type ?? '',
                        };

                        return (
                            <Link
                                href={`/notes/${note.id}`}
                                key={note.id}
                                className="block transition-transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-2xl"
                            >
                                <NoteCard note={mappedNote} author={author} />
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center animate-in fade-in duration-300">
                    <div className="bg-muted/50 p-6 rounded-2xl border border-border mb-5">
                        <Filter className="h-12 w-12 text-muted-foreground/60" aria-hidden />
                    </div>
                    <p className="text-base md:text-lg font-medium text-foreground mb-1">
                        Bu kriterlere uygun not bulunamadı
                    </p>
                    <p className="text-sm text-muted-foreground mb-5">
                        Filtreleri değiştirerek veya arama metnini güncelleyerek tekrar deneyin.
                    </p>
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                        Filtreleri temizle
                    </button>
                </div>
            )}
        </div>
    );
}
