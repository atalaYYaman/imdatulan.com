'use client';

import { useState } from "react";
import { leaderboard, users } from "@/lib/dummyData";
import { Trophy, TrendingUp, Calendar, User, Star } from "lucide-react";

export default function TopNoderPage() {
    const [period, setPeriod] = useState<"thisMonth" | "lastMonth">("thisMonth");

    // Mock Pool Calculation
    const targetPool = 50000;
    const currentPool = period === "thisMonth" ? 32450 : 48200;
    const progress = (currentPool / targetPool) * 100;

    // Merge leaderboard data with user details
    const rankedUsers = leaderboard
        .filter(entry => entry.period === period)
        .map(entry => {
            const user = users.find(u => u.id === entry.userId);
            return {
                ...entry,
                name: user?.name,
                university: user?.university,
                department: user?.department,
                avatar: user?.avatar
            };
        })
        .sort((a, b) => b.earnings - a.earnings); // Sort by earnings for rank

    return (
        <div className="min-h-screen bg-[#01353D] text-white p-4 md:p-8 pb-24 md:pb-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header / Money Pool Section */}
                <div className="text-center space-y-6">
                    <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#22d3ee] to-white">
                        Top Noder Liderlik Tablosu
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        En çok katkı sağlayan noder'lar her ay toplanan bağış havuzundan pay alır. Sende notlarını paylaş, kazan!
                    </p>

                    <div className="relative bg-[#002A30] border border-[#003E44] rounded-3xl p-8 max-w-3xl mx-auto overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.1)]">
                        {/* Background Decoration */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#22d3ee] to-transparent opacity-50"></div>

                        <div className="flex flex-col items-center">
                            <span className="text-sm font-bold text-[#22d3ee] uppercase tracking-widest mb-2">Mevcut Ödül Havuzu</span>
                            <div className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-md tracking-tight">
                                {currentPool.toLocaleString('tr-TR')} <span className="text-3xl md:text-5xl text-[#22d3ee]">TL</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-[#01353D] h-4 rounded-full overflow-hidden border border-[#003E44] mb-2">
                                <div
                                    className="h-full bg-gradient-to-r from-[#0ea5e9] to-[#22d3ee] transition-all duration-1000 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between w-full text-xs text-gray-500 px-1">
                                <span>Hedef: {targetPool.toLocaleString('tr-TR')} TL</span>
                                <span>%{Math.round(progress)} Doldu</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => setPeriod("thisMonth")}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${period === "thisMonth"
                                ? "bg-[#22d3ee] text-[#002A30] border-[#22d3ee]"
                                : "bg-transparent text-gray-400 border-[#003E44] hover:border-gray-500 hover:text-white"
                            }`}
                    >
                        Bu Ay
                    </button>
                    <button
                        onClick={() => setPeriod("lastMonth")}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${period === "lastMonth"
                                ? "bg-[#22d3ee] text-[#002A30] border-[#22d3ee]"
                                : "bg-transparent text-gray-400 border-[#003E44] hover:border-gray-500 hover:text-white"
                            }`}
                    >
                        Geçen Ay
                    </button>
                </div>

                {/* Leaderboard Table */}
                <div className="bg-[#002A30] border border-[#003E44] rounded-2xl overflow-hidden shadow-xl">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 p-4 text-xs font-bold text-gray-400 border-b border-[#003E44] uppercase tracking-wider">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-11 md:col-span-5">Noder</div>
                        <div className="hidden md:col-span-2 text-center">Paylaşım</div>
                        <div className="hidden md:col-span-2 text-center">Rating</div>
                        <div className="hidden md:col-span-2 text-right pr-4">Kazanç</div>
                    </div>

                    {/* Table Rows */}
                    <div className="divide-y divide-[#003E44]">
                        {rankedUsers.map((user, index) => (
                            <div key={user.userId} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                                {/* Rank */}
                                <div className="col-span-1 flex justify-center">
                                    {index === 0 ? (
                                        <div className="h-8 w-8 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center font-bold border border-yellow-500/50">1</div>
                                    ) : index === 1 ? (
                                        <div className="h-8 w-8 bg-gray-400/20 text-gray-300 rounded-full flex items-center justify-center font-bold border border-gray-400/50">2</div>
                                    ) : index === 2 ? (
                                        <div className="h-8 w-8 bg-orange-700/20 text-orange-400 rounded-full flex items-center justify-center font-bold border border-orange-700/50">3</div>
                                    ) : (
                                        <span className="text-gray-500 font-bold">{index + 1}</span>
                                    )}
                                </div>

                                {/* User Info */}
                                <div className="col-span-11 md:col-span-5 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden border border-gray-600">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center"><User className="h-5 w-5 text-gray-400" /></div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-bold text-white truncate group-hover:text-[#22d3ee] transition-colors">{user.name}</h3>
                                        <p className="text-xs text-gray-400 truncate">{user.university} / {user.department}</p>
                                    </div>
                                    {/* Mobile Earnings (Visible only on small screens) */}
                                    <div className="md:hidden ml-auto text-right">
                                        <div className="text-sm font-bold text-[#22d3ee]">{user.earnings} TL</div>
                                    </div>
                                </div>

                                {/* Stats (Desktop) */}
                                <div className="hidden md:col-span-2 md:flex flex-col items-center justify-center">
                                    <span className="text-white font-bold">{user.shareCount}</span>
                                    <span className="text-[10px] text-gray-500 uppercase">Not</span>
                                </div>

                                <div className="hidden md:col-span-2 md:flex items-center justify-center gap-1">
                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                    <span className="text-white font-bold">{user.rating}</span>
                                </div>

                                <div className="hidden md:col-span-2 md:flex justify-end pr-4">
                                    <span className="text-[#22d3ee] font-bold text-lg">{user.earnings} TL</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
