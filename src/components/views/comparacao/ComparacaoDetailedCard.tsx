import React from 'react';
import { ComparacaoTabelaDetalhada } from './ComparacaoTabelaDetalhada';
import { ComparacaoCharts } from './ComparacaoCharts';
import { ViewModeToggle } from './components/ViewModeToggle';

interface ComparacaoDetailedCardProps {
    dadosComparacao: any[];
    semanasSelecionadas: any;
    viewMode: 'table' | 'chart';
    onViewModeChange: (mode: 'table' | 'chart') => void;
}

export const ComparacaoDetailedCard: React.FC<ComparacaoDetailedCardProps> = ({
    dadosComparacao,
    semanasSelecionadas,
    viewMode,
    onViewModeChange
}) => {
    return (
        <div className="glass-card rounded-2xl border-white/20 dark:border-slate-800/60 shadow-xl shadow-indigo-100/20 dark:shadow-slate-900/50 overflow-hidden transition-all duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50">
                <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-1.5 h-6 rounded-full bg-indigo-500/80"></span>
                    Análise Detalhada
                </h3>
                <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
            </div>
            {viewMode === 'table' ? (
                <ComparacaoTabelaDetalhada
                    dadosComparacao={dadosComparacao}
                    semanasSelecionadas={semanasSelecionadas}
                />
            ) : (
                <div className="p-5">
                    <ComparacaoCharts
                        dadosComparacao={dadosComparacao}
                        semanasSelecionadas={semanasSelecionadas}
                        viewMode={viewMode}
                        chartType="detalhada"
                    />
                </div>
            )}
        </div>
    );
};
