import React from 'react';
import { MapPin, Send, CheckCircle2, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AtendenteCidadeData } from '@/types';
import { calcularMetaInfo, META_CUSTO } from '@/utils/resultados/metaCalculations';

interface CityMetricsListProps {
    cidades: AtendenteCidadeData[];
    atendenteNome: string;
}

export const CityMetricsList: React.FC<CityMetricsListProps> = ({ cidades, atendenteNome }) => {
    const activeCidades = cidades.filter(c => c.enviado > 0 || c.liberado > 0);

    if (activeCidades.length === 0) return null;

    return (
        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800">
                        <MapPin className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                    </div>
                    <h4 className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Por Cidade
                    </h4>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[9px] font-medium">
                        {activeCidades.length}
                    </Badge>
                </div>
                <ChevronDown className="h-3 w-3 text-slate-400" />
            </div>

            {/* Lista de cidades com fade */}
            <div className="relative flex-1 min-h-0">
                {/* Fade superior */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />

                <div className="space-y-2 overflow-y-auto pr-1 max-h-48 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 py-1">
                    {activeCidades.map((cidadeData) => {
                        const metaInfoCidade = calcularMetaInfo(
                            cidadeData.custoPorLiberado,
                            cidadeData.quantidadeLiberados,
                            cidadeData.valorTotal
                        );

                        const conversaoCidade = cidadeData.enviado > 0
                            ? (cidadeData.liberado / cidadeData.enviado) * 100
                            : 0;

                        return (
                            <div
                                key={`${atendenteNome}-${cidadeData.cidade}`}
                                className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 p-2.5 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors"
                            >
                                {/* Nome da cidade e mini barra */}
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[11px] font-semibold text-slate-800 dark:text-white truncate flex-1" title={cidadeData.cidade}>
                                        {cidadeData.cidade}
                                    </p>
                                    {metaInfoCidade?.jaAtingiuMeta && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                                            ✓ Meta
                                        </span>
                                    )}
                                </div>

                                {/* Mini barra de progresso */}
                                <div className="h-1 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-2">
                                    <div
                                        className={`h-full rounded-full transition-all ${conversaoCidade >= 50
                                                ? 'bg-emerald-500'
                                                : conversaoCidade >= 25
                                                    ? 'bg-amber-500'
                                                    : 'bg-rose-500'
                                            }`}
                                        style={{ width: `${Math.min(conversaoCidade, 100)}%` }}
                                    />
                                </div>

                                {/* Métricas em linha */}
                                <div className="flex flex-wrap gap-1.5">
                                    <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/30 px-1.5 py-0 h-auto">
                                        <Send className="h-2.5 w-2.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                                        <span className="text-[9px] font-medium text-emerald-700 dark:text-emerald-300 font-mono">
                                            {cidadeData.enviado.toLocaleString('pt-BR')}
                                        </span>
                                    </Badge>
                                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/30 px-1.5 py-0 h-auto">
                                        <CheckCircle2 className="h-2.5 w-2.5 mr-1 text-blue-600 dark:text-blue-400" />
                                        <span className="text-[9px] font-medium text-blue-700 dark:text-blue-300 font-mono">
                                            {cidadeData.liberado.toLocaleString('pt-BR')}
                                        </span>
                                    </Badge>
                                    {cidadeData.custoPorLiberado !== undefined && cidadeData.custoPorLiberado > 0 && (
                                        <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 px-1.5 py-0 h-auto">
                                            <span className="text-[9px] font-medium text-slate-600 dark:text-slate-400 font-mono">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cidadeData.custoPorLiberado)}
                                            </span>
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Fade inferior */}
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
            </div>
        </div>
    );
};
