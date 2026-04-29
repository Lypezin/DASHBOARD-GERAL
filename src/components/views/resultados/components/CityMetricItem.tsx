import React from 'react';
import { Send, CheckCircle2, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

    const conversionTone = conversaoCidade >= 50
        ? 'bg-emerald-500'
        : conversaoCidade >= 25
            ? 'bg-amber-500'
            : 'bg-rose-500';

    const custoPorLiberado = cidadeData.custoPorLiberado !== undefined && cidadeData.custoPorLiberado > 0
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cidadeData.custoPorLiberado)
        : '-';

    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 transition-colors hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800/80">
            <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800 dark:text-white" title={cidadeData.cidade}>
                        {cidadeData.cidade}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                        Conversão {conversaoCidade.toFixed(1)}%
                    </p>
                </div>

                <Badge
                    variant="outline"
                    className="shrink-0 border-slate-200 bg-white px-1.5 py-0 text-[9px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                    {cidadeData.liberado.toLocaleString('pt-BR')} lib.
                </Badge>
            </div>

            <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                    className={`h-full rounded-full transition-all ${conversionTone}`}
                    style={{ width: `${Math.min(conversaoCidade, 100)}%` }}
                />
            </div>

            <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900/80">
                    <div className="mb-1 flex items-center gap-1 text-[9px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        <Send className="h-2.5 w-2.5" />
                        Env.
                    </div>
                    <p className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {cidadeData.enviado.toLocaleString('pt-BR')}
                    </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900/80">
                    <div className="mb-1 flex items-center gap-1 text-[9px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        <CheckCircle2 className="h-2.5 w-2.5 text-blue-500 dark:text-blue-400" />
                        Lib.
                    </div>
                    <p className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {cidadeData.liberado.toLocaleString('pt-BR')}
                    </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900/80">
                    <div className="mb-1 flex items-center gap-1 text-[9px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        <Wallet className="h-2.5 w-2.5" />
                        CPL
                    </div>
                    <p className="truncate font-mono text-sm font-semibold text-slate-800 dark:text-slate-100" title={custoPorLiberado}>
                        {custoPorLiberado}
                    </p>
                </div>
            </div>

            {metaInfoCidade?.jaAtingiuMeta && (
                <div className="mt-2 flex justify-end">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        Meta atingida
                    </span>
                </div>
            )}
        </div>
    );
});
