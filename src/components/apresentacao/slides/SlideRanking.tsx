import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { SlideHeader } from './components/SlideHeader';
import { useAnimatedProgress } from '@/hooks/ui/useAnimatedProgress';

interface RankingItem {
    nome: string;
    aderencia: number;
    horasEntregues: string;
}

interface SlideRankingProps {
    isVisible: boolean;
    itens: RankingItem[];
}

const PodiumStep: React.FC<{ item: RankingItem; position: 1 | 2 | 3; isActive: boolean }> = ({ item, position, isActive }) => {
    const height = position === 1 ? 'h-64' : position === 2 ? 'h-48' : 'h-32';
    const color = position === 1
        ? 'bg-gradient-to-t from-amber-500 to-yellow-400 dark:from-amber-600 dark:to-yellow-500 shadow-lg shadow-yellow-500/10'
        : position === 2
        ? 'bg-gradient-to-t from-slate-400 to-slate-300 dark:from-slate-500 dark:to-slate-400 shadow-lg shadow-slate-400/10'
        : 'bg-gradient-to-t from-amber-800 to-amber-600 dark:from-amber-900 dark:to-amber-700 shadow-lg shadow-amber-800/10';
    const delay = position === 1 ? 'delay-500' : position === 2 ? 'delay-200' : 'delay-300';

    // Animate score from 0
    const animatedScore = useAnimatedProgress(item.aderencia, 1500, 500, isActive);

    return (
        <div className={`flex flex-col items-center justify-end ${isActive ? 'animate-slide-up' : 'opacity-0'} ${delay}`}>
            {/* Avatar / Icon Badge */}
            <div className={`mb-4 rounded-full flex items-center justify-center shadow-lg font-black text-white ${
                position === 1
                    ? 'w-24 h-24 text-3xl bg-gradient-to-br from-yellow-300 to-amber-500 ring-4 ring-yellow-200 dark:ring-yellow-500/20'
                    : position === 2
                    ? 'w-20 h-20 text-2xl bg-gradient-to-br from-slate-200 to-slate-400 ring-4 ring-slate-100 dark:ring-slate-400/20'
                    : 'w-20 h-20 text-2xl bg-gradient-to-br from-amber-500 to-amber-700 ring-4 ring-amber-200 dark:ring-amber-700/20'
            }`}>
                {position}º
            </div>

            {/* Name */}
            <div className="text-center mb-3 px-2">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-tight leading-tight max-w-[150px] mx-auto">
                    {item.nome}
                </h3>
            </div>

            {/* Bar */}
            <div className={`w-32 rounded-t-xl flex flex-col items-center justify-end pb-4 transition-all duration-1000 ${height} ${color}`}>
                <span className="text-white font-black text-2xl drop-shadow-md">
                    {animatedScore.toFixed(1)}%
                </span>
                <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider mt-0.5">Aderência</span>
            </div>
        </div>
    );
};

const SlideRanking: React.FC<SlideRankingProps> = ({ isVisible, itens }) => {
    // Sort and take top 3
    const top3 = [...itens]
        .sort((a, b) => b.aderencia - a.aderencia)
        .slice(0, 3);

    // Remap for podium visual order: 2nd, 1st, 3rd
    const podiumOrder = [
        { data: top3[1], pos: 2 },
        { data: top3[0], pos: 1 },
        { data: top3[2], pos: 3 },
    ].filter(p => p.data); // Safety check if less than 3 items

    return (
        <SlideWrapper isVisible={isVisible} style={{ padding: '32px' }}>
            <SlideHeader
                title="DESTAQUES DA SEMANA"
                subTitle="Ranking de Eficiência Operacional"
            />

            <div className="flex-1 flex items-end justify-center gap-4 pb-12 relative">
                {/* Confetti Background (Conceptual CSS) */}
                {isVisible && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {/* Dots can be added here with CSS if needed */}
                    </div>
                )}

                {podiumOrder.map((entry) => (
                    <PodiumStep
                        key={entry.data.nome}
                        item={entry.data as RankingItem}
                        position={entry.pos as 1 | 2 | 3}
                        isActive={isVisible}
                    />
                ))}

                {top3.length === 0 && (
                    <p className="text-slate-400">Dados insuficientes para ranking.</p>
                )}
            </div>
        </SlideWrapper>
    );
};

export default SlideRanking;
