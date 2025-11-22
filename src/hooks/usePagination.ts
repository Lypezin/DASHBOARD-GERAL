/**
 * Hook genérico para paginação de dados
 * Suporta paginação com offset/limit e cursor-based
 */

import { useState, useCallback, useMemo } from 'react';

export interface PaginationOptions {
  /** Tamanho da página (quantos itens por página) */
  pageSize?: number;
  /** Número inicial da página (começa em 1) */
  initialPage?: number;
}

export interface PaginationState {
  /** Página atual (começa em 1) */
  currentPage: number;
  /** Tamanho da página */
  pageSize: number;
  /** Total de itens (se conhecido) */
  totalItems?: number;
  /** Total de páginas (calculado se totalItems estiver disponível) */
  totalPages?: number;
}

export interface PaginationControls {
  /** Vai para a próxima página */
  nextPage: () => void;
  /** Vai para a página anterior */
  previousPage: () => void;
  /** Vai para uma página específica */
  goToPage: (page: number) => void;
  /** Reseta para a primeira página */
  reset: () => void;
  /** Se há próxima página */
  hasNextPage: boolean;
  /** Se há página anterior */
  hasPreviousPage: boolean;
  /** Offset para queries (calculado) */
  offset: number;
  /** Limit para queries (igual a pageSize) */
  limit: number;
}

/**
 * Hook para gerenciar paginação de dados
 * 
 * @example
 * ```tsx
 * const { currentPage, pageSize, offset, limit, nextPage, previousPage, hasNextPage } = usePagination({ pageSize: 100 });
 * 
 * // Usar offset e limit na query
 * const { data } = await supabase
 *   .from('table')
 *   .select('*')
 *   .range(offset, offset + limit - 1);
 * ```
 */
export function usePagination(options: PaginationOptions = {}): PaginationState & PaginationControls {
  const {
    pageSize = 1000,
    initialPage = 1,
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalItems, setTotalItems] = useState<number | undefined>(undefined);

  const offset = useMemo(() => {
    return (currentPage - 1) * pageSize;
  }, [currentPage, pageSize]);

  const totalPages = useMemo(() => {
    if (totalItems === undefined) return undefined;
    return Math.ceil(totalItems / pageSize);
  }, [totalItems, pageSize]);

  const hasNextPage = useMemo(() => {
    if (totalPages === undefined) return true; // Assumir que há próxima página se não soubermos o total
    return currentPage < totalPages;
  }, [currentPage, totalPages]);

  const hasPreviousPage = useMemo(() => {
    return currentPage > 1;
  }, [currentPage]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPreviousPage]);

  const goToPage = useCallback((page: number) => {
    if (page < 1) return;
    if (totalPages !== undefined && page > totalPages) return;
    setCurrentPage(page);
  }, [totalPages]);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setTotalItems(undefined);
  }, [initialPage]);

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    nextPage,
    previousPage,
    goToPage,
    reset,
    hasNextPage,
    hasPreviousPage,
    offset,
    limit: pageSize,
  };
}

