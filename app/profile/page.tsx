import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileView from "@/components/profile/ProfileView";

import { maskStudentNumber } from "@/lib/masking";
import { getAnonymousNameByDepartment } from "@/lib/anonymization";
import type { NoteLetterGrade } from "@prisma/client";
import { averageScoreToLetter } from "@/lib/noteGrades";

// Server Component
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        redirect("/auth/signin");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            notes: {
                where: { deletedAt: null },
                include: {
                    _count: {
                        select: { grades: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            },
            unlockedNotes: {
                include: {
                    note: {
                        include: {
                            uploader: {
                                select: {
                                    id: true,
                                    department: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    if (!user) {
        redirect("/auth/signin");
    }

    const totalNotes = user.notes.length;
    const totalViews = user.notes.reduce(
        (acc, note) => acc + (note.viewCount || 0),
        0
    );
    const totalRatingsReceived = user.notes.reduce(
        (acc, note) => acc + (note._count?.grades || 0),
        0
    );

    const allNoteIds = [
        ...new Set([
            ...user.notes.map((n) => n.id),
            ...user.unlockedNotes.map((u) => u.note.id),
        ]),
    ];
    type ProfileGradeAgg = {
        noteId: string
        _count: number
        _avg: { score: number | null }
    }
    let gradeAggs: ProfileGradeAgg[] = []
    if (allNoteIds.length > 0) {
        try {
            const gradeDelegate = prisma.noteGrade as unknown as {
                groupBy: (args: {
                    by: ['noteId']
                    where: { noteId: { in: string[] } }
                    _avg: { score: true }
                    _count: true
                }) => Promise<ProfileGradeAgg[]>
            }
            gradeAggs = await gradeDelegate.groupBy({
                by: ['noteId'],
                where: { noteId: { in: allNoteIds } },
                _avg: { score: true },
                _count: true,
            })
        } catch (e) {
            console.error(
                'profile: NoteGrade groupBy başarısız (migration gerekli olabilir):',
                e
            )
        }
    }
    const gradeByNote = new Map<
        string,
        { count: number; averageScore: number | null; letter: NoteLetterGrade | null }
    >();
    for (const g of gradeAggs) {
        const count = g._count;
        const avg = count > 0 && g._avg.score != null ? g._avg.score : null;
        gradeByNote.set(g.noteId, {
            count,
            averageScore: avg,
            letter: avg != null ? averageScoreToLetter(avg) : null,
        });
    }

    function attachRating<T extends { id: string }>(note: T) {
        const r = gradeByNote.get(note.id);
        return {
            ...note,
            rating: r ?? {
                count: 0,
                averageScore: null,
                letter: null as NoteLetterGrade | null,
            },
        };
    }

    const stats = {
        totalRatingsReceived,
        totalViews,
        totalNotes,
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

    // Extract purchased notes from the relation
    // We need to shape them like the 'notes' array for the view
    const notesWithRating = user.notes.map((n) => attachRating(n));
    const purchasedNotes = user.unlockedNotes.map((unlocked) => ({
        ...attachRating(unlocked.note),
        uploader: {
            id: unlocked.note.uploader.id,
            department: unlocked.note.uploader.department,
            anonymousName: getAnonymousNameByDepartment(
                unlocked.note.uploader.department
            ),
        },
    }));

    return (
        <ProfileView
            user={profileUser}
            notes={notesWithRating}
            purchasedNotes={purchasedNotes}
            stats={stats}
        />
    );
}
