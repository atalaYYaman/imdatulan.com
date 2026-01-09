'use client';

import { useState } from "react";
import { Search, Filter, Layers, LayoutGrid, Calendar } from "lucide-react";
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
    term: string | null; // Added term field usage
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
    const [filters, setFilters] = useState({
        university: "",
        faculty: "",
        department: "",
        year: "",
    });

    // Dependent Dropdown Logic
    const selectedUni = universities.find(u => u.name === filters.university);
    const faculties = selectedUni ? selectedUni.faculties : [];

    const selectedFaculty = faculties.find(f => f.name === filters.faculty);
    const departments = selectedFaculty ? selectedFaculty.departments : [];

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value,
            // Reset child filters on parent change
            ...(name === 'university' ? { faculty: '', department: '' } : {}),
            ...(name === 'faculty' ? { department: '' } : {}),
        }));
    };

    // Filter logic
    const filteredNotes = initialNotes.filter(note => {
        // Map DB fields to search
        const titleMatch = (note.title || "").toLowerCase().includes(searchQuery.toLowerCase());
        const courseMatch = (note.courseName || "").toLowerCase().includes(searchQuery.toLowerCase());
        const topicMatch = (note.description || "").toLowerCase().includes(searchQuery.toLowerCase());

        const matchesSearch = titleMatch || courseMatch || topicMatch;
        const matchesUni = filters.university ? note.university === filters.university : true;
        const matchesFaculty = filters.faculty ? note.faculty === filters.faculty : true; // Assuming 'faculty' field exists on note or inferred
        const matchesDept = filters.department ? note.department === filters.department : true;
        const matchesYear = filters.year ? note.term?.includes(filters.year) : true; // Simple inclusion check for year

        return matchesSearch && matchesUni && matchesDept && matchesYear;
    });

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6 text-foreground bg-background">
                <div className="bg-card p-8 rounded-3xl border border-border shadow-2xl max-w-lg w-full">
                    <div className="h-20 w-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="h-10 w-10" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4">Notlara Erişmek İçin Giriş Yap</h1>
                    <p className="text-muted-foreground mb-8">
                        Binlerce ders notuna, çıkmış sorulara ve ödev kaynaklarına erişmek için hemen topluluğumuza katıl.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/auth/signin" className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors">
                            Giriş Yap
                        </Link>
                        <Link href="/auth/signup" className="px-8 py-3 border border-primary/30 text-primary font-bold rounded-xl hover:bg-primary/10 transition-colors">
                            Kayıt Ol
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background p-6 text-foreground pb-24 md:pb-6">
            <div className="mb-8 space-y-4">
                <h1 className="text-3xl font-bold tracking-tight text-primary">Notlar</h1>
                <div className="relative">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Ders adı veya konu ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl py-3 pl-12 pr-4 text-foreground text-base focus:ring-2 focus:ring-primary outline-none shadow-lg placeholder-muted-foreground"
                    />
                </div>
            </div>

            {/* Filters: University -> Faculty -> Dept -> Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

                {/* 1. University */}
                <div className="relative">
                    <Filter className="absolute left-3 top-3 h-4 w-4 text-primary" />
                    <select
                        name="university"
                        value={filters.university}
                        onChange={handleFilterChange}
                        className="w-full bg-card border border-border rounded-xl py-2.5 pl-9 pr-8 text-sm text-foreground focus:border-primary appearance-none cursor-pointer hover:bg-accent transition-colors"
                    >
                        <option value="">Tüm Üniversiteler</option>
                        {universities.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                    </select>
                </div>

                {/* 2. Faculty (Dependent on Uni) */}
                <div className="relative">
                    <LayoutGrid className="absolute left-3 top-3 h-4 w-4 text-primary" />
                    <select
                        name="faculty"
                        value={filters.faculty}
                        onChange={handleFilterChange}
                        disabled={!filters.university}
                        className="w-full bg-card border border-border disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-2.5 pl-9 pr-8 text-sm text-foreground focus:border-primary appearance-none cursor-pointer hover:bg-accent transition-colors"
                    >
                        <option value="">Tüm Fakülteler</option>
                        {faculties.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                    </select>
                </div>

                {/* 3. Department (Dependent on Faculty) */}
                <div className="relative">
                    <Layers className="absolute left-3 top-3 h-4 w-4 text-primary" />
                    <select
                        name="department"
                        value={filters.department}
                        onChange={handleFilterChange}
                        disabled={!filters.faculty}
                        className="w-full bg-card border border-border disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-2.5 pl-9 pr-8 text-sm text-foreground focus:border-primary appearance-none cursor-pointer hover:bg-accent transition-colors"
                    >
                        <option value="">Tüm Bölümler</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>

                {/* 4. Year / Term */}
                <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-primary" />
                    <select
                        name="year"
                        value={filters.year}
                        onChange={handleFilterChange}
                        className="w-full bg-card border border-border rounded-xl py-2.5 pl-9 pr-8 text-sm text-foreground focus:border-primary appearance-none cursor-pointer hover:bg-accent transition-colors"
                    >
                        <option value="">Tüm Dönemler</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                Son Eklenenler
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{filteredNotes.length}</span>
            </h2>

            {filteredNotes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredNotes.map(note => {
                        // Adapter to match NodCard interface
                        const author = {
                            name: `${note.uploader.firstName || ''} ${note.uploader.lastName || ''}`.trim() || 'Anonim',
                            avatar: '', // TODO: Add avatars
                            stats: { followers: 0, rating: 0, following: 0, totalNotes: 0 },
                            email: note.uploader.email,
                            role: note.uploader.role,
                            university: note.uploader.university,
                            department: note.uploader.department,
                            wallet: 0
                        };

                        // Map DB note to NodCard note interface
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
                            previewUrl: "/doc.png", // Generic preview
                            fileUrl: note.fileUrl,
                            description: note.description,
                            type: note.type,
                        };

                        return (
                            <Link href={`/notes/${note.id}`} key={note.id} className="block transition-transform hover:scale-105">
                                <NodCard note={mappedNote} author={author} />
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <div className="bg-card p-6 rounded-full border border-border mb-4">
                        <Filter className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p>Aradığınız kriterlere uygun not bulunamadı.</p>
                    <button
                        onClick={() => { setFilters({ university: '', faculty: '', department: '', year: '' }); setSearchQuery(''); }}
                        className="mt-4 text-primary hover:underline"
                    >
                        Filtreleri Temizle
                    </button>
                </div>
            )}
        </div>
    );
}
