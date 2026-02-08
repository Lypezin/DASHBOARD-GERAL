import React from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AtendenteCidadeData } from '@/types';
import { calcularMetaInfo } from '@/utils/resultados/metaCalculations';

interface CityMetricItemProps {
    cidadeData: AtendenteCidadeData;
    atendenteNome: string;
}

export const CityMetricItem = React.memo(function CityMetricItem({ cidadeData, atendenteNome }: CityMetricItemProps) {
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
});
