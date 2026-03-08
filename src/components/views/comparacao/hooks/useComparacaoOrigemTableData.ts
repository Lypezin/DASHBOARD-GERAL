import { useMemo } from 'react';
import { DashboardResumoData } from '@/types';

export function useComparacaoOrigemTableData(dadosComparacao: DashboardResumoData[]) {
    return useMemo(() => {
        const todasOrigens = new Set<string>();
        dadosComparacao.forEach((d) => {
            if (d.aderencia_origem && Array.isArray(d.aderencia_origem)) {
                d.aderencia_origem.forEach((item) => {
                    todasOrigens.add(item.origem);
                });
            }
        });
        const origensOrdenadas = Array.from(todasOrigens).sort();

        const dadosPorOrigem: Record<string, Record<number, number>> = {};
        const mediaPorSemana: Record<number, number> = {};

        // Calculate data per origin
        origensOrdenadas.forEach((origem) => {
            dadosPorOrigem[origem] = {};
            dadosComparacao.forEach((dado, idx) => {
                const origemData = dado.aderencia_origem?.find((x) => x.origem === origem);
                dadosPorOrigem[origem][idx] = origemData ? origemData.aderencia_percentual : 0;
            });
        });

        // Calculate average per week
        dadosComparacao.forEach((dado, idx) => {
            const ativas = dado.aderencia_origem?.filter(x => x && x.origem && x.aderencia_percentual > 0) || [];
            if (ativas.length > 0) {
                const soma = ativas.reduce((acc, curr) => acc + curr.aderencia_percentual, 0);
                mediaPorSemana[idx] = soma / ativas.length;
            } else {
                mediaPorSemana[idx] = 0;
            }
        });

        // Add "MÉDIA DAS ORIGENS"
        if (origensOrdenadas.length > 0) {
            dadosPorOrigem['MÉDIA DAS ORIGENS'] = mediaPorSemana;
        }

        return { origensOrdenadas, dadosPorOrigem };
    }, [dadosComparacao]);
}
