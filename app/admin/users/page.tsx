import { getPendingUsers } from '@/app/actions/adminActions';
import UserApprovalList from '@/components/admin/UserApprovalList';

export default async function AdminUsersPage() {
    const { success, data } = await getPendingUsers();

    if (!success || !data) {
        return <div className="text-red-500">Kullanıcılar yüklenirken hata oluştu.</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Bekleyen Kullanıcı Başvuruları</h1>
            <UserApprovalList users={data} />
        </div>
    );
}
