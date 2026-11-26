'use client';

import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useGamification } from '@/contexts/GamificationContext';
import { Badge } from '@/types/gamification';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ViewTransition } from '@/components/ui/view-transition';
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger';
import { BadgeCard } from './components/BadgeCard';
import { LeaderboardRanking } from './components/LeaderboardRanking';

interface AchievementsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AchievementsDialog({ open, onOpenChange }: AchievementsDialogProps) {
    const { badges, unlockedBadges } = useGamification();
    const [activeTab, setActiveTab] = useState<string>('todos');

    const { categories, badgesByCategory, unlockedMap } = useMemo(() => {
        const nextUnlocked = new Map<string, Badge>();
        for (const u of unlockedBadges) {
            nextUnlocked.set(u.slug, u);
        }

        const catMap = new Map<string, Badge[]>();
        for (const b of badges) {
            const cat = b.category || 'geral';
            let list = catMap.get(cat);
            if (!list) {
                list = [];
                catMap.set(cat, list);
            }
            list.push(b);
        }

        return {
            categories: Array.from(catMap.keys()),
            badgesByCategory: catMap,
            unlockedMap: nextUnlocked,
        };
    }, [badges, unlockedBadges]);

    const currentBadges = activeTab === 'todos' ? badges : (badgesByCategory.get(activeTab) ?? []);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="text-left pr-8">
                    <DialogTitle className="text-2xl font-bold flex flex-wrap items-center gap-2">
                        🏆 Galeria de Conquistas <span className="text-[10px] uppercase font-bold tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full motion-safe:animate-pulse self-center">Beta</span>
                    </DialogTitle>
                    <DialogDescription>Acompanhe seu progresso e conquiste medalhas exclusivas pelo seu uso do sistema.</DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-hidden mt-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
                        <TabsList className="mb-4 w-full justify-start overflow-x-auto no-scrollbar shrink-0">
                            <TabsTrigger value="ranking">🏆 Ranking Global</TabsTrigger>
                            <TabsTrigger value="todos">Todas ({unlockedBadges.length}/{badges.length})</TabsTrigger>
                            {categories.map(cat => (
                                <TabsTrigger key={cat} value={cat} className="capitalize">
                                    {cat}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <div className="flex-1 min-h-0 overflow-hidden relative">
                            <ScrollArea className="h-full pr-2">
                                <ViewTransition stateKey={activeTab} preventExitInteraction>
                                    {activeTab === 'ranking' ? (
                                        <div className="p-1">
                                            <LeaderboardRanking />
                                        </div>
                                    ) : (
                                        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 p-1" staggerDelay={0.03}>
                                            {currentBadges.map(b => {
                                                const unlocked = unlockedMap.get(b.slug);
                                                return (
                                                    <StaggerItem key={b.slug}>
                                                        <BadgeCard
                                                            badge={b}
                                                            isUnlocked={Boolean(unlocked)}
                                                            unlockedAt={unlocked?.unlocked_at}
                                                        />
                                                    </StaggerItem>
                                                );
                                            })}
                                        </StaggerContainer>
                                    )}
                                </ViewTransition>
                            </ScrollArea>
                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
