import { getNotes } from "@/app/actions/getNotes";
import NotesClient from "./NotesClient";

export const dynamic = 'force-dynamic';

export default async function NotesPage() {
    const notes = await getNotes();

    return <NotesClient initialNotes={notes} />;
}
