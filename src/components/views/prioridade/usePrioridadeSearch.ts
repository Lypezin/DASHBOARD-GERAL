import { useDeferredValue, useMemo } from 'react';
import { Entregador, EntregadoresData } from '@/types';

export function usePrioridadeSearch(
  searchTerm: string,
  entregadoresData: EntregadoresData | null
) {
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const searchResults = useMemo<Entregador[]>(() => {
    const term = deferredSearchTerm.trim().toLowerCase();
    const entregadores = entregadoresData?.entregadores || [];

    if (!term) {
      return [];
    }

    return entregadores.filter(e =>
      e.nome_entregador.toLowerCase().includes(term) ||
      e.id_entregador.toLowerCase().includes(term)
    );
  }, [deferredSearchTerm, entregadoresData]);

  return {
    searchResults,
    deferredSearchTerm,
    isSearching: searchTerm.trim() !== deferredSearchTerm.trim(),
  };
}
