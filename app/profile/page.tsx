import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileView from "@/components/profile/ProfileView";

import { maskStudentNumber } from "@/lib/masking";

// Server Component
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        redirect("/auth/signin");
    }

    // Fetch User Data with Notes and Like Counts in a single query
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            notes: {
                where: { deletedAt: null }, // Soft Delete Filter
                include: {
                    _count: {
                        select: { likes: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!user) {
        redirect("/auth/signin");
    }

    // Calculate Stats
    const totalNotes = user.notes.length;
    // Note: viewCount is an Int field on Note model, so it's directly accessible.
    // _count.likes comes from the include above.
    const totalViews = user.notes.reduce((acc, note) => acc + (note.viewCount || 0), 0);
    // @ts-ignore: _count property exists due to include, but basic Note type might not reflect it without generated types update
    const totalLikes = user.notes.reduce((acc, note) => acc + (note._count?.likes || 0), 0);

    const stats = {
        totalLikes,
        totalViews,
        totalNotes
    };

    // Format data for View
    const profileUser = {
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Kullanıcı',
        university: user.university || 'Belirtilmemiş',
        faculty: user.faculty || '',
        department: user.department || '',
        role: user.role,
        studentNumber: maskStudentNumber(user.studentNumber) // MASKED
    };

    return <ProfileView user={profileUser} notes={user.notes} stats={stats} />;
}
