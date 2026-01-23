
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ViewToggleButton } from '../ViewToggleButton';
import { ComparacaoTabelaDetalhada } from './ComparacaoTabelaDetalhada';
import { ComparacaoCharts } from './ComparacaoCharts';
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
        <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/60">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                        <div className="h-6 w-1 rounded-full bg-blue-500" />
                        Análise Detalhada
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 pl-3">
                        Visão granular de todas as métricas por semana
                    </p>
                </div>

                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <ViewToggleButton
                        active={viewMode === 'table'}
                        onClick={() => onViewModeChange('table')}
                        label="Tabela"
                    />
                    <ViewToggleButton
                        active={viewMode === 'chart'}
                        onClick={() => onViewModeChange('chart')}
                        label="Gráfico"
                    />
                </div>
            </div>
            <CardContent className="p-0">
                {viewMode === 'table' ? (
                    <ComparacaoTabelaDetalhada
                        dadosComparacao={dadosComparacao}
                        semanasSelecionadas={semanasSelecionadas}
                    />
                ) : (
                    <ComparacaoCharts
                        dadosComparacao={dadosComparacao}
                        semanasSelecionadas={semanasSelecionadas}
                        viewMode={viewMode}
                        chartType="detalhada"
                    />
                )}
            </CardContent>
        </Card>
    );
};
