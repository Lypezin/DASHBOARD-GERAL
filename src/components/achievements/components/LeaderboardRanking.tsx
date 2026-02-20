import React from 'react';
import { Trophy } from 'lucide-react';
import { useGamification } from '@/contexts/GamificationContext';
import { LeaderboardRankingRow } from './LeaderboardRankingRow';

export const LeaderboardRanking = () => {
    const { leaderboard } = useGamification();

    return (
        <div className="space-y-4 p-1">
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-3 text-white flex items-center justify-between shadow-md mb-2">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                        <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-tight">Quadro de Líderes</h3>
                        <p className="text-xs opacity-90 font-medium">Top usuários engajados</p>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-medium">
                        Atualizado em tempo real
                    </span>
                </div>
            </div>

            <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                    <LeaderboardRankingRow key={index} entry={entry} index={index} />
                ))}

                {leaderboard.length === 0 && (
                    <div className="text-center p-8 text-slate-400">
                        Nenhum dado de ranking disponível ainda.
                    </div>
                )}
            </div>
        </div>
    );
};
