'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { Badge, LeaderboardEntry } from '@/types/gamification';
import { useGamificationState } from './hooks/useGamificationState';

interface GamificationActionsType {
    registerInteraction: (type: 'login' | 'view_comparacao' | 'upload' | 'view_resumo' | 'view_entregadores' | 'view_evolucao' | 'filter_change') => Promise<void>;
    refreshLeaderboard: () => Promise<void>;
}

interface GamificationContextType extends GamificationActionsType {
    badges: Badge[];
    unlockedBadges: Badge[];
    recentUnlock: Badge | null;
    leaderboard: LeaderboardEntry[];
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);
const GamificationActionsContext = createContext<GamificationActionsType | undefined>(undefined);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
    const gamificationState = useGamificationState();

    const actionsValue = useMemo<GamificationActionsType>(() => ({
        registerInteraction: gamificationState.registerInteraction,
        refreshLeaderboard: gamificationState.refreshLeaderboard,
    }), [gamificationState.registerInteraction, gamificationState.refreshLeaderboard]);

    return (
        <GamificationActionsContext.Provider value={actionsValue}>
            <GamificationContext.Provider value={gamificationState}>
                {children}
            </GamificationContext.Provider>
        </GamificationActionsContext.Provider>
    );
}

export function useGamificationActions(): GamificationActionsType {
    const context = useContext(GamificationActionsContext);
    if (!context) throw new Error('useGamificationActions must be used within GamificationProvider');
    return context;
}

export function useGamification() {
    const context = useContext(GamificationContext);
    if (!context) throw new Error('useGamification must be used within GamificationProvider');
    return context;
}

export function useOptionalGamification() {
    return useContext(GamificationContext);
}
