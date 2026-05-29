'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Flame } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { safeLog } from '@/lib/errorHandler';
import { postAppApiData } from '@/utils/app/fetchAppApi';

interface LoginStreakBadgeProps {
    className?: string;
}

export const LoginStreakBadge = React.memo(function LoginStreakBadge({ className = '' }: LoginStreakBadgeProps) {
    const [streak, setStreak] = useState<{ current: number; longest: number } | null>(null);

    const updateStreak = useCallback(async () => {
        try {
            const { data, error } = await postAppApiData<{ current_streak?: number; longest_streak?: number }>('/api/app/login-streak');
            if (error) {
                safeLog.error('Error updating login streak:', error);
                return;
            }

            if (data) {
                setStreak({
                    current: data.current_streak || 0,
                    longest: data.longest_streak || 0,
                });
            }
        } catch (err: unknown) {
            safeLog.error('Failed to update login streak:', err instanceof Error ? err.message : 'Unknown error');
        }
    }, []);

    useEffect(() => {
        void updateStreak();
    }, [updateStreak]);

    if (!streak || streak.current === 0) return null;

    const getFlameColor = () => {
        if (streak.current >= 30) return 'text-purple-500';
        if (streak.current >= 14) return 'text-orange-500';
        if (streak.current >= 7) return 'text-amber-500';
        return 'text-slate-400';
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button className={`flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 ${className}`}>
                    <Flame className={`h-3.5 w-3.5 ${getFlameColor()}`} />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{streak.current}</span>
                </button>
            </TooltipTrigger>
            <TooltipContent>
                <p className="font-medium">Sequencia de {streak.current} dia{streak.current > 1 ? 's' : ''}</p>
                <p className="text-xs text-muted-foreground">Recorde: {streak.longest} dias consecutivos</p>
            </TooltipContent>
        </Tooltip>
    );
});
