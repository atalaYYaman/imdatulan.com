import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileView from "@/components/profile/ProfileView";

// Server Component
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        redirect("/auth/signin");
    }

    // Fetch Real User Data
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            notes: true // Fetch user's uploaded notes
        }
    });

    if (!user) {
        // Should not happen if session exists, but safe fallback
        redirect("/auth/signin");
    }

    // Format data for View
    const profileUser = {
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Kullanıcı',
        university: user.university || 'Belirtilmemiş',
        faculty: user.faculty || '',
        department: user.department || '',
        role: user.role
    };

    return <ProfileView user={profileUser} notes={user.notes} />;
}
