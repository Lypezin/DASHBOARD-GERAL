'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Badge, useGamification } from '@/contexts/GamificationContext';
import { ICON_MAP } from '@/contexts/gamification/icons';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BadgeCard } from './components/BadgeCard';
import { LeaderboardRanking } from './components/LeaderboardRanking';

interface AchievementsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AchievementsDialog({ open, onOpenChange }: AchievementsDialogProps) {
    const { badges, unlockedBadges } = useGamification();

    const categories = Array.from(new Set(badges.map(b => b.category || 'geral')));

    const getUnlockedInfo = (badgeSlug: string) => unlockedBadges.find(u => u.slug === badgeSlug);
    const isBadgeUnlocked = (badgeSlug: string) => unlockedBadges.some(u => u.slug === badgeSlug);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        🏆 Galeria de Conquistas
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full animate-pulse ml-1 self-center">
                            Beta
                        </span>
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
                                    <TabsContent value="ranking" className="mt-0">
                                        <LeaderboardRanking />
                                    </TabsContent>
                                </TabsContent>
                                <TabsContent value="todos" className="mt-0">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-1">
                                        {badges.map(badge => (
                                            <BadgeCard
                                                key={badge.slug}
                                                badge={badge}
                                                isUnlocked={isBadgeUnlocked(badge.slug)}
                                                unlockedAt={getUnlockedInfo(badge.slug)?.unlocked_at}
                                            />
                                        ))}
                                    </div>
                                </TabsContent>
                                {categories.map(cat => (
                                    <TabsContent key={cat} value={cat} className="mt-0">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-1">
                                            {badges.filter(b => b.category === cat).map(badge => (
                                                <BadgeCard
                                                    key={badge.slug}
                                                    badge={badge}
                                                    isUnlocked={isBadgeUnlocked(badge.slug)}
                                                    unlockedAt={getUnlockedInfo(badge.slug)?.unlocked_at}
                                                />
                                            ))}
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
