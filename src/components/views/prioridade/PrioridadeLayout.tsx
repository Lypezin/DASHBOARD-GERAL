
import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInItem } from '@/utils/animations';
import { PrioridadeHeader } from './PrioridadeHeader';
import { PrioridadeFilters } from './PrioridadeFilters';
import { PrioridadeSearch } from './PrioridadeSearch';
import { PrioridadeStatsCards } from './PrioridadeStatsCards';
import { PrioridadeTable } from './PrioridadeTable';
interface PrioridadeLayoutProps {
    sortedEntregadores: any[]; paginatedEntregadores: any[]; dataFiltradaLength: number; sortField: any; sortDirection: any;
    searchTerm: string; isSearching: boolean; filtroAderencia: any; filtroRejeicao: any;
    filtroCompletadas: any; filtroAceitas: any; stats: any; hasMore: boolean;
    onSearchChange: (val: string) => void; onClearSearch: () => void; onLoadMore: () => void;
    onAderenciaChange: (val: any) => void; onRejeicaoChange: (val: any) => void;
    onCompletadasChange: (val: any) => void; onAceitasChange: (val: any) => void;
    onClearFilters: () => void; onSort: (field: any) => void;
}

export const PrioridadeLayout = React.memo(function PrioridadeLayout({
    sortedEntregadores, paginatedEntregadores, dataFiltradaLength, sortField, sortDirection, searchTerm, isSearching,
    filtroAderencia, filtroRejeicao, filtroCompletadas, filtroAceitas, stats, hasMore,
    onSearchChange, onClearSearch, onAderenciaChange, onRejeicaoChange,
    onCompletadasChange, onAceitasChange, onClearFilters, onSort, onLoadMore
}: PrioridadeLayoutProps) {
    return (
        <motion.div
            className="space-y-8 pb-8 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={fadeInItem}>
                <PrioridadeHeader sortedEntregadores={sortedEntregadores} />
            </motion.div>

            <motion.div variants={fadeInItem}>
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
            </motion.div>

            <motion.div variants={fadeInItem}>
                <PrioridadeSearch
                    searchTerm={searchTerm}
                    isSearching={isSearching}
                    totalResults={dataFiltradaLength}
                    onSearchChange={onSearchChange}
                    onClearSearch={onClearSearch}
                />
            </motion.div>

            <motion.div variants={fadeInItem}>
                <PrioridadeStatsCards
                    totalEntregadores={stats.totalEntregadores}
                    totalOfertadas={stats.totalOfertadas}
                    totalAceitas={stats.totalAceitas}
                    totalRejeitadas={stats.totalRejeitadas}
                    totalCompletadas={stats.totalCompletadas}
                    aderenciaMedia={stats.aderenciaMedia}
                />
            </motion.div>

            <motion.div variants={fadeInItem}>
                <PrioridadeTable
                    sortedEntregadores={paginatedEntregadores}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    hasMore={hasMore}
                    onLoadMore={onLoadMore}
                />
            </motion.div>
        </motion.div>
    );
});
