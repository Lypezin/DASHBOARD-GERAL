import React from 'react';
import { Badge } from '@/types/gamification';
import { cn } from '@/lib/utils';
import { ICON_MAP } from '@/contexts/gamification/icons';

interface BadgeCardProps {
    badge: Badge;
    isUnlocked: boolean;
    unlockedAt?: string;
}

export const BadgeCard = ({ badge, isUnlocked, unlockedAt }: BadgeCardProps) => {
    const IconComponent = ICON_MAP[badge.icon] || ICON_MAP['Star'];

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 relative group",
                isUnlocked
                    ? "border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-500/50"
                    : "border-slate-200 bg-slate-50 opacity-60 grayscale dark:border-slate-800 dark:bg-slate-900/50"
            )}
        >
            <div className={cn(
                "p-3 rounded-full mb-3 transition-transform group-hover:scale-110",
                isUnlocked ? "bg-gradient-to-br from-yellow-300 to-yellow-500 text-white shadow-lg shadow-yellow-500/20" : "bg-slate-200 dark:bg-slate-700 text-slate-400"
            )}>
                <IconComponent className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-center mb-1 text-slate-900 dark:text-slate-100">{badge.name}</h4>
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 line-clamp-2">{badge.description}</p>

            {isUnlocked && unlockedAt && (
                <span className="absolute top-2 right-2 text-[10px] font-mono text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded-full">
                    {new Date(unlockedAt).toLocaleDateString()}
                </span>
            )}
        </div>
    );
};
