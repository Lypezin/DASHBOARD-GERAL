import { useState, useCallback, useEffect, useRef } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { Badge, LeaderboardEntry } from '@/types/gamification';
import { useGamificationCelebration } from '@/hooks/gamification/useGamificationCelebration';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';
import { useDeferredMount } from '@/hooks/ui/useDeferredMount';
import { getAppApiData, postAppApiData } from '@/utils/app/fetchAppApi';
import { supabase } from '@/lib/supabaseClient';

type UserBadgeRow = {
    badge_slug: string;
    unlocked_at: string | null;
};

export function useGamificationState() {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [unlockedBadges, setUnlockedBadges] = useState<Badge[]>([]);
    const [recentUnlock, setRecentUnlock] = useState<Badge | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const { triggerCelebration } = useGamificationCelebration();
    const { currentUser, isAuthenticated, hasResolved } = useAppBootstrap();
    const shouldBootstrapGamification = useDeferredMount({ timeoutMs: 6000 });
    const loginRegisteredRef = useRef<string | null>(null);
    const recentInteractionRef = useRef<Map<string, number>>(new Map());

    const refreshLeaderboard = useCallback(async () => {
        const { data } = await getAppApiData<LeaderboardEntry[]>('/api/app/gamification');
        if (data) setLeaderboard(data);
    }, []);

    const fetchState = useCallback(async () => {
        if (!currentUser?.id) return;

        await refreshLeaderboard();

        const [{ data: allBadges }, { data: unlocked }] = await Promise.all([
            supabase.from('gamification_badges').select('slug, name, description, icon, category'),
            supabase.from('gamification_user_badges').select('badge_slug, unlocked_at').eq('user_id', currentUser.id)
        ]);

        const badgeRows = (allBadges || []) as Badge[];
        const unlockedRows = (unlocked || []) as UserBadgeRow[];

        if (badgeRows.length > 0) setBadges(badgeRows);

        if (badgeRows.length > 0 && unlockedRows.length > 0) {
            const unlockedSlugs = new Set(unlockedRows.map((userBadge) => userBadge.badge_slug));
            const unlockedList = badgeRows
                .filter((badge) => unlockedSlugs.has(badge.slug))
                .map((badge) => ({
                    ...badge,
                    unlocked_at: unlockedRows.find((userBadge) => userBadge.badge_slug === badge.slug)?.unlocked_at || undefined
                }));
            setUnlockedBadges(unlockedList);
        }
    }, [currentUser?.id, refreshLeaderboard]);

    const registerInteraction = useCallback(async (type: 'login' | 'view_comparacao' | 'upload' | 'view_resumo' | 'view_entregadores' | 'view_evolucao' | 'filter_change') => {
        if (!currentUser?.id) return;

        try {
            const interactionKey = `${currentUser.id}:${type}`;
            const now = Date.now();
            const lastInteractionAt = recentInteractionRef.current.get(interactionKey) || 0;
            if (now - lastInteractionAt < 30000) {
                return;
            }
            recentInteractionRef.current.set(interactionKey, now);

            const { data, error } = await postAppApiData<{
                new_badge_slug: string;
                new_badge_name: string;
                new_badge_description: string;
                new_badge_icon: string;
            }[]>('/api/app/gamification', { type });

            if (error) {
                recentInteractionRef.current.delete(interactionKey);
                safeLog.error('Error registering interaction:', error);
                return;
            }

            if (data && data.length > 0) {
                data.forEach((newBadge) => {
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
            recentInteractionRef.current.delete(`${currentUser.id}:${type}`);
            safeLog.error('Gamification error:', e);
        }
    }, [currentUser?.id, triggerCelebration]);

    useEffect(() => {
        if (!shouldBootstrapGamification || !hasResolved || !isAuthenticated || !currentUser?.id) {
            return;
        }

        void fetchState();

        if (loginRegisteredRef.current !== currentUser.id) {
            loginRegisteredRef.current = currentUser.id;
            void registerInteraction('login');
        }
    }, [currentUser?.id, fetchState, hasResolved, isAuthenticated, registerInteraction, shouldBootstrapGamification]);

    return {
        badges,
        unlockedBadges,
        recentUnlock,
        leaderboard,
        refreshLeaderboard,
        registerInteraction
    };
}
