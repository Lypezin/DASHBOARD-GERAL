import React from 'react';
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
        : '—';

    return (
        <div className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
            {/* Conversion bar indicator */}
            <div className="flex shrink-0 flex-col items-center gap-1">
                <div className="h-8 w-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                        className={`w-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ height: `${Math.min(conversaoCidade, 100)}%`, marginTop: 'auto' }}
                    />
                </div>
            </div>

            {/* City name */}
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100" title={cidadeData.cidade}>
                    {cidadeData.cidade}
                </p>
                {metaInfoCidade?.jaAtingiuMeta && (
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        ✓ Meta
                    </span>
                )}
            </div>

            {/* Metrics inline */}
            <div className="flex items-center gap-4 shrink-0 text-right">
                <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-none mb-0.5">Env.</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 font-mono tabular-nums">
                        {cidadeData.enviado.toLocaleString('pt-BR')}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-none mb-0.5">Lib.</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 font-mono tabular-nums">
                        {cidadeData.liberado.toLocaleString('pt-BR')}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-none mb-0.5">CPL</p>
                    <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200 font-mono tabular-nums max-w-[80px]" title={custoPorLiberado}>
                        {custoPorLiberado}
                    </p>
                </div>
                <div className="w-10">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-none mb-0.5">Conv.</p>
                    <p className={`text-sm font-semibold font-mono tabular-nums ${
                        conversaoCidade >= 50 ? 'text-emerald-600 dark:text-emerald-400' :
                        conversaoCidade >= 25 ? 'text-amber-600 dark:text-amber-400' :
                        'text-rose-500 dark:text-rose-400'
                    }`}>
                        {conversaoCidade.toFixed(0)}%
                    </p>
                </div>
            </div>
        </div>
    );
});
