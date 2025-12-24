
import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInItem } from '@/utils/animations';
import { PrioridadeHeader } from './PrioridadeHeader';
import { PrioridadeFilters } from './PrioridadeFilters';
import { PrioridadeSearch } from './PrioridadeSearch';
import { PrioridadeStatsCards } from './PrioridadeStatsCards';
import { PrioridadeTable } from './PrioridadeTable';


interface PrioridadeLayoutProps {
    // State
    sortedEntregadores: any[];
    dataFiltradaLength: number;
    sortField: any;
    sortDirection: any;
    searchTerm: string;
    isSearching: boolean;
    filtroAderencia: any;
    filtroRejeicao: any;
    filtroCompletadas: any;
    filtroAceitas: any;
    stats: any;

    // Actions
    onSearchChange: (val: string) => void;
    onClearSearch: () => void;
    onAderenciaChange: (val: any) => void;
    onRejeicaoChange: (val: any) => void;
    onCompletadasChange: (val: any) => void;
    onAceitasChange: (val: any) => void;
    onClearFilters: () => void;
    onSort: (field: any) => void;
}

export const PrioridadeLayout = React.memo(function PrioridadeLayout({
    sortedEntregadores,
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
    onSearchChange,
    onClearSearch,
    onAderenciaChange,
    onRejeicaoChange,
    onCompletadasChange,
    onAceitasChange,
    onClearFilters,
    onSort
}: PrioridadeLayoutProps) {



    return (
        <motion.div
            className="space-y-6 pb-8"
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
                    sortedEntregadores={sortedEntregadores}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={onSort}
                />
            </motion.div>
        </motion.div>
    );
});
