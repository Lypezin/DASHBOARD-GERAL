import { useMemo } from 'react';
import { AderenciaDiaOrigem } from '@/types';

export const DIAS_ORDEM = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado', 'Domingo'];

const DIA_CANONICO: Record<string, string> = {
    segunda: 'Segunda',
    terca: 'Terca',
    terça: 'Terca',
    quarta: 'Quarta',
    quinta: 'Quinta',
    sexta: 'Sexta',
    sabado: 'Sabado',
    sábado: 'Sabado',
    domingo: 'Domingo',
};

function normalizeDia(value: string) {
    const base = value.split('-')[0].trim().toLowerCase();
    const ascii = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return DIA_CANONICO[base] || DIA_CANONICO[ascii] || value;
}

export function useDiaOrigemMatrix(data: AderenciaDiaOrigem[]) {
    const matrix = useMemo(() => {
        const origensMap = new Map<string, Map<string, number>>();
        const origensSet = new Set<string>();
        let maxVolume = 0;

        if (Array.isArray(data) && data.length > 0) {
            data.forEach(item => {
                const itemAny = item as any;
                const dia = normalizeDia(String(itemAny.dia || itemAny.dia_da_semana || itemAny.dia_semana || itemAny.data || ''));
                const origem = String(itemAny.origem || itemAny.nome_origem || 'N/D');
                const segundos = Number(itemAny.segundos_realizados || itemAny.horas_entregues_segundos || 0);

                if (origem && DIAS_ORDEM.includes(dia)) {
                    origensSet.add(origem);
                    if (!origensMap.has(origem)) {
                        origensMap.set(origem, new Map());
                    }
                    const diaMap = origensMap.get(origem)!;
                    const novoTotal = (diaMap.get(dia) || 0) + segundos;
                    diaMap.set(dia, novoTotal);

                    if (novoTotal > maxVolume) maxVolume = novoTotal;
                }
            });
        }

        const sortedOrigens = Array.from(origensSet).sort();
        return { origens: sortedOrigens, dataMap: origensMap, maxVolume };
    }, [data]);

    const columnTotals = useMemo(() => {
        const totals = new Map<string, number>();
        DIAS_ORDEM.forEach(dia => {
            let sum = 0;
            matrix.origens.forEach(origem => {
                sum += matrix.dataMap.get(origem)?.get(dia) || 0;
            });
            totals.set(dia, sum);
        });
        return totals;
    }, [matrix]);

    const globalTotal = useMemo(() => {
        return Array.from(columnTotals.values()).reduce((a, b) => a + b, 0);
    }, [columnTotals]);

    const getHeatmapClass = (segundos: number) => {
        if (segundos === 0 || matrix.maxVolume === 0) return '';
        const intensity = segundos / matrix.maxVolume;

        if (intensity > 0.8) return 'bg-blue-600/90 text-white dark:bg-blue-500/90';
        if (intensity > 0.6) return 'bg-blue-500/70 text-white dark:bg-blue-500/70';
        if (intensity > 0.4) return 'bg-blue-400/50 text-slate-900 dark:text-white dark:bg-blue-500/50';
        if (intensity > 0.2) return 'bg-blue-300/30 text-slate-800 dark:text-slate-100 dark:bg-blue-500/30';
        return 'bg-blue-100/40 text-slate-700 dark:text-slate-300 dark:bg-blue-500/10';
    };

    return {
        matrix,
        columnTotals,
        globalTotal,
        getHeatmapClass
    };
}
