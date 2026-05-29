import React from 'react';
import { DashboardResumoData } from '@/types';
import { ComparacaoCharts } from './ComparacaoCharts';
import { ComparacaoOrigemTable } from './ComparacaoOrigemTable';
import { ViewModeToggle } from './components/ViewModeToggle';

interface ComparacaoOrigemSectionProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: string[];
    viewMode: 'table' | 'chart';
    onViewModeChange: (mode: 'table' | 'chart') => void;
    origensDisponiveis: string[];
    totalColunasOrigem: number;
}

export const ComparacaoOrigemSection: React.FC<ComparacaoOrigemSectionProps> = ({
    dadosComparacao,
    semanasSelecionadas,
    viewMode,
    onViewModeChange,
    origensDisponiveis,
}) => {
    if (origensDisponiveis.length === 0) return null;

    return (
        <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.36)] transition-[transform,box-shadow] duration-200 dark:border-slate-800/80 dark:bg-slate-950/76">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-6 py-5 dark:border-slate-800/70 sm:px-8">
                <h3 className="flex items-center gap-3 text-lg text-slate-900 dark:text-white">
                    <span className="h-5 w-1 rounded-full bg-sky-400/80 dark:bg-sky-300/70"></span>
                    <span className="font-semibold tracking-tight">Por origem</span>
                </h3>
                <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} size="sm" />
            </div>
            {viewMode === 'table' ? (
                <ComparacaoOrigemTable
                    semanasSelecionadas={semanasSelecionadas}
                    dadosComparacao={dadosComparacao}
                />
            ) : (
                <div className="p-5 sm:p-6">
                    <ComparacaoCharts
                        dadosComparacao={dadosComparacao}
                        semanasSelecionadas={semanasSelecionadas}
                        viewMode={viewMode}
                        chartType="origem"
                        origensDisponiveis={origensDisponiveis}
                    />
                </div>
            )}
        </div>
    );
};
