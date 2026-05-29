import { useMemo } from 'react';
import { Entregador, EntregadoresData } from '@/types';

export function usePrioridadeSearch(
  searchTerm: string,
  entregadoresData: EntregadoresData | null
) {
  const searchResults = useMemo<Entregador[]>(() => {
    const term = searchTerm.trim().toLowerCase();
    const entregadores = entregadoresData?.entregadores || [];

    if (!term) {
      return [];
    }

    return entregadores.filter(e =>
      e.nome_entregador.toLowerCase().includes(term) ||
      e.id_entregador.toLowerCase().includes(term)
    );
  }, [searchTerm, entregadoresData]);

  return { searchResults, isSearching: false };
}
