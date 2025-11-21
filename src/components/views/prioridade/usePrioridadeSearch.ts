import { useState, useEffect, useRef } from 'react';
import { Entregador, EntregadoresData } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';

const IS_DEV = process.env.NODE_ENV === 'development';

export function usePrioridadeSearch(
  searchTerm: string,
  entregadoresData: EntregadoresData | null
) {
  const [searchResults, setSearchResults] = useState<Entregador[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await safeRpc<Entregador[] | { entregadores: Entregador[] }>('pesquisar_entregadores', {
          termo_busca: searchTerm.trim()
        }, {
          timeout: 30000,
          validateParams: false
        });

        if (error) {
          const errorCode = (error as any)?.code || '';
          const errorMessage = String((error as any)?.message || '');
          const is500 = errorCode === 'PGRST301' || 
                       errorMessage.includes('500') || 
                       errorMessage.includes('Internal Server Error');
          
          if (is500) {
            if (IS_DEV) {
              safeLog.warn('Erro 500 ao pesquisar entregadores, usando fallback local');
            }
            const filtered = (entregadoresData?.entregadores || []).filter(e => 
              e.nome_entregador.toLowerCase().includes(searchTerm.toLowerCase()) ||
              e.id_entregador.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setSearchResults(filtered);
            setIsSearching(false);
            return;
          }
          
          throw error;
        }
        
        if (Array.isArray(data)) {
          setSearchResults(data);
        } else if (data && typeof data === 'object' && 'entregadores' in data) {
          setSearchResults((data as { entregadores: Entregador[] }).entregadores || []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        if (IS_DEV) safeLog.error('Erro ao pesquisar entregadores:', err);
        const filtered = (entregadoresData?.entregadores || []).filter(e => 
          e.nome_entregador.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.id_entregador.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(filtered);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, entregadoresData]);

  return { searchResults, isSearching };
}

