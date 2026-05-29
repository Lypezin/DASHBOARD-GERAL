'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { ICON_MAP } from './gamification/icons';
import { useGamificationCelebration } from '@/hooks/gamification/useGamificationCelebration';
import { Badge, LeaderboardEntry } from '@/types/gamification';
import { useGamificationState } from './hooks/useGamificationState';

interface GamificationContextType {
    badges: Badge[];
    unlockedBadges: Badge[];
    recentUnlock: Badge | null;
    leaderboard: LeaderboardEntry[];
    registerInteraction: (type: 'login' | 'view_comparacao' | 'upload' | 'view_resumo' | 'view_entregadores' | 'view_evolucao' | 'filter_change') => Promise<void>;
    refreshLeaderboard: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
    const gamificationState = useGamificationState();

    const contextValue = useMemo(() => ({
        ...gamificationState
    }), [gamificationState]);

    return (
        <GamificationContext.Provider value={contextValue}>
            {children}
        </GamificationContext.Provider>
    );
}

export function useGamification() {
    const context = useContext(GamificationContext);
    if (!context) throw new Error('useGamification must be used within GamificationProvider');
    return context;
}
