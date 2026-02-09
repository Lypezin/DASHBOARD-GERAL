import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { Trophy } from 'lucide-react';
import React from 'react';
import { Badge } from '@/types/gamification';

export const useGamificationCelebration = () => {
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

    return { triggerCelebration };
};
