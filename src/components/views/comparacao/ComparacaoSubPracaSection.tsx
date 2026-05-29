import React from 'react';
import { DashboardResumoData } from '@/types';
import { ComparacaoCharts } from './ComparacaoCharts';
import { ComparacaoSubPracaTable } from './ComparacaoSubPracaTable';
import { ViewModeToggle } from './components/ViewModeToggle';

interface ComparacaoSubPracaSectionProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: string[];
    viewMode: 'table' | 'chart';
    onViewModeChange: (mode: 'table' | 'chart') => void;
}

export const ComparacaoSubPracaSection: React.FC<ComparacaoSubPracaSectionProps> = ({
    dadosComparacao,
    semanasSelecionadas,
    viewMode,
    onViewModeChange,
}) => {
    if (!dadosComparacao.some(d => (d.aderencia_sub_praca && d.aderencia_sub_praca.length > 0) || (d.sub_praca && d.sub_praca.length > 0))) {
        return null;
    }

    return (
        <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.36)] transition-[transform,box-shadow] duration-200 dark:border-slate-800/80 dark:bg-slate-950/76">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-6 py-5 dark:border-slate-800/70 sm:px-8">
                <h3 className="flex items-center gap-3 text-lg text-slate-900 dark:text-white">
                    <span className="h-5 w-1 rounded-full bg-sky-400/80 dark:bg-sky-300/70"></span>
                    <span className="font-semibold tracking-tight">Por sub-praca</span>
                </h3>
                <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} size="sm" />
            </div>
            {viewMode === 'table' ? (
                <ComparacaoSubPracaTable
                    dadosComparacao={dadosComparacao}
                    semanasSelecionadas={semanasSelecionadas}
                />
            ) : (
                <div className="p-5 sm:p-6">
                    <ComparacaoCharts
                        dadosComparacao={dadosComparacao}
                        semanasSelecionadas={semanasSelecionadas}
                        viewMode={viewMode}
                        chartType="subPraca"
                    />
                </div>
            )}
        </div>
    );
};
