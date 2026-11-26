import React from 'react';
import { Trophy, User, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ICON_MAP } from '@/contexts/gamification/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface LeaderboardRankingRowProps { entry: any; index: number; }

export const LeaderboardRankingRow: React.FC<LeaderboardRankingRowProps> = ({ entry, index }) => {
    const [isTop1, isTop2, isTop3] = [index === 0, index === 1, index === 2];

    return (
        <div className={cn("relative flex flex-col p-3.5 rounded-xl border transition-[box-shadow,border-color] duration-200 hover:shadow-md", isTop1 ? "bg-gradient-to-br from-yellow-50 to-white border-yellow-200 dark:from-yellow-900/10 dark:to-slate-900 dark:border-yellow-500/30" : isTop2 ? "bg-gradient-to-br from-slate-50 to-white border-slate-300 dark:from-slate-800/50 dark:to-slate-900 dark:border-slate-600" : isTop3 ? "bg-gradient-to-br from-orange-50 to-white border-orange-200 dark:from-orange-900/10 dark:to-slate-900 dark:border-orange-500/30" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm")}>
            {isTop1 && (
                <div className="pointer-events-none absolute right-2.5 top-2 rotate-12" aria-hidden="true">
                    <span className="text-xl motion-safe:animate-pulse drop-shadow-sm">👑</span>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full font-bold text-sm shadow-sm", isTop1 ? "bg-yellow-400 text-yellow-900" : isTop2 ? "bg-slate-300 text-slate-800" : isTop3 ? "bg-orange-300 text-orange-900" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>#{entry.rank}</div>

                    <div className="flex items-center gap-3">
                        <Avatar className={cn("w-10 h-10 border-2", isTop1 ? "border-yellow-400 shadow-sm" : "border-slate-100 dark:border-slate-700")}>
                            <AvatarImage src={entry.avatar_url || undefined} alt={entry.user_name} className="object-cover" />
                            <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-400">
                                <User className="w-5 h-5" />
                            </AvatarFallback>
                        </Avatar>

                        <div>
                            <div className="flex items-center gap-2">
                                <p className={cn(
                                    "font-bold text-sm truncate max-w-[150px] sm:max-w-none",
                                    isTop1 ? "text-slate-900 dark:text-yellow-400" : "text-slate-700 dark:text-slate-200"
                                )}>
                                    {entry.user_name}
                                </p>
                                {entry.pracas && entry.pracas !== 'Sem Acesso' && (
                                    <span className="hidden sm:inline-flex text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200 dark:border-slate-700 truncate max-w-[100px]">
                                        {entry.pracas}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-xs mt-0.5">
                                <span className="flex items-center gap-1 text-orange-500 font-medium bg-orange-50 dark:bg-orange-900/20 px-1.5 rounded-full">
                                    <Flame className="w-3 h-3 fill-orange-500" />
                                    {entry.current_streak}
                                </span>
                                <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500 font-bold bg-yellow-50 dark:bg-yellow-900/20 px-1.5 rounded-full">
                                    <Trophy className="w-3 h-3" />
                                    {entry.total_badges}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mini Galeria de Conquistas - Compacta e Elegante */}
            {entry.badges_list && entry.badges_list.length > 0 && (
                <div className="mt-3 pl-[3.25rem] flex items-center gap-1.5 flex-wrap">
                    {entry.badges_list.slice(0, 10).map((b: any, i: number) => {
                        const BadgeIcon = ICON_MAP[b.icon] || ICON_MAP['Star'];
                        return (
                            <Tooltip key={i} delayDuration={150}>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        className={cn(
                                            "w-7 h-7 rounded-full flex items-center justify-center border transition-[transform,background-color,border-color,color] duration-150 hover:scale-110",
                                            "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400",
                                            "hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:border-yellow-200 dark:hover:border-yellow-500/50 hover:text-yellow-600 dark:hover:text-yellow-400"
                                        )}
                                        aria-label={b.name}
                                    >
                                        <BadgeIcon className="w-3.5 h-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[180px] border-white/10 bg-slate-900/95 px-2.5 py-1.5 text-center text-[11px] text-white">
                                    <span className="block font-semibold text-yellow-400">{b.name}</span>
                                    {b.description && <span className="mt-0.5 block text-[10px] leading-tight opacity-85">{b.description}</span>}
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                    {entry.badges_list.length > 10 && (
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                            <span className="text-[9px] font-bold text-slate-500">+{entry.badges_list.length - 10}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
