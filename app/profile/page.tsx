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

    // Calculate Stats
    const totalNotes = user.notes.length;

    // Aggregating views and likes from all notes
    // 'likes' and 'viewCount' need to be fetched with notes. 
    // We need to update the query above to include aggregations or fetch necessary fields.
    // For MVP efficiency, let's update the query below.

    const userStats = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            notes: {
                select: {
                    viewCount: true,
                    _count: {
                        select: { likes: true }
                    }
                }
            }
        }
    });

    const totalViews = userStats?.notes.reduce((acc, note) => acc + (note.viewCount || 0), 0) || 0;
    const totalLikes = userStats?.notes.reduce((acc, note) => acc + (note._count.likes || 0), 0) || 0;

    const stats = {
        totalLikes,
        totalViews,
        totalNotes
    };

    return <ProfileView user={profileUser} notes={user.notes} stats={stats} />;
}
