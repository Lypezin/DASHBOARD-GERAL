import { useDeferredValue, useMemo } from 'react';
import { Entregador } from '@/types';

export function useEntregadoresMainStats(sortedEntregadores: Entregador[]) {
  const deferredEntregadores = useDeferredValue(sortedEntregadores);

  return useMemo(() => {
    const total = deferredEntregadores.length;
    if (total === 0) return { totalEntregadores: 0, aderenciaMedia: 0, rejeicaoMedia: 0, totalCorridasCompletadas: 0, totalSegundos: 0 };

    const totals = deferredEntregadores.reduce(
      (acc, entregador) => {
        acc.aderencia += entregador.aderencia_percentual || 0;
        acc.rejeicao += entregador.rejeicao_percentual || 0;
        acc.corridasCompletadas += entregador.corridas_completadas || 0;
        acc.segundos += entregador.total_segundos || 0;
        return acc;
      },
      { aderencia: 0, rejeicao: 0, corridasCompletadas: 0, segundos: 0 }
    );

    return {
      totalEntregadores: total,
      aderenciaMedia: totals.aderencia / total,
      rejeicaoMedia: totals.rejeicao / total,
      totalCorridasCompletadas: totals.corridasCompletadas,
      totalSegundos: totals.segundos
    };
  }, [deferredEntregadores]);
}
