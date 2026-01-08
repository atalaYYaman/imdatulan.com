'use client';

import { useState } from 'react';
import { approveUser, rejectUser } from '@/app/actions/adminActions';
import Image from 'next/image';

type UserData = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    tcIdentityNo: string | null;
    studentIdCardUrl: string | null;
    studentNumber: string | null;
    university: string | null;
    department: string | null;
    createdAt: Date;
};

export default function UserApprovalList({ users }: { users: UserData[] }) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleApprove = async (userId: string) => {
        if (!confirm('Kullanıcıyı onaylamak istediğinize emin misiniz?')) return;
        setActionLoading(userId);
        await approveUser(userId);
        setActionLoading(null);
    };

    const handleReject = async (userId: string) => {
        const reason = prompt('Reddetme sebebi?');
        if (!reason) return;

        setActionLoading(userId);
        await rejectUser(userId, reason);
        setActionLoading(null);
    };

    if (users.length === 0) {
        return <div className="text-gray-400">Bekleyen kullanıcı başvurusu yok.</div>;
    }

    return (
        <div className="grid gap-6">
            {users.map(user => (
                <div key={user.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col md:flex-row gap-6">
                    {/* ID Card Image */}
                    <div className="w-full md:w-1/3 bg-gray-900 rounded-lg overflow-hidden border border-gray-700 relative h-64 md:h-auto">
                        {user.studentIdCardUrl ? (
                            <Image
                                src={user.studentIdCardUrl}
                                alt="Student ID"
                                fill
                                className="object-contain" // Use object-contain to see full ID
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Görsel Yok
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-4">
                        <div>
                            <h3 className="text-xl font-bold text-white">{user.firstName} {user.lastName}</h3>
                            <p className="text-gray-400 text-sm">Katılma: {new Date(user.createdAt).toLocaleDateString('tr-TR')}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="text-gray-500">TC Kimlik No</div>
                            <div className="text-gray-300 font-mono">{user.tcIdentityNo}</div>

                            <div className="text-gray-500">Öğrenci No</div>
                            <div className="text-gray-300 font-mono">{user.studentNumber}</div>

                            <div className="text-gray-500">Email</div>
                            <div className="text-gray-300">{user.email}</div>

                            <div className="text-gray-500">Okul</div>
                            <div className="text-gray-300">{user.university}</div>

                            <div className="text-gray-500">Bölüm</div>
                            <div className="text-gray-300">{user.department}</div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-700">
                            <button
                                onClick={() => handleApprove(user.id)}
                                disabled={!!actionLoading}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {actionLoading === user.id ? 'İşleniyor...' : 'Onayla'}
                            </button>
                            <button
                                onClick={() => handleReject(user.id)}
                                disabled={!!actionLoading}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                Reddet
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
