import { getReleaseNotes } from "@/app/actions/changelogActions";
import { ScrollText, Calendar, Tag } from "lucide-react";
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default async function UpdatesPage() {
    const result = await getReleaseNotes();
    const notes = result.success ? result.data : [];

    return (
        <div className="min-h-screen bg-background pb-20 pt-24 md:pl-20">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex items-center gap-4 mb-12">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <ScrollText className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground">Geliştirme Notları</h1>
                        <p className="text-muted-foreground mt-1 text-lg">Otlak projesinde yapılan son güncellemeler ve yenilikler.</p>
                    </div>
                </div>

                {/* Timeline */}
                <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">

                    {notes.length === 0 ? (
                        <div className="relative flex flex-col items-center justify-center p-12 text-center bg-card/40 border border-dashed border-border rounded-3xl">
                            <ScrollText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-bold text-foreground">Henüz güncelleme notu yok</h3>
                            <p className="text-muted-foreground">Yakında burası dolup taşacak!</p>
                        </div>
                    ) : (
                        notes.map((note, index) => (
                            <div key={note.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">

                                {/* Icon/Dot on Line */}
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-card shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 absolute left-0 md:static">
                                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                                </div>

                                {/* Content Card */}
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card/60 backdrop-blur-xl border border-border/50 p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01] ml-auto md:ml-0">

                                    {/* Version Badge & Date */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]`}>
                                            v{note.version}
                                        </span>
                                        <div className="flex items-center text-xs text-muted-foreground font-medium">
                                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                            {new Date(note.publishedAt).toLocaleDateString('tr-TR', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </div>

                                    {/* Title & Body */}
                                    <h3 className="text-xl font-bold text-foreground mb-3 leading-snug">
                                        {note.title}
                                    </h3>
                                    <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap mb-4">
                                        {note.description}
                                    </div>

                                    {/* Image (if exists) */}
                                    {note.imageUrl && (
                                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border/50 shadow-sm mt-4 group/image">
                                            <Image
                                                src={note.imageUrl}
                                                alt={note.title}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover/image:scale-105"
                                            />
                                        </div>
                                    )}

                                    {/* Author (Optional footer) */}
                                    {/* <div className="mt-4 pt-4 border-t border-border/50 flex items-center text-xs text-muted-foreground">
                    <span>Yayınlayan: Admin</span>
                  </div> */}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
