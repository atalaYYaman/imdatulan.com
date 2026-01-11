'use client';

import { useState } from "react";
import { Search, Filter, Layers, LayoutGrid, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { universities, years } from "@/lib/universityData";
import { NodCard } from "@/components/ui/NodCard";
import { useSession } from "next-auth/react";
import Link from 'next/link';
import { Lock } from "lucide-react";

interface Note {
    id: string;
    title: string;
    description: string | null;
    courseName: string | null;
    university: string;
    department: string;
    term: string | null;
    type: string | null;
    fileUrl: string;
    createdAt: Date;
    price: number;
    uploader: {
        firstName: string | null;
        lastName: string | null;
        email: string;
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

        return matchesSearch && matchesUni && matchesDept && matchesYear;
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

    return (
        <div className="flex flex-col min-h-screen bg-background p-4 md:p-8 text-foreground pb-24 md:pb-8">
            <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Notlar</h1>
                    <span className="text-sm font-medium text-muted-foreground bg-accent/50 px-3 py-1 rounded-full border border-border">
                        {filteredNotes.length} Not Bulundu
                    </span>
                </div>

                <div className="relative group">
                    <div className="absolute inset-0 bg-primary/5 blur-lg rounded-xl transition-opacity opacity-0 group-focus-within:opacity-100" />
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Ders adı, konu veya açıklama ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl py-3 pl-12 pr-4 text-foreground text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm transition-all placeholder:text-muted-foreground/50 relative z-10"
                    />
                </div>
            </div>

            {/* Mobile Filter Toggle */}
            <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="md:hidden flex items-center justify-between w-full p-4 bg-card border border-border rounded-xl mb-4 text-sm font-medium text-foreground shadow-sm active:scale-[0.99] transition-transform"
            >
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    Filtrele
                </div>
                {isFiltersOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {/* Filters */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 transition-all duration-300 ease-in-out ${isFiltersOpen ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0 overflow-hidden md:opacity-100 md:max-h-none'}`}>
                {/* 1. University */}
                <div className="relative group">
                    <div className="absolute left-3 top-3 pointer-events-none">
                        <Filter className="h-4 w-4 text-primary group-hover:text-primary/80 transition-colors" />
                    </div>
                    <select
                        name="university"
                        value={filters.university}
                        onChange={handleFilterChange}
                        className="w-full bg-card border border-border rounded-xl py-2.5 pl-9 pr-8 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer hover:bg-accent/50 transition-colors shadow-sm outline-none"
                    >
                        <option value="">Tüm Üniversiteler</option>
                        {universities.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>

                {/* 2. Faculty */}
                <div className="relative group">
                    <div className="absolute left-3 top-3 pointer-events-none">
                        <LayoutGrid className="h-4 w-4 text-primary group-hover:text-primary/80 transition-colors" />
                    </div>
                    <select
                        name="faculty"
                        value={filters.faculty}
                        onChange={handleFilterChange}
                        disabled={!filters.university}
                        className="w-full bg-card border border-border disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-2.5 pl-9 pr-8 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer hover:bg-accent/50 transition-colors shadow-sm outline-none"
                    >
                        <option value="">Tüm Fakülteler</option>
                        {faculties.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>

                {/* 3. Department */}
                <div className="relative group">
                    <div className="absolute left-3 top-3 pointer-events-none">
                        <Layers className="h-4 w-4 text-primary group-hover:text-primary/80 transition-colors" />
                    </div>
                    <select
                        name="department"
                        value={filters.department}
                        onChange={handleFilterChange}
                        disabled={!filters.faculty}
                        className="w-full bg-card border border-border disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-2.5 pl-9 pr-8 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer hover:bg-accent/50 transition-colors shadow-sm outline-none"
                    >
                        <option value="">Tüm Bölümler</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>

                {/* 4. Year */}
                <div className="relative group">
                    <div className="absolute left-3 top-3 pointer-events-none">
                        <Calendar className="h-4 w-4 text-primary group-hover:text-primary/80 transition-colors" />
                    </div>
                    <select
                        name="year"
                        value={filters.year}
                        onChange={handleFilterChange}
                        className="w-full bg-card border border-border rounded-xl py-2.5 pl-9 pr-8 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer hover:bg-accent/50 transition-colors shadow-sm outline-none"
                    >
                        <option value="">Tüm Dönemler</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
            </div>

            {filteredNotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    {filteredNotes.map((note, index) => {
                        const author = {
                            name: `${note.uploader.firstName || ''} ${note.uploader.lastName || ''}`.trim() || 'Anonim',
                            avatar: '',
                            stats: { followers: 0, rating: 0, following: 0, totalNotes: 0 },
                            email: note.uploader.email,
                            role: note.uploader.role,
                            university: note.uploader.university,
                            department: note.uploader.department,
                            wallet: 0
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
                            fileUrl: note.fileUrl,
                            description: note.description,
                            type: note.type,
                        };

                        return (
                            <Link
                                href={`/notes/${note.id}`}
                                key={note.id}
                                className="block transition-transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary rounded-2xl"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <NodCard note={mappedNote} author={author} />
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-in fade-in zoom-in duration-300">
                    <div className="bg-card/50 p-6 rounded-full border border-border mb-4">
                        <Filter className="h-10 w-10 text-muted-foreground opacity-50" />
                    </div>
                    <p className="text-lg font-medium">Aradığınız kriterlere uygun not bulunamadı.</p>
                    <button
                        onClick={() => {
                            setFilters({ university: '', faculty: '', department: '', year: '' });
                            setSearchQuery('');
                            setIsFiltersOpen(true);
                        }}
                        className="mt-4 text-primary font-bold hover:underline"
                    >
                        Filtreleri Temizle
                    </button>
                </div>
            )}
        </div>
    );
}
