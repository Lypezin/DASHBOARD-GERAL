import { useState, useEffect, useRef, useMemo } from 'react';
import { ValoresEntregador } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useValoresData(valoresData: ValoresEntregador[] | null, loading: boolean) {
    const [sortField, setSortField] = useState<keyof ValoresEntregador>('total_taxas');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<ValoresEntregador[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Função para formatar valores em Real
    const formatarReal = (valor: number | null | undefined) => {
        if (valor == null || isNaN(valor)) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(valor);
    };

    // Pesquisa com debounce
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
                // Fallback para pesquisa local
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

    // Usar resultados da pesquisa se houver termo de busca e resultados, senão usar dados originais
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

    // Criar uma cópia estável para ordenação
    const sortedValores: ValoresEntregador[] = useMemo(() => {
        if (!Array.isArray(dataToDisplay) || dataToDisplay.length === 0) return [];

        const dataCopy = [...dataToDisplay];

        return dataCopy.sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            if (sortField === 'nome_entregador' || sortField === 'id_entregador') {
                const aStr = String(aValue).toLowerCase().trim();
                const bStr = String(bValue).toLowerCase().trim();
                const comparison = aStr.localeCompare(bStr, 'pt-BR', { sensitivity: 'base', numeric: true });
                return sortDirection === 'asc' ? comparison : -comparison;
            }

            const aNum = Number(aValue) || 0;
            const bNum = Number(bValue) || 0;

            const comparison = aNum - bNum;

            if (comparison === 0) {
                return a.nome_entregador.localeCompare(b.nome_entregador, 'pt-BR');
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [dataToDisplay, sortField, sortDirection]);

    const handleSort = (field: keyof ValoresEntregador) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    // Calcular estatísticas gerais
    const dataArray = useMemo(() => {
        return Array.isArray(dataToDisplay) ? dataToDisplay : [];
    }, [dataToDisplay]);

    const totalGeral = useMemo(() => {
        return dataArray.reduce((sum, e) => {
            const valor = Number(e?.total_taxas) || 0;
            return sum + valor;
        }, 0);
    }, [dataArray]);

    const totalCorridas = useMemo(() => {
        return dataArray.reduce((sum, e) => {
            const valor = Number(e?.numero_corridas_aceitas) || 0;
            return sum + valor;
        }, 0);
    }, [dataArray]);

    const taxaMediaGeral = useMemo(() => {
        return totalCorridas > 0 ? totalGeral / totalCorridas : 0;
    }, [totalGeral, totalCorridas]);

    const totalEntregadores = useMemo(() => {
        return Array.isArray(dataArray) ? dataArray.length : 0;
    }, [dataArray]);

    return {
        sortedValores,
        sortField,
        sortDirection,
        searchTerm,
        isSearching,
        error,
        totalGeral,
        totalCorridas,
        taxaMediaGeral,
        totalEntregadores,
        setSearchTerm,
        handleSort,
        formatarReal
    };
}
