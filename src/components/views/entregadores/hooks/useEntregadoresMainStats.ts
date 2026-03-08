import { useMemo } from 'react';
import { Entregador } from '@/types';

export function useEntregadoresMainStats(sortedEntregadores: Entregador[]) {
  return useMemo(() => {
    const total = sortedEntregadores.length;
    if (total === 0) return { totalEntregadores: 0, aderenciaMedia: 0, rejeicaoMedia: 0, totalCorridasCompletadas: 0, totalSegundos: 0 };
    return {
      totalEntregadores: total,
      aderenciaMedia: sortedEntregadores.reduce((s, e) => s + e.aderencia_percentual, 0) / total,
      rejeicaoMedia: sortedEntregadores.reduce((s, e) => s + e.rejeicao_percentual, 0) / total,
      totalCorridasCompletadas: sortedEntregadores.reduce((s, e) => s + (e.corridas_completadas || 0), 0),
      totalSegundos: sortedEntregadores.reduce((s, e) => s + (e.total_segundos || 0), 0)
    };
  }, [sortedEntregadores]);
}
