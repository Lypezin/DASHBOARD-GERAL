
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2 } from 'lucide-react';
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
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 lg:p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <BarChart2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                            Comparação Detalhada de Métricas
                        </CardTitle>
                    </div>
                    <div className="flex gap-2">
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
            </CardHeader>
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
