import React from 'react';
import { Send, CheckCircle2, Wallet } from 'lucide-react';
import { AtendenteCidadeData } from '@/types';
import { calcularMetaInfo } from '@/utils/resultados/metaCalculations';

interface CityMetricItemProps {
    cidadeData: AtendenteCidadeData;
    atendenteNome: string;
}

export const CityMetricItem = React.memo(function CityMetricItem({ cidadeData }: CityMetricItemProps) {
    const metaInfoCidade = calcularMetaInfo(
        cidadeData.custoPorLiberado,
        cidadeData.quantidadeLiberados,
        cidadeData.valorTotal
    );

    const conversaoCidade = cidadeData.enviado > 0
        ? (cidadeData.liberado / cidadeData.enviado) * 100
        : 0;

    const barColor = conversaoCidade >= 50
        ? 'bg-emerald-500'
        : conversaoCidade >= 25
            ? 'bg-amber-500'
            : 'bg-rose-400';

    const custoPorLiberado = cidadeData.custoPorLiberado !== undefined && cidadeData.custoPorLiberado > 0
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cidadeData.custoPorLiberado)
        : '-';

    return (
        <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 dark:border-slate-800 dark:bg-slate-800/30 transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-800/50">
            {/* City name + conversion */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <p className="truncate text-xs font-semibold text-slate-800 dark:text-white" title={cidadeData.cidade}>
                    {cidadeData.cidade}
                </p>
                <span className="shrink-0 text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                    {conversaoCidade.toFixed(1)}%
                </span>
            </div>

            {/* Progress bar */}
            <div className="mb-2.5 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(conversaoCidade, 100)}%` }}
                />
            </div>

            {/* Metric row */}
            <div className="grid grid-cols-3 gap-1.5">
                <div className="rounded-md bg-white dark:bg-slate-900/60 px-2 py-1.5 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                        <Send className="h-2.5 w-2.5" />
                        Env.
                    </div>
                    <p className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
                        {cidadeData.enviado.toLocaleString('pt-BR')}
                    </p>
                </div>

                <div className="rounded-md bg-white dark:bg-slate-900/60 px-2 py-1.5 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                        <CheckCircle2 className="h-2.5 w-2.5 text-blue-500/70 dark:text-blue-400/70" />
                        Lib.
                    </div>
                    <p className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
                        {cidadeData.liberado.toLocaleString('pt-BR')}
                    </p>
                </div>

                <div className="rounded-md bg-white dark:bg-slate-900/60 px-2 py-1.5 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                        <Wallet className="h-2.5 w-2.5" />
                        CPL
                    </div>
                    <p className="truncate font-mono text-xs font-semibold text-slate-800 dark:text-slate-100 tabular-nums" title={custoPorLiberado}>
                        {custoPorLiberado}
                    </p>
                </div>
            </div>

            {metaInfoCidade?.jaAtingiuMeta && (
                <div className="mt-2 flex justify-end">
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/30">
                        Meta atingida
                    </span>
                </div>
            )}
        </div>
    );
});
