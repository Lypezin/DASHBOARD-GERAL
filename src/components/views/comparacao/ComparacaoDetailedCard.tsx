
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ViewToggleButton } from '../ViewToggleButton';
import { ComparacaoTabelaDetalhada } from './ComparacaoTabelaDetalhada';
import { ComparacaoCharts } from './ComparacaoCharts';
import { FileSpreadsheet, BarChart2 } from 'lucide-react';

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
        <Card className="relative overflow-hidden border-none shadow-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl ring-1 ring-slate-200/50 dark:ring-slate-800/50 transition-all duration-300 hover:shadow-2xl">
            {/* Decorative gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <CardHeader className="relative z-10 pb-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 ring-1 ring-white/20 dark:ring-white/10 group-hover:scale-105 transition-transform duration-300">
                            <FileSpreadsheet className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent tracking-tight">
                                Análise Detalhada
                            </CardTitle>
                            <CardDescription className="text-slate-500 dark:text-slate-400 font-medium font-sans">
                                Visão granular de todas as métricas por semana
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-xl ring-1 ring-slate-200/50 dark:ring-slate-700/50 backdrop-blur-md">
                        <button
                            onClick={() => onViewModeChange('table')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${viewMode === 'table'
                                ? 'bg-white dark:bg-slate-700 shadow-md text-slate-800 dark:text-white ring-1 ring-black/5 dark:ring-white/10'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                                }`}
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Tabela
                        </button>
                        <button
                            onClick={() => onViewModeChange('chart')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${viewMode === 'chart'
                                ? 'bg-white dark:bg-slate-700 shadow-md text-slate-800 dark:text-white ring-1 ring-black/5 dark:ring-white/10'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                                }`}
                        >
                            <BarChart2 className="w-4 h-4" />
                            Gráfico
                        </button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 p-0">
                {viewMode === 'table' ? (
                    <ComparacaoTabelaDetalhada
                        dadosComparacao={dadosComparacao}
                        semanasSelecionadas={semanasSelecionadas}
                    />
                ) : (
                    <div className="p-6">
                        <ComparacaoCharts
                            dadosComparacao={dadosComparacao}
                            semanasSelecionadas={semanasSelecionadas}
                            viewMode={viewMode}
                            chartType="detalhada"
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

