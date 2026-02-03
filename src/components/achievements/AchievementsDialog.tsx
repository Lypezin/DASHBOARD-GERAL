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
                                        {/* Header do Ranking Compacto */}
                                        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-3 text-white flex items-center justify-between shadow-md mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white/20 p-2 rounded-full">
                                                    <Trophy className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg leading-tight">Quadro de Líderes</h3>
                                                    <p className="text-xs opacity-90 font-medium">Top usuários engajados</p>
                                                </div>
                                            </div>
                                            <div className="text-right hidden sm:block">
                                                <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-medium">
                                                    Atualizado em tempo real
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {useGamification().leaderboard.map((entry, index) => {
                                                const isTop1 = index === 0;
                                                const isTop2 = index === 1;
                                                const isTop3 = index === 2;

                                                return (
                                                    <div
                                                        key={index}
                                                        className={cn(
                                                            "relative flex flex-col p-3 rounded-xl border transition-all hover:shadow-md",
                                                            isTop1 ? "bg-gradient-to-br from-yellow-50 to-white border-yellow-200 dark:from-yellow-900/10 dark:to-slate-900 dark:border-yellow-500/30" :
                                                                isTop2 ? "bg-gradient-to-br from-slate-50 to-white border-slate-300 dark:from-slate-800/50 dark:to-slate-900 dark:border-slate-600" :
                                                                    isTop3 ? "bg-gradient-to-br from-orange-50 to-white border-orange-200 dark:from-orange-900/10 dark:to-slate-900 dark:border-orange-500/30" :
                                                                        "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm"
                                                        )}
                                                    >
                                                        {isTop1 && (
                                                            <div className="absolute -top-2 -right-2 transform rotate-12">
                                                                <span className="text-2xl animate-pulse filter drop-shadow-md">👑</span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn(
                                                                    "w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full font-bold text-sm shadow-sm",
                                                                    isTop1 ? "bg-yellow-400 text-yellow-900" :
                                                                        isTop2 ? "bg-slate-300 text-slate-800" :
                                                                            isTop3 ? "bg-orange-300 text-orange-900" :
                                                                                "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                                                )}>
                                                                    #{entry.rank}
                                                                </div>

                                                                <div className="flex items-center gap-3">
                                                                    {/* Avatar */}
                                                                    <div className={cn(
                                                                        "w-10 h-10 rounded-full overflow-hidden border-2",
                                                                        isTop1 ? "border-yellow-400 shadow-sm" : "border-slate-100 dark:border-slate-700"
                                                                    )}>
                                                                        {entry.avatar_url ? (
                                                                            <img src={entry.avatar_url} alt={entry.user_name} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                                                                                <User className="w-5 h-5" />
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <p className={cn(
                                                                                "font-bold text-sm truncate max-w-[150px] sm:max-w-none",
                                                                                isTop1 ? "text-slate-900 dark:text-yellow-400" : "text-slate-700 dark:text-slate-200"
                                                                            )}>
                                                                                {entry.user_name}
                                                                            </p>
                                                                            {entry.pracas && entry.pracas !== 'Sem Acesso' && (
                                                                                <span className="hidden sm:inline-flex text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200 dark:border-slate-700 truncate max-w-[100px]">
                                                                                    {entry.pracas}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-3 text-xs mt-0.5">
                                                                            <span className="flex items-center gap-1 text-orange-500 font-medium bg-orange-50 dark:bg-orange-900/20 px-1.5 rounded-full">
                                                                                <Flame className="w-3 h-3 fill-orange-500" />
                                                                                {entry.current_streak}
                                                                            </span>
                                                                            <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500 font-bold bg-yellow-50 dark:bg-yellow-900/20 px-1.5 rounded-full">
                                                                                <Trophy className="w-3 h-3" />
                                                                                {entry.total_badges}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Mini Galeria de Conquistas - Compacta e Elegante */}
                                                        {entry.badges_list && entry.badges_list.length > 0 && (
                                                            <div className="mt-3 pl-[3.25rem] flex items-center gap-1.5 flex-wrap">
                                                                {entry.badges_list.slice(0, 10).map((b, i) => {
                                                                    const BadgeIcon = ICON_MAP[b.icon] || ICON_MAP['Star'];
                                                                    return (
                                                                        <div key={i} className="group/badge relative">
                                                                            <div className={cn(
                                                                                "w-7 h-7 rounded-full flex items-center justify-center border transition-all cursor-help hover:scale-110",
                                                                                "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400",
                                                                                "hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:border-yellow-200 dark:hover:border-yellow-500/50 hover:text-yellow-600 dark:hover:text-yellow-400"
                                                                            )}>
                                                                                <BadgeIcon className="w-3.5 h-3.5" />
                                                                            </div>
                                                                            {/* Tooltip Otimizado */}
                                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-slate-900/90 text-white text-[10px] rounded-md whitespace-nowrap opacity-0 group-hover/badge:opacity-100 pointer-events-none transition-all transform scale-95 group-hover/badge:scale-100 z-50 shadow-xl border border-white/10">
                                                                                <span className="font-semibold block text-yellow-400 text-center">{b.name}</span>
                                                                                {b.description && <span className="block text/[0.65rem] opacity-80 max-w-[150px] whitespace-normal text-center leading-tight mt-0.5">{b.description}</span>}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                                {entry.badges_list.length > 10 && (
                                                                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                                                        <span className="text-[9px] font-bold text-slate-500">+{entry.badges_list.length - 10}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}

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
