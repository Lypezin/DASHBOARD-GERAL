/**
 * Type definitions for pagination hook
 */

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
