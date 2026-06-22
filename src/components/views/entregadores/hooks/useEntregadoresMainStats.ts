import { useDeferredValue, useMemo } from 'react';
import { Entregador } from '@/types';

export function useEntregadoresMainStats(sortedEntregadores: Entregador[]) {
  const deferredEntregadores = useDeferredValue(sortedEntregadores);

  return useMemo(() => {
    const total = deferredEntregadores.length;
    if (total === 0) return { totalEntregadores: 0, aderenciaMedia: 0, rejeicaoMedia: 0, totalCorridasCompletadas: 0, totalSegundos: 0 };
    return {
      totalEntregadores: total,
      aderenciaMedia: deferredEntregadores.reduce((s, e) => s + e.aderencia_percentual, 0) / total,
      rejeicaoMedia: deferredEntregadores.reduce((s, e) => s + e.rejeicao_percentual, 0) / total,
      totalCorridasCompletadas: deferredEntregadores.reduce((s, e) => s + (e.corridas_completadas || 0), 0),
      totalSegundos: deferredEntregadores.reduce((s, e) => s + (e.total_segundos || 0), 0)
    };
  }, [deferredEntregadores]);
}
