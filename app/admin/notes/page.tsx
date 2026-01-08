import { getPendingNotes } from '@/app/actions/adminActions';
import NoteApprovalList from '@/components/admin/NoteApprovalList';

export default async function AdminNotesPage() {
    const { success, data } = await getPendingNotes();

    if (!success || !data) {
        return <div className="text-red-500">Notlar yüklenirken hata oluştu.</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Bekleyen Not Başvuruları</h1>
            <NoteApprovalList notes={data} />
        </div>
    );
}
