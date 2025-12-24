
import React from 'react';
import { motion, Variants } from 'framer-motion';
import { PrioridadeHeader } from './PrioridadeHeader';
import { PrioridadeFilters } from './PrioridadeFilters';
import { PrioridadeSearch } from './PrioridadeSearch';
import { PrioridadeStatsCards } from './PrioridadeStatsCards';
import { PrioridadeTable } from './PrioridadeTable';
import {
    calcularPercentualAceitas,
    calcularPercentualCompletadas,
    getAderenciaColor,
    getAderenciaBg,
    getRejeicaoColor,
    getRejeicaoBg,
    getAceitasColor,
    getAceitasBg,
    getCompletadasColor,
    getCompletadasBg,
} from './PrioridadeUtils';

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

    const container: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div
            className="space-y-6 pb-8"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={item}>
                <PrioridadeHeader sortedEntregadores={sortedEntregadores} />
            </motion.div>

            <motion.div variants={item}>
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

            <motion.div variants={item}>
                <PrioridadeSearch
                    searchTerm={searchTerm}
                    isSearching={isSearching}
                    totalResults={dataFiltradaLength}
                    onSearchChange={onSearchChange}
                    onClearSearch={onClearSearch}
                />
            </motion.div>

            <motion.div variants={item}>
                <PrioridadeStatsCards
                    totalEntregadores={stats.totalEntregadores}
                    totalOfertadas={stats.totalOfertadas}
                    totalAceitas={stats.totalAceitas}
                    totalRejeitadas={stats.totalRejeitadas}
                    totalCompletadas={stats.totalCompletadas}
                    aderenciaMedia={stats.aderenciaMedia}
                />
            </motion.div>

            <motion.div variants={item}>
                <PrioridadeTable
                    sortedEntregadores={sortedEntregadores}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    calcularPercentualAceitas={calcularPercentualAceitas}
                    calcularPercentualCompletadas={calcularPercentualCompletadas}
                    getAderenciaColor={getAderenciaColor}
                    getAderenciaBg={getAderenciaBg}
                    getRejeicaoColor={getRejeicaoColor}
                    getRejeicaoBg={getRejeicaoBg}
                    getAceitasColor={getAceitasColor}
                    getAceitasBg={getAceitasBg}
                    getCompletadasColor={getCompletadasColor}
                    getCompletadasBg={getCompletadasBg}
                />
            </motion.div>
        </motion.div>
    );
});
