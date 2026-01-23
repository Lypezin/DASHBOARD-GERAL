
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
            className="space-y-6 pb-20"
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
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <motion.div variants={fadeInItem}>
                        <MarketingSummaryCards totals={totals} />
                    </motion.div>

                    <motion.div variants={fadeInItem}>
                        <Card className="border-none shadow-xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md overflow-hidden ring-1 ring-slate-200/50 dark:ring-slate-800/50">
                            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/10 pb-6 border-b border-slate-100 dark:border-slate-800/60">
                                <CardTitle className="flex items-center gap-3 text-xl">
                                    <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600 shadow-sm" />
                                    Comparativo: Operacional vs Marketing
                                </CardTitle>
                                <CardDescription className="ml-4.5 pl-1 text-slate-500 dark:text-slate-400">
                                    Análise detalhada de volume e funil de corridas por semana
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <MarketingComparacaoTable data={data} praca={praca} />
                            </CardContent>
                        </Card>
                    </motion.div>
                </>
            )}
        </motion.div>
    );
});

export default MarketingComparacaoView;
