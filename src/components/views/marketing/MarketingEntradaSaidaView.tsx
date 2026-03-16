'use client';

import React from 'react';
import { EntradaSaidaView } from './EntradaSaidaView';
import { useAuth } from '@/hooks/auth/useAuth';
import { MarketingFilters } from './MarketingFilters';
import { useMarketingFilters } from './hooks/useMarketingFilters';
import { motion, Variants } from 'framer-motion';

const MarketingEntradaSaidaView = React.memo(function MarketingEntradaSaidaView() {
    const { user } = useAuth();
    const {
        filters,
        setFilters,
        appliedFilters,
        handleApplyFilters,
        handleClearFilters,
        handleQuickFilter
    } = useMarketingFilters();

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
            className="space-y-6 animate-fade-in pb-8"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={item} className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                    <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600 shadow-sm" />
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                            Fluxo de Entrada e Saída
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            Análise de adesão e desligamento de entregadores
                        </p>
                    </div>
                </div>
                <MarketingFilters
                    filters={filters}
                    appliedFilters={appliedFilters}
                    setFilters={setFilters}
                    handleApplyFilters={handleApplyFilters}
                    handleClearFilters={handleClearFilters}
                    handleQuickFilter={handleQuickFilter}
                />
            </motion.div>

            {/* Conteúdo Principal */}
            {appliedFilters.dataInicial && appliedFilters.dataFinal && (
                <motion.div variants={item}>
                    <EntradaSaidaView
                        dataInicial={appliedFilters.dataInicial}
                        dataFinal={appliedFilters.dataFinal}
                        organizationId={user?.organization_id || undefined}
                        praca={appliedFilters.praca}
                    />
                </motion.div>
            )}
        </motion.div>
    );
});

MarketingEntradaSaidaView.displayName = 'MarketingEntradaSaidaView';

export default MarketingEntradaSaidaView;
