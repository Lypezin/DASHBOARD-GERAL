'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { ICON_MAP } from './gamification/icons';
import { useGamificationCelebration } from '@/hooks/gamification/useGamificationCelebration';
// ... imports

// ... imports

export interface Badge {
    slug: string;
    name: string;
    description: string;
    icon: string;
    unlocked_at?: string;
    category?: string;
}

interface LeaderboardEntry {
    rank: number;
    user_name: string;
    avatar_url?: string;
    pracas?: string;
    total_badges: number;
    badges_list: { name: string; icon: string; slug: string; category?: string; description?: string }[];
    current_streak: number;
}

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
    const [badges, setBadges] = useState<Badge[]>([]);
    const [unlockedBadges, setUnlockedBadges] = useState<Badge[]>([]);
    const [recentUnlock, setRecentUnlock] = useState<Badge | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const { triggerCelebration } = useGamificationCelebration();

    // Fetch Leaderboard
    const refreshLeaderboard = useCallback(async () => {
        const { data } = await supabase.rpc('get_gamification_leaderboard');
        if (data) setLeaderboard(data);
    }, []);

    // Fetch initial state
    const fetchState = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        refreshLeaderboard();

        // 1. Get all definitions
        const { data: allBadges } = await supabase.from('gamification_badges').select('*');

        // 2. Get unlocked
        const { data: unlocked } = await supabase.from('gamification_user_badges').select('badge_slug, unlocked_at').eq('user_id', user.id);

        if (allBadges) setBadges(allBadges);

        if (allBadges && unlocked) {
            const unlockedSlugs = new Set(unlocked.map(u => u.badge_slug));
            const unlockedList = allBadges
                .filter(b => unlockedSlugs.has(b.slug))
                .map(b => ({
                    ...b,
                    unlocked_at: unlocked.find(u => u.badge_slug === b.slug)?.unlocked_at
                }));
            setUnlockedBadges(unlockedList);
        }
    }, [refreshLeaderboard]);

    // Register interaction
    const registerInteraction = useCallback(async (type: 'login' | 'view_comparacao' | 'upload' | 'view_resumo' | 'view_entregadores' | 'view_evolucao' | 'filter_change') => {
        try {
            const { data, error } = await supabase.rpc('register_interaction', { p_interaction_type: type });

            if (error) {
                safeLog.error('Error registering interaction:', error);
                return;
            }

            if (data && data.length > 0) {
                // New badges unlocked!
                data.forEach((newBadge: any) => {
                    const badgeObj = {
                        slug: newBadge.new_badge_slug,
                        name: newBadge.new_badge_name,
                        description: newBadge.new_badge_description,
                        icon: newBadge.new_badge_icon,
                        unlocked_at: new Date().toISOString()
                    };

                    setUnlockedBadges(prev => [...prev, badgeObj]);
                    setRecentUnlock(badgeObj);

                    // Trigger effects
                    triggerCelebration(badgeObj);
                });
            }
        } catch (e) {
            safeLog.error('Gamification error:', e);
        }
    }, [triggerCelebration]);

    // Initial load & Login Registration
    useEffect(() => {
        fetchState();

        // Auto-register login interaction if authenticated
        const checkLogin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                registerInteraction('login');
            }
        };
        checkLogin();
    }, [fetchState, registerInteraction]);

    return (
        <GamificationContext.Provider value={{ badges, unlockedBadges, recentUnlock, registerInteraction, leaderboard, refreshLeaderboard }}>
            {children}
        </GamificationContext.Provider>
    );
}

export function useGamification() {
    const context = useContext(GamificationContext);
    if (!context) throw new Error('useGamification must be used within GamificationProvider');
    return context;
}
