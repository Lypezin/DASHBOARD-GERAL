/**
 * Hook para calcular taxas de análise
 * Extraído de src/components/views/AnaliseView.tsx
 */

import { useMemo } from 'react';

export interface AnaliseItem {
  corridas_ofertadas?: number | null;
  corridas_aceitas?: number | null;
  corridas_rejeitadas?: number | null;
  corridas_completadas?: number | null;
  horas_entregues?: string | null;
}

export interface TaxasCalculadas {
  taxaAceitacao: number;
  taxaRejeicao: number;
  taxaCompletude: number;
}

/**
 * Calcula as taxas para um item de análise
 */
export function calcularTaxas(item: AnaliseItem): TaxasCalculadas {
  const ofertadas = item.corridas_ofertadas || 0;
  const aceitas = item.corridas_aceitas || 0;
  const rejeitadas = item.corridas_rejeitadas || 0;
  const completadas = item.corridas_completadas || 0;

  const taxaAceitacao = ofertadas > 0 ? (aceitas / ofertadas) * 100 : 0;
  const taxaRejeicao = ofertadas > 0 ? (rejeitadas / ofertadas) * 100 : 0;
  const taxaCompletude = aceitas > 0 ? (completadas / aceitas) * 100 : 0;

  return {
    taxaAceitacao,
    taxaRejeicao,
    taxaCompletude,
  };
}

/**
 * Hook para calcular taxas totais
 */
export function useAnaliseTaxas(totals: {
  ofertadas: number;
  aceitas: number;
  rejeitadas: number;
  completadas: number;
}) {
  return useMemo(() => {
    const taxaAceitacao = totals.ofertadas > 0 ? (totals.aceitas / totals.ofertadas) * 100 : 0;
    const taxaCompletude = totals.aceitas > 0 ? (totals.completadas / totals.aceitas) * 100 : 0;
    const taxaRejeicao = totals.ofertadas > 0 ? (totals.rejeitadas / totals.ofertadas) * 100 : 0;

    return {
      taxaAceitacao,
      taxaCompletude,
      taxaRejeicao,
    };
  }, [totals.ofertadas, totals.aceitas, totals.rejeitadas, totals.completadas]);
}

