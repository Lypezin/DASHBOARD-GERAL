import React from 'react';
import { Globe } from 'lucide-react';
import { VariacaoBadge } from '@/components/VariacaoBadge';
import { calcularVariacaoPercentual } from '@/utils/comparacaoCalculations';
import { METRICAS_ORIGEM } from '@/constants/comparacao';
import { DashboardResumoData } from '@/types';

interface ComparacaoOrigemTableProps {
    semanasSelecionadas: string[];
    origensDisponiveis: string[];
    totalColunasOrigem: number;
    dadosComparacao: DashboardResumoData[];
}

export const ComparacaoOrigemTable: React.FC<ComparacaoOrigemTableProps> = ({
    semanasSelecionadas,
    origensDisponiveis,
    totalColunasOrigem,
    dadosComparacao,
}) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th rowSpan={2} className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 align-middle">
                            Origem / Métrica
                        </th>
                        {semanasSelecionadas.map((semana, idx) => (
                            <th
                                key={`origem-head-${semana}`}
                                colSpan={idx === 0 ? 1 : 2}
                                className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700"
                            >
                                Semana {semana}
                            </th>
                        ))}
                    </tr>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                        {semanasSelecionadas.map((semana, idx) =>
                            idx === 0 ? (
                                <th
                                    key={`origem-sub-${semana}-valor`}
                                    className="px-6 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700"
                                >
                                    Valor
                                </th>
                            ) : (
                                <React.Fragment key={`origem-sub-${semana}`}>
                                    <th className="px-6 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700">
                                        Valor
                                    </th>
                                    <th className="px-6 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Δ%
                                    </th>
                                </React.Fragment>
                            )
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {origensDisponiveis.map((origem) => {
                        const origemLabel = origem || 'N/D';
                        return (
                            <React.Fragment key={origemLabel}>
                                <tr className="bg-fuchsia-50/50 dark:bg-fuchsia-900/10">
                                    <td colSpan={totalColunasOrigem + 1} className="px-6 py-3 font-semibold text-fuchsia-900 dark:text-fuchsia-100 flex items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        {origemLabel}
                                    </td>
                                </tr>
                                {METRICAS_ORIGEM.map((metrica) => (
                                    <tr
                                        key={`${origemLabel}-${metrica.key}`}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{metrica.icon}</span>
                                                {metrica.label}
                                            </div>
                                        </td>
                                        {dadosComparacao.map((dados, idx) => {
                                            const origemAtual =
                                                (dados.aderencia_origem || dados.origem)?.find((item) => (item.origem || '').trim() === origem) || ({} as any);
                                            const valorAtual = Number(
                                                origemAtual?.[metrica.key as keyof typeof origemAtual] ?? 0
                                            );
                                            let variacao: number | null = null;
                                            if (idx > 0) {
                                                const dadosAnterior = dadosComparacao[idx - 1];
                                                const origemAnterior =
                                                    (dadosAnterior.aderencia_origem || dadosAnterior.origem)?.find((item) => (item.origem || '').trim() === origem) ||
                                                    ({} as any);
                                                const valorAnterior = Number(
                                                    origemAnterior?.[metrica.key as keyof typeof origemAnterior] ?? 0
                                                );
                                                variacao = calcularVariacaoPercentual(valorAnterior, valorAtual);
                                            }
                                            const valorFormatado =
                                                metrica.tipo === 'percent'
                                                    ? `${valorAtual.toFixed(1)}%`
                                                    : valorAtual.toLocaleString('pt-BR');
                                            return (
                                                <React.Fragment key={`${idx}-${metrica.key}`}>
                                                    <td className="px-6 py-4 text-center text-sm text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700">
                                                        {valorFormatado}
                                                    </td>
                                                    {idx > 0 && (
                                                        <td className="px-4 py-4 text-center">
                                                            <VariacaoBadge
                                                                variacao={Number.isFinite(variacao ?? 0) ? (variacao ?? 0) : 0}
                                                                className="px-2 py-0.5 text-xs"
                                                                invertColors={Boolean(metrica.invertColors)}
                                                            />
                                                        </td>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
