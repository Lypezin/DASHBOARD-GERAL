import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { Badge, LeaderboardEntry } from '@/types/gamification';
import { useGamificationCelebration } from '@/hooks/gamification/useGamificationCelebration';

export function useGamificationState() {
    const { sessionUser } = useAuthSession();
    const [badges, setBadges] = useState<Badge[]>([]);
    const [unlockedBadges, setUnlockedBadges] = useState<Badge[]>([]);
    const [recentUnlock, setRecentUnlock] = useState<Badge | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const { triggerCelebration } = useGamificationCelebration();
    const lastLoginTrackedRef = useRef<string | null>(null);

    const refreshLeaderboard = useCallback(async () => {
        if (!sessionUser) {
            setLeaderboard([]);
            return;
        }

        const { data } = await supabase.rpc('get_gamification_leaderboard');
        if (data) setLeaderboard(data);
    }, [sessionUser]);

    const fetchState = useCallback(async () => {
        if (!sessionUser) {
            setBadges([]);
            setUnlockedBadges([]);
            setRecentUnlock(null);
            setLeaderboard([]);
            return;
        }

        refreshLeaderboard();

        const { data: allBadges } = await supabase.from('gamification_badges').select('slug, name, description, icon, category');
        const { data: unlocked } = await supabase.from('gamification_user_badges').select('badge_slug, unlocked_at').eq('user_id', sessionUser.id);

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
    }, [refreshLeaderboard, sessionUser]);

    const registerInteraction = useCallback(async (type: 'login' | 'view_comparacao' | 'upload' | 'view_resumo' | 'view_entregadores' | 'view_evolucao' | 'filter_change') => {
        if (!sessionUser) {
            return;
        }

        try {
            const { data, error } = await supabase.rpc('register_interaction', { p_interaction_type: type });

            if (error) {
                safeLog.error('Error registering interaction:', error);
                return;
            }

            if (data && data.length > 0) {
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
                    triggerCelebration(badgeObj);
                });
            }
        } catch (e) {
            safeLog.error('Gamification error:', e);
        }
    }, [sessionUser, triggerCelebration]);

    useEffect(() => {
        if (!sessionUser) {
            lastLoginTrackedRef.current = null;
            setBadges([]);
            setUnlockedBadges([]);
            setRecentUnlock(null);
            setLeaderboard([]);
            return;
        }

        fetchState();

        if (lastLoginTrackedRef.current !== sessionUser.id) {
            lastLoginTrackedRef.current = sessionUser.id;
            registerInteraction('login');
        }
    }, [fetchState, registerInteraction, sessionUser]);

    return {
        badges,
        unlockedBadges,
        recentUnlock,
        leaderboard,
        refreshLeaderboard,
        registerInteraction
    };
}
