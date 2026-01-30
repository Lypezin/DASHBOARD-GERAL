
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ValoresBreakdown } from '@/types/financeiro';
import { motion } from 'framer-motion';
import { fadeInItem } from '@/utils/animations';

interface ValoresBreakdownProps {
    data: ValoresBreakdown | null;
    loading: boolean;
    formatarReal: (val: number) => string;
}

export const ValoresBreakdownDisplay = React.memo(({ data, loading, formatarReal }: ValoresBreakdownProps) => {
    if (loading) {
        return <div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-800 rounded-xl w-full" />;
    }

    if (!data) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* Breakdown por Turno */}
            <motion.div variants={fadeInItem} className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white px-2">Totais por Turno</h3>
                <div className="grid gap-4">
                    {data.by_turno.map((item, idx) => (
                        <Card key={idx} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardContent className="flex items-center justify-between p-6">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        {item.turno || 'Não definido'}
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {formatarReal(item.total_valor)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 mb-1">Corridas</p>
                                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                        {item.total_corridas}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </motion.div>

            {/* Breakdown por Sub-Praça */}
            <motion.div variants={fadeInItem} className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white px-2">Totais por Sub-Praça</h3>
                <div className="grid gap-4">
                    {data.by_sub_praca.map((item, idx) => (
                        <Card key={idx} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardContent className="flex items-center justify-between p-6">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        {item.sub_praca || 'Não definido'}
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {formatarReal(item.total_valor)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 mb-1">Corridas</p>
                                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        {item.total_corridas}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </motion.div>
        </div>
    );
});

ValoresBreakdownDisplay.displayName = 'ValoresBreakdownDisplay';
