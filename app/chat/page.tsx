import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getChatMessages } from "@/app/actions/chatActions";
import { prisma } from "@/lib/prisma";
import ChatBox from "@/components/Chat/ChatBox";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { CHAT_ENABLED } from "@/lib/chatEnabled";

export const metadata: Metadata = {
    title: "Sohbet | Otlak",
    description: "Otlak topluluğu ile sohbet et.",
};

export default async function ChatPage() {
    if (!CHAT_ENABLED) {
        redirect("/");
    }

    const session = await getServerSession(authOptions);
    const messages = await getChatMessages();

    let currentUser = null;
    if (session?.user?.email) {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, firstName: true, lastName: true, role: true }
        });

        if (user) {
            currentUser = {
                id: user.id,
                name: `${user.firstName} ${user.lastName?.[0] || ''}.`,
                role: (user as any).role // Assuming role exists on User model
            };
        }
    }

    return (
        <div className="min-h-screen pb-24 md:pb-8 pt-6 px-4 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] opacity-30 animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] opacity-30 animate-pulse-slow delay-1000" />
            </div>

            <div className="w-full max-w-2xl space-y-6">
                <div className="text-center space-y-2 mb-8">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Topluluk Sohbeti
                    </h1>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                        Diğer öğrencilerle tanış, not iste veya sadece geyik yap.
                        Burada "Süt" değil, muhabbet döner! 🥛💬
                    </p>
                </div>

                <ChatBox
                    initialMessages={messages}
                    currentUser={currentUser}
                />
            </div>
        </div>
    );
}
