import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ValoresEntregador } from '@/types';
import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';
import { useUrlSearchSync } from '@/hooks/ui/useUrlSearchSync';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useValoresSearch(valoresData: ValoresEntregador[] | null) {
    const searchParams = useSearchParams();
    const getInitialSearchTerm = () => searchParams.get('val_search') || '';

    const [searchTerm, setSearchTerm] = useState(getInitialSearchTerm);
    const [searchResults, setSearchResults] = useState<ValoresEntregador[]>([]);

    useUrlSearchSync('val_search', searchTerm);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
                const { data, error } = await safeRpc<ValoresEntregador[]>('pesquisar_valores_entregadores', {
                    termo_busca: searchTerm.trim()
                }, {
                    timeout: 30000,
                    validateParams: true
                });

                if (error) throw error;
                setSearchResults(data || []);
            } catch (err) {
                if (IS_DEV) safeLog.error('Erro ao pesquisar valores:', err);
                const valoresArray = Array.isArray(valoresData) ? valoresData : [];
                const filtered = valoresArray.filter(e =>
                    e?.nome_entregador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    e?.id_entregador?.toLowerCase().includes(searchTerm.toLowerCase())
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
    }, [searchTerm, valoresData]);

    const dataToDisplay = useMemo(() => {
        try {
            const valoresArray = Array.isArray(valoresData) ? valoresData : [];

            if (searchTerm.trim() && Array.isArray(searchResults) && searchResults.length > 0) {
                return searchResults;
            }

            return valoresArray;
        } catch (err) {
            safeLog.error('Erro ao processar dados de valores:', err);
            setError('Erro ao processar dados. Tente recarregar a página.');
            return [];
        }
    }, [searchTerm, searchResults, valoresData]);

    return {
        searchTerm,
        setSearchTerm,
        isSearching,
        error,
        dataToDisplay
    };
}
