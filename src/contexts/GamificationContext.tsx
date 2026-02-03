'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { LucideIcon, Trophy, Flame, User, Search, BarChart3, Upload, Database, Star } from 'lucide-react';

// Map icons from string to component
export const ICON_MAP: Record<string, LucideIcon> = {
    'Trophy': Trophy,
    'Flame': Flame,
    'User': User,
    'Search': Search,
    'BarChart3': BarChart3,
    'Upload': Upload,
    'Database': Database,
    'Star': Star
};

export interface Badge {
    slug: string;
    name: string;
    description: string;
    icon: string;
    unlocked_at?: string;
    category?: string;
}

interface GamificationContextType {
    badges: Badge[];
    unlockedBadges: Badge[];
    recentUnlock: Badge | null;
    registerInteraction: (type: 'login' | 'view_comparacao' | 'upload') => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [unlockedBadges, setUnlockedBadges] = useState<Badge[]>([]);
    const [recentUnlock, setRecentUnlock] = useState<Badge | null>(null);

    // Fetch initial state
    const fetchState = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

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
    }, []);

    // Register interaction
    const registerInteraction = useCallback(async (type: 'login' | 'view_comparacao' | 'upload') => {
        try {
            const { data, error } = await supabase.rpc('register_interaction', { p_interaction_type: type });

            if (error) {
                console.error('Error registering interaction:', error);
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
            console.error('Gamification error:', e);
        }
    }, []);

    const triggerCelebration = (badge: Badge) => {
        // 1. Confetti
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FF4500'] // Gold colors
        });

        // 2. Toast
        toast.custom((t) => (
            <div className="bg-white dark:bg-slate-900 border-2 border-yellow-400 rounded-lg p-4 shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-5 z-[9999]">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-full">
                    <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Conquista Desbloqueada!</h3>
                    <p className="font-semibold text-yellow-600 dark:text-yellow-400 text-sm">{badge.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">{badge.description}</p>
                </div>
            </div>
        ), { duration: 5000 });
    };

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
        <GamificationContext.Provider value={{ badges, unlockedBadges, recentUnlock, registerInteraction }}>
            {children}
        </GamificationContext.Provider>
    );
}

export function useGamification() {
    const context = useContext(GamificationContext);
    if (!context) throw new Error('useGamification must be used within GamificationProvider');
    return context;
}
