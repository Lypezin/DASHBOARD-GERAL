'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Badge, ICON_MAP, useGamification } from '@/contexts/GamificationContext';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, User, Flame } from 'lucide-react';

interface AchievementsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AchievementsDialog({ open, onOpenChange }: AchievementsDialogProps) {
    const { badges, unlockedBadges } = useGamification();

    const categories = Array.from(new Set(badges.map(b => b.category || 'geral')));

    const renderBadgeCard = (badge: Badge) => {
        const isUnlocked = unlockedBadges.some(u => u.slug === badge.slug);
        const unlockedInfo = unlockedBadges.find(u => u.slug === badge.slug);
        const IconComponent = ICON_MAP[badge.icon] || ICON_MAP['Star'];

        return (
            <div
                key={badge.slug}
                className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 relative group",
                    isUnlocked
                        ? "border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-500/50"
                        : "border-slate-200 bg-slate-50 opacity-60 grayscale dark:border-slate-800 dark:bg-slate-900/50"
                )}
            >
                <div className={cn(
                    "p-3 rounded-full mb-3 transition-transform group-hover:scale-110",
                    isUnlocked ? "bg-gradient-to-br from-yellow-300 to-yellow-500 text-white shadow-lg shadow-yellow-500/20" : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                )}>
                    <IconComponent className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-center mb-1 text-slate-900 dark:text-slate-100">{badge.name}</h4>
                <p className="text-xs text-center text-slate-500 dark:text-slate-400 line-clamp-2">{badge.description}</p>

                {isUnlocked && unlockedInfo?.unlocked_at && (
                    <span className="absolute top-2 right-2 text-[10px] font-mono text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded-full">
                        {new Date(unlockedInfo.unlocked_at).toLocaleDateString()}
                    </span>
                )}
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        🏆 Galeria de Conquistas
                    </DialogTitle>
                    <DialogDescription>
                        Acompanhe seu progresso e conquiste medalhas exclusivas pelo seu uso do sistema.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden mt-4">
                    <Tabs defaultValue="todos" className="w-full h-full flex flex-col">
                        <TabsList className="mb-4">
                            <TabsTrigger value="ranking">🏆 Ranking Global</TabsTrigger>
                            <TabsTrigger value="todos">Todas ({unlockedBadges.length}/{badges.length})</TabsTrigger>
                            {categories.map(cat => (
                                <TabsTrigger key={cat} value={cat} className="capitalize">
                                    {cat}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <div className="flex-1 overflow-hidden relative">
                            <ScrollArea className="h-[50vh]">
                                <TabsContent value="ranking" className="mt-0">
                                    <div className="space-y-4 p-1">
                                        {/* Header do Ranking */}
                                        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white text-center mb-6 shadow-lg">
                                            <h3 className="text-2xl font-bold mb-2">Quadro de Líderes</h3>
                                            <p className="opacity-90">Veja quem são os usuários mais engajados do sistema.</p>
                                        </div>

                                        <div className="space-y-2">
                                            {useGamification().leaderboard.map((entry, index) => (
                                                <div key={index} className="flex flex-col p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:scale-[1.01]">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-4">
                                                            <div className={cn(
                                                                "w-8 h-8 flex items-center justify-center rounded-full font-bold",
                                                                index === 0 ? "bg-yellow-100 text-yellow-600" :
                                                                    index === 1 ? "bg-slate-100 text-slate-600" :
                                                                        index === 2 ? "bg-orange-100 text-orange-600" :
                                                                            "bg-slate-50 text-slate-400 font-normal"
                                                            )}>
                                                                #{entry.rank}
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                {/* Avatar */}
                                                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border-2 border-slate-100 dark:border-slate-700">
                                                                    {entry.avatar_url ? (
                                                                        <img src={entry.avatar_url} alt={entry.user_name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                            <User className="w-5 h-5" />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div>
                                                                    <p className="font-semibold text-slate-900 dark:text-slate-100">{entry.user_name}</p>
                                                                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                                        <div className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                                                                            <Flame className="w-3 h-3" />
                                                                            <span>{entry.current_streak} dias</span>
                                                                        </div>
                                                                        {entry.pracas && (
                                                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200 dark:border-slate-700">
                                                                                {entry.pracas}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/10 px-3 py-1.5 rounded-full border border-yellow-100 dark:border-yellow-900/30">
                                                            <Trophy className="w-4 h-4 text-yellow-500" />
                                                            <span className="font-bold text-yellow-700 dark:text-yellow-400">{entry.total_badges}</span>
                                                        </div>
                                                    </div>

                                                    {/* Mini Galeria de Conquistas */}
                                                    {entry.badges_list && entry.badges_list.length > 0 && (
                                                        <div className="mt-4 pl-14 flex items-center gap-2 flex-wrap">
                                                            {entry.badges_list.slice(0, 8).map((b, i) => {
                                                                const BadgeIcon = ICON_MAP[b.icon] || ICON_MAP['Star'];
                                                                return (
                                                                    <div key={i} className="group/badge relative">
                                                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors cursor-help">
                                                                            <BadgeIcon className="w-4 h-4" />
                                                                        </div>
                                                                        {/* Simple Tooltip (CSS based for performance) */}
                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover/badge:opacity-100 pointer-events-none transition-opacity z-50">
                                                                            {b.name}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                            {entry.badges_list.length > 8 && (
                                                                <span className="text-xs text-slate-400 ml-1 font-medium pb-1">+{entry.badges_list.length - 8}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {useGamification().leaderboard.length === 0 && (
                                                <div className="text-center p-8 text-slate-400">
                                                    Nenhum dado de ranking disponível ainda.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="todos" className="mt-0">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-1">
                                        {badges.map(renderBadgeCard)}
                                    </div>
                                </TabsContent>
                                {categories.map(cat => (
                                    <TabsContent key={cat} value={cat} className="mt-0">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-1">
                                            {badges.filter(b => b.category === cat).map(renderBadgeCard)}
                                        </div>
                                    </TabsContent>
                                ))}
                            </ScrollArea>
                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
