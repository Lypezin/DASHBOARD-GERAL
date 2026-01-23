
import React from 'react';

import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DashboardFilters } from '@/types';
import { MarketingSummaryCards } from './MarketingSummaryCards';
import { MarketingComparacaoTable } from './MarketingComparacaoTable';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInItem } from '@/utils/animations';
import { useMarketingComparacaoViewController } from './useMarketingComparacaoViewController';

interface MarketingComparacaoViewProps {
    filters: DashboardFilters;
}

const MarketingComparacaoView = React.memo(function MarketingComparacaoView({ filters }: MarketingComparacaoViewProps) {
    const { data, loading, error, totals, praca } = useMarketingComparacaoViewController(filters);



    return (
        <motion.div
            className="space-y-8 pb-20 w-full max-w-[1600px] mx-auto"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
        >
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro ao carregar dados</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {loading ? (
                <div className="flex justify-center py-24">
                    <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <motion.div variants={fadeInItem}>
                        <MarketingSummaryCards totals={totals} />
                    </motion.div>

                    <motion.div variants={fadeInItem} className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-purple-500 to-blue-600 shadow-sm" />
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                                        Comparativo Semanal
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                        Análise detalhada de volume e conversão (Operacional vs Marketing)
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800/50">
                            <MarketingComparacaoTable data={data} praca={praca} />
                        </div>
                    </motion.div>
                </>
            )}
        </motion.div>
    );
});

export default MarketingComparacaoView;
