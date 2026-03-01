import React from 'react';
import { DashboardResumoData } from '@/types';

export function getValorOrigem(
    dadosComparacao: DashboardResumoData[],
    idx: number,
    origem: string,
    campo: 'corridas_ofertadas' | 'corridas_aceitas' | 'corridas_rejeitadas' | 'corridas_completadas' | 'taxa_aceitacao' | 'aderencia_percentual'
): number {
    const dado = dadosComparacao[idx];
    if (!dado) return 0;
    const origemData = dado.aderencia_origem?.find((o) => o.origem === origem);
    if (!origemData) return 0;
    return origemData[campo] ?? 0;
}

export function formatVariation(a: number, b: number, isPercent = false): React.ReactNode {
    if (a === 0) return null;
    const diff = b - a;
    const pct = ((diff / a) * 100);
    const isPositive = diff >= 0;
    const sign = isPositive ? '+' : '';
    return (
        <span className={`text-xs font-medium tabular-nums ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {sign}{isPercent ? `${diff.toFixed(1)}pp` : `${pct.toFixed(1)}%`}
        </span>
    );
}

export interface MetricaRow {
    label: string;
    campo: 'corridas_ofertadas' | 'corridas_aceitas' | 'corridas_rejeitadas' | 'corridas_completadas' | 'taxa_aceitacao' | 'aderencia_percentual';
    format: (v: number) => string;
    isPercent?: boolean;
    invertColors?: boolean;
}

export const METRICAS: MetricaRow[] = [
    { label: 'Corridas Ofertadas', campo: 'corridas_ofertadas', format: (v) => v.toLocaleString('pt-BR') },
    { label: 'Corridas Aceitas', campo: 'corridas_aceitas', format: (v) => v.toLocaleString('pt-BR') },
    { label: 'Corridas Rejeitadas', campo: 'corridas_rejeitadas', format: (v) => v.toLocaleString('pt-BR'), invertColors: true },
    { label: 'Corridas Completadas', campo: 'corridas_completadas', format: (v) => v.toLocaleString('pt-BR') },
    { label: 'Taxa de Aceitação', campo: 'taxa_aceitacao', format: (v) => `${v.toFixed(1)}%`, isPercent: true },
    { label: 'Aderência', campo: 'aderencia_percentual', format: (v) => `${v.toFixed(1)}%`, isPercent: true },
];
