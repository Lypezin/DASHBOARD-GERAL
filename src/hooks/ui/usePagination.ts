/**
 * Hook genérico para paginação de dados
 * Suporta paginação com offset/limit e cursor-based
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

import { useState, useCallback, useMemo } from 'react';
import type { PaginationOptions, PaginationState, PaginationControls } from '@/hooks/pagination/types';

export type { PaginationOptions, PaginationState, PaginationControls };

export function usePagination(options: PaginationOptions = {}): PaginationState & PaginationControls {
  const {
    pageSize = 1000,
    initialPage = 1,
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalItems, setTotalItems] = useState<number | undefined>(undefined);

  const offset = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize]);

  const totalPages = useMemo(() => {
    if (totalItems === undefined) return undefined;
    return Math.ceil(totalItems / pageSize);
  }, [totalItems, pageSize]);

  const hasNextPage = useMemo(() => {
    if (totalPages === undefined) return true;
    return currentPage < totalPages;
  }, [currentPage, totalPages]);

  const hasPreviousPage = useMemo(() => currentPage > 1, [currentPage]);

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
