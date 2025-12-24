
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DashboardFilters } from '@/types';
import { MarketingSummaryCards } from './MarketingSummaryCards';
import { MarketingComparacaoTable } from './MarketingComparacaoTable';
import { motion, Variants } from 'framer-motion';
import { useMarketingComparacaoViewController } from './useMarketingComparacaoViewController';

interface MarketingComparacaoViewProps {
    filters: DashboardFilters;
}

const MarketingComparacaoView = React.memo(function MarketingComparacaoView({ filters }: MarketingComparacaoViewProps) {
    const { data, loading, error, totals, praca } = useMarketingComparacaoViewController(filters);

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
            className="space-y-6 pb-20"
            variants={container}
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
                    <motion.div variants={item}>
                        <MarketingSummaryCards totals={totals} />
                    </motion.div>

                    <motion.div variants={item}>
                        <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="bg-blue-600 w-1.5 h-6 rounded-full inline-block"></span>
                                    Comparativo: Operacional vs Marketing
                                </CardTitle>
                                <CardDescription>
                                    Análise de volume e funil de corridas por semana
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
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
