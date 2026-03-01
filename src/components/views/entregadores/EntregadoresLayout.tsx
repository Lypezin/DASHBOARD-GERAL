
import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInItem } from '@/utils/animations';
import { EntregadoresHeader } from './components/EntregadoresHeader';
import { EntregadoresFilters } from './EntregadoresFilters';
import { EntregadoresStatsCards } from './EntregadoresStatsCards';
import { EntregadoresTable } from './EntregadoresTable';
import { EntregadoresEmptyState } from './components/EntregadoresStates';

interface EntregadoresLayoutProps {
    entregadores: any[]; entregadoresFiltrados: any[]; totais: any;
    searchTerm: string; cidadeSelecionada: string; filtroRodouDia: any; filtroDataInicio: any; sortField: any; sortDirection: any;
    onSearchChange: (value: string) => void; onCidadeChange: (value: string) => void; onFiltroRodouDiaChange: (value: any) => void;
    onFiltroDataInicioChange: (value: any) => void; onSort: (field: any) => void; onExport: () => void;
    formatarSegundosParaHoras: (seconds: number) => string;
}

export const EntregadoresLayout = React.memo(function EntregadoresLayout({ entregadores, entregadoresFiltrados, totais, searchTerm, cidadeSelecionada, filtroRodouDia, filtroDataInicio, sortField, sortDirection, onSearchChange, onCidadeChange, onFiltroRodouDiaChange, onFiltroDataInicioChange, onSort, onExport, formatarSegundosParaHoras }: EntregadoresLayoutProps) {



    return (
        <motion.div
            className="space-y-6"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={fadeInItem}>
                <EntregadoresHeader
                    count={entregadoresFiltrados.length}
                    totalCount={entregadores.length}
                    hasFilteredData={entregadoresFiltrados.length > 0}
                    onExport={onExport}
                />
            </motion.div>

            {/* Filtros */}
            <motion.div variants={fadeInItem}>
                <EntregadoresFilters searchTerm={searchTerm} onSearchChange={onSearchChange} cidadeSelecionada={cidadeSelecionada} onCidadeChange={onCidadeChange} filtroRodouDia={filtroRodouDia} onFiltroRodouDiaChange={onFiltroRodouDiaChange} filtroDataInicio={filtroDataInicio} onFiltroDataInicioChange={onFiltroDataInicioChange} />
            </motion.div>

            {/* Cartões de Total */}
            <motion.div variants={fadeInItem}>
                <EntregadoresStatsCards
                    totalEntregadores={totais.totalEntregadores}
                    totalSegundos={totais.totalSegundos}
                    totalOfertadas={totais.totalOfertadas}
                    totalAceitas={totais.totalAceitas}
                    totalCompletadas={totais.totalCompletadas}
                    totalRejeitadas={totais.totalRejeitadas}
                    totalRodandoSim={totais.totalRodandoSim}
                    totalRodandoNao={totais.totalRodandoNao}
                    formatarSegundosParaHoras={formatarSegundosParaHoras}
                />
            </motion.div>

            {/* Tabela de Entregadores */}
            <motion.div variants={fadeInItem}>
                {entregadores.length > 0 ? (
                    <EntregadoresTable
                        entregadores={entregadoresFiltrados}
                        formatarSegundosParaHoras={formatarSegundosParaHoras}
                        // @ts-ignore
                        sortField={sortField}
                        // @ts-ignore
                        sortDirection={sortDirection}
                        // @ts-ignore
                        onSort={onSort}
                    />
                ) : (
                    <EntregadoresEmptyState searchTerm={searchTerm} />
                )}
            </motion.div>
        </motion.div>
    );
});
