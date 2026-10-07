import { formatDuration } from '@/utils/formatters/timeUtils';
import { calculatePercentage } from '@/utils/formatHelpers';

interface MarketingTotals {
    segundos_ops: number;
    segundos_mkt: number;
    ofertadas_ops: number;
    ofertadas_mkt: number;
    aceitas_ops: number;
    aceitas_mkt: number;
    concluidas_ops: number;
    concluidas_mkt: number;
    rejeitadas_ops: number;
    rejeitadas_mkt: number;
    valor_ops: number;
    valor_mkt: number;
    entregadores_ops: number;
    entregadores_mkt: number;
}

export function MarketingPeriodSummary({ totals }: { totals: MarketingTotals }) {
    const formatNumber = (value: number) => value.toLocaleString('pt-BR');
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);

    const rows = [
        { label: 'Horas totais', ops: totals.segundos_ops, mkt: totals.segundos_mkt, format: formatDuration },
        { label: 'Ofertadas', ops: totals.ofertadas_ops, mkt: totals.ofertadas_mkt, format: formatNumber },
        { label: 'Aceitas', ops: totals.aceitas_ops, mkt: totals.aceitas_mkt, format: formatNumber },
        { label: 'Completadas', ops: totals.concluidas_ops, mkt: totals.concluidas_mkt, format: formatNumber },
        { label: 'Rejeitadas', ops: totals.rejeitadas_ops, mkt: totals.rejeitadas_mkt, format: formatNumber },
        { label: 'Entregadores', ops: totals.entregadores_ops, mkt: totals.entregadores_mkt, format: formatNumber },
        { label: 'Valor total', ops: totals.valor_ops || 0, mkt: totals.valor_mkt || 0, format: formatCurrency },
    ].map((row) => {
        const total = row.ops + row.mkt;
        return {
            ...row,
            totalLabel: row.format(total),
            opsLabel: row.format(row.ops),
            mktLabel: row.format(row.mkt),
            opsShare: calculatePercentage(row.ops, total),
            mktShare: calculatePercentage(row.mkt, total),
        };
    });

    return (
        <section aria-labelledby="marketing-period-summary-title" className="overflow-hidden rounded-xl border border-[#d8e4eb] bg-white shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800 dark:bg-slate-950/80">
            <header className="border-b border-[#e2ebf0] px-4 py-3.5 dark:border-slate-800 sm:px-5">
                <h2 id="marketing-period-summary-title" className="text-[15px] font-semibold tracking-tight text-[#183f58] dark:text-slate-100">Resumo do período</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Totais consolidados; percentuais mostram a participação de cada origem.</p>
            </header>

            <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
                {rows.map((row) => (
                    <article key={row.label} className="px-4 py-3.5">
                        <div className="flex items-baseline justify-between gap-3">
                            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">{row.label}</h3>
                            <p className="shrink-0 text-sm font-semibold tabular-nums text-[#183f58] dark:text-slate-100">
                                <span className="mr-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">Total</span>{row.totalLabel}
                            </p>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                            <div className="min-w-0">
                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Operacional</p>
                                <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 text-sm tabular-nums text-slate-700 dark:text-slate-300">
                                    <span>{row.opsLabel}</span><span className="text-xs text-slate-500 dark:text-slate-400">{row.opsShare}</span>
                                </p>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-medium text-[#38708e] dark:text-sky-300">Marketing</p>
                                <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 text-sm font-medium tabular-nums text-[#285d79] dark:text-sky-200">
                                    <span>{row.mktLabel}</span><span className="text-xs font-normal text-slate-500 dark:text-slate-400">{row.mktShare}</span>
                                </p>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            <div role="region" aria-label="Resumo consolidado do período" tabIndex={0} className="subtle-scrollbar hidden overflow-x-auto overscroll-x-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#38708e] md:block">
                <table className="w-full text-sm">
                    <caption className="sr-only">Resumo total e participação de Operacional e Marketing no período selecionado.</caption>
                    <thead className="border-b border-[#e2ebf0] bg-[#f6f9fb] dark:border-slate-800 dark:bg-slate-900/70">
                        <tr>
                            <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 sm:px-5">Indicador</th>
                            <th scope="col" className="px-4 py-2.5 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">Total</th>
                            <th scope="col" className="px-4 py-2.5 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">Operacional</th>
                            <th scope="col" className="px-4 py-2.5 pr-5 text-right text-xs font-semibold text-[#38708e] dark:text-sky-300">Marketing</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {rows.map((row) => (
                            <tr key={row.label} className="transition-colors duration-150 hover:bg-[#f8fbfc] dark:hover:bg-slate-900/60">
                                <th scope="row" className="px-4 py-2.5 text-left text-sm font-medium text-slate-700 dark:text-slate-200 sm:px-5">{row.label}</th>
                                <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold tabular-nums text-[#183f58] dark:text-slate-100">{row.totalLabel}</td>
                                <td className="whitespace-nowrap px-4 py-2.5 text-right text-slate-700 tabular-nums dark:text-slate-300">
                                    <span>{row.opsLabel}</span>
                                    <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">{row.opsShare}</span>
                                </td>
                                <td className="whitespace-nowrap px-4 py-2.5 pr-5 text-right font-medium text-[#285d79] tabular-nums dark:text-sky-200">
                                    <span>{row.mktLabel}</span>
                                    <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">{row.mktShare}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
