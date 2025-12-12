import React from 'react';
import { DashboardResumoData, FilterOption } from '@/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { VariacaoBadge } from '@/components/VariacaoBadge';
import { MapPin } from 'lucide-react';

interface ComparacaoOrigemTableProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: (number | string)[];
    origensDisponiveis: { value: string; label: string }[];
}

export const ComparacaoOrigemTable: React.FC<ComparacaoOrigemTableProps> = ({
    dadosComparacao,
    semanasSelecionadas,
    origensDisponiveis,
}) => {
    // Helpers para processar dados por origem
    const dadosPorOrigem: Record<string, Record<number, number>> = {};

    origensDisponiveis.forEach(origem => {
        dadosPorOrigem[origem.value] = {};
        dadosComparacao.forEach((dado, idx) => {
            const origemData = dado.aderencia_origem.find(d => d.origem === origem.value);
            dadosPorOrigem[origem.value][idx] = origemData ? origemData.aderencia_percentual : 0;
        });
    });

    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-purple-500" />
                    <div>
                        <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                            Detalhamento por Origem
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Performance comparativa por origem de tráfego
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
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
                </tbody >
            </table >
        </div >
    );
};
