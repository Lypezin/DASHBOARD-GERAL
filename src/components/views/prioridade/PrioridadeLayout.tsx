import React from 'react';
import { Entregador } from '@/types';
import { PrioridadeHeader } from './PrioridadeHeader';
import { PrioridadeFilters } from './PrioridadeFilters';
import { PrioridadeSearch } from './PrioridadeSearch';
import { PrioridadeStatsCards } from './PrioridadeStatsCards';
import { PrioridadeTable } from './PrioridadeTable';
import type { SortDirection, SortField } from './hooks/usePrioridadeSort';
import { ViewContainer } from '@/components/layout/ViewContainer';

interface PrioridadeStats {
    totalEntregadores: number;
    totalOfertadas: number;
    totalAceitas: number;
    totalRejeitadas: number;
    totalCompletadas: number;
    aderenciaMedia: number;
}

interface PrioridadeLayoutProps {
    sortedEntregadores: Entregador[];
    paginatedEntregadores: Entregador[];
    dataFiltradaLength: number;
    sortField: SortField;
    sortDirection: SortDirection;
    searchTerm: string;
    isSearching: boolean;
    filtroAderencia: string;
    filtroRejeicao: string;
    filtroCompletadas: string;
    filtroAceitas: string;
    stats: PrioridadeStats;
    hasMore: boolean;
    onSearchChange: (val: string) => void;
    onClearSearch: () => void;
    onLoadMore: () => void;
    onAderenciaChange: (val: string) => void;
    onRejeicaoChange: (val: string) => void;
    onCompletadasChange: (val: string) => void;
    onAceitasChange: (val: string) => void;
    onClearFilters: () => void;
    onSort: (field: SortField) => void;
}

export const PrioridadeLayout = React.memo(function PrioridadeLayout({
    sortedEntregadores,
    paginatedEntregadores,
    dataFiltradaLength,
    sortField,
    sortDirection,
    searchTerm,
    isSearching,
    filtroAderencia,
    filtroRejeicao,
    filtroCompletadas,
    filtroAceitas,
    stats,
    hasMore,
    onSearchChange,
    onClearSearch,
    onAderenciaChange,
    onRejeicaoChange,
    onCompletadasChange,
    onAceitasChange,
    onClearFilters,
    onSort,
    onLoadMore
}: PrioridadeLayoutProps) {
    return (
        <ViewContainer className="space-y-8 pb-8">
            <PrioridadeHeader sortedEntregadores={sortedEntregadores} />

            <PrioridadeFilters
                filtroAderencia={filtroAderencia}
                filtroRejeicao={filtroRejeicao}
                filtroCompletadas={filtroCompletadas}
                filtroAceitas={filtroAceitas}
                onAderenciaChange={onAderenciaChange}
                onRejeicaoChange={onRejeicaoChange}
                onCompletadasChange={onCompletadasChange}
                onAceitasChange={onAceitasChange}
                onClearFilters={onClearFilters}
            />

            <PrioridadeSearch
                searchTerm={searchTerm}
                isSearching={isSearching}
                totalResults={dataFiltradaLength}
                onSearchChange={onSearchChange}
                onClearSearch={onClearSearch}
            />

            <PrioridadeStatsCards
                totalEntregadores={stats.totalEntregadores}
                totalOfertadas={stats.totalOfertadas}
                totalAceitas={stats.totalAceitas}
                totalRejeitadas={stats.totalRejeitadas}
                totalCompletadas={stats.totalCompletadas}
                aderenciaMedia={stats.aderenciaMedia}
            />

            <PrioridadeTable
                sortedEntregadores={paginatedEntregadores}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={onSort}
                hasMore={hasMore}
                onLoadMore={onLoadMore}
            />
        </ViewContainer>
    );
});
