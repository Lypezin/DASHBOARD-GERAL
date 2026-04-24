import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { Badge, LeaderboardEntry } from '@/types/gamification';
import { useGamificationCelebration } from '@/hooks/gamification/useGamificationCelebration';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';
import { useDeferredMount } from '@/hooks/ui/useDeferredMount';

export function useGamificationState() {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [unlockedBadges, setUnlockedBadges] = useState<Badge[]>([]);
    const [recentUnlock, setRecentUnlock] = useState<Badge | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const { triggerCelebration } = useGamificationCelebration();
    const { currentUser, isAuthenticated, hasResolved } = useAppBootstrap();
    const shouldBootstrapGamification = useDeferredMount({ timeoutMs: 1200 });
    const loginRegisteredRef = useRef<string | null>(null);

    const refreshLeaderboard = useCallback(async () => {
        const { data } = await supabase.rpc('get_gamification_leaderboard');
        if (data) setLeaderboard(data);
    }, []);

    const fetchState = useCallback(async () => {
        if (!currentUser?.id) return;

        await refreshLeaderboard();

        const [{ data: allBadges }, { data: unlocked }] = await Promise.all([
            supabase.from('gamification_badges').select('slug, name, description, icon, category'),
            supabase.from('gamification_user_badges').select('badge_slug, unlocked_at').eq('user_id', currentUser.id)
        ]);

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
    }, [currentUser?.id, refreshLeaderboard]);

    const registerInteraction = useCallback(async (type: 'login' | 'view_comparacao' | 'upload' | 'view_resumo' | 'view_entregadores' | 'view_evolucao' | 'filter_change') => {
        if (!currentUser?.id) return;

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
