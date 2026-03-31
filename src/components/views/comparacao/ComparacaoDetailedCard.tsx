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
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden transition-all duration-300">
            <div className="flex items-center justify-between px-8 py-6 border-b border-transparent">
                <h3 className="text-lg text-slate-900 dark:text-white flex items-center gap-3">
                    <span className="w-1 h-5 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                    <span className="font-semibold tracking-tight">Análise Detalhada</span>
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
