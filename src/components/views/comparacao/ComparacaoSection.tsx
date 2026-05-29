import React from 'react';
import { DashboardResumoData } from '@/types';
import { ComparacaoCharts } from './ComparacaoCharts';
import { ComparacaoDiaTable } from './components/ComparacaoDiaTable';
import { ViewModeToggle } from './components/ViewModeToggle';

interface ComparacaoSectionProps {
    title: string;
    icon: React.ReactNode;
    description: string;
    type: 'dia' | 'subPraca' | 'origem';
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: string[];
    viewMode: 'table' | 'chart';
    onViewModeChange: (mode: 'table' | 'chart') => void;
    origensDisponiveis?: string[];
    totalColunasOrigem?: number;
}

export const ComparacaoSection: React.FC<ComparacaoSectionProps> = ({
    title,
    type,
    dadosComparacao,
    semanasSelecionadas,
    viewMode,
    onViewModeChange,
}) => {
    if (type === 'dia') {
        return (
            <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.36)] transition-[border-color,box-shadow,background-color] duration-200 dark:border-slate-800/80 dark:bg-slate-950/76">
                <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-5 dark:border-slate-800/70 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div className="min-w-0">
                        <h3 className="flex items-center gap-3 text-lg tracking-tight text-slate-900 dark:text-white">
                            <span className="h-5 w-1 rounded-full bg-sky-400/80 dark:bg-sky-300/70" />
                            <span className="font-semibold">{title}</span>
                        </h3>
                    </div>
                    <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} size="sm" />
                </div>

                {viewMode === 'table' ? (
                    <ComparacaoDiaTable
                        semanasSelecionadas={semanasSelecionadas}
                        dadosComparacao={dadosComparacao}
                    />
                ) : (
                    <div className="p-4 sm:p-5">
                        <ComparacaoCharts
                            dadosComparacao={dadosComparacao}
                            semanasSelecionadas={semanasSelecionadas}
                            viewMode={viewMode}
                            chartType="dia"
                        />
                    </div>
                )}
            </div>
        );
    }

    return null;
};
