import React, { useState, useMemo } from 'react';
import { AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, BarChart3 } from 'lucide-react';
import { OperationalDetailCard } from './components/OperationalDetailCard';
import { OperationalViewToggle, ViewMode } from './components/OperationalViewToggle';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface DashboardOperationalDetailProps {
    aderenciaTurno: AderenciaTurno[];
    aderenciaSubPraca: AderenciaSubPraca[];
    aderenciaOrigem: AderenciaOrigem[];
}

export const DashboardOperationalDetail = React.memo(function DashboardOperationalDetail({
    aderenciaTurno,
    aderenciaSubPraca,
    aderenciaOrigem,
}: DashboardOperationalDetailProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('turno');

    // Animation variants
    const container: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariant: Variants = {
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
    };

    // Dados para renderização com base no viewMode
    const dataToRender = useMemo(() => {
        switch (viewMode) {
            case 'turno':
                return aderenciaTurno.map(item => ({
                    label: item.turno || 'N/A',
                    aderencia: item.aderencia_percentual || 0,
                    horasAEntregar: item.horas_a_entregar || '0',
                    horasEntregues: item.horas_entregues || '0'
                }));
            case 'sub_praca':
                return aderenciaSubPraca.map(item => ({
                    label: item.sub_praca || 'N/A',
                    aderencia: item.aderencia_percentual || 0,
                    horasAEntregar: item.horas_a_entregar || '0',
                    horasEntregues: item.horas_entregues || '0'
                }));
            case 'origem':
                return aderenciaOrigem.map(item => ({
                    label: item.origem || 'N/A',
                    aderencia: item.aderencia_percentual || 0,
                    horasAEntregar: item.horas_a_entregar || '0',
                    horasEntregues: item.horas_entregues || '0'
                }));
            default:
                return [];
        }
    }, [viewMode, aderenciaTurno, aderenciaSubPraca, aderenciaOrigem]);

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <ListChecks className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold">Detalhamento Operacional</CardTitle>
                            <CardDescription>Análise segmentada por categorias</CardDescription>
                        </div>
                    </div>

                    <OperationalViewToggle
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                    />
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {dataToRender.length > 0 ? (
                    <motion.div
                        key={viewMode}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        variants={container}
                        initial="hidden"
                        animate="show"
                    >
                        {dataToRender.map((item, index) => (
                            <motion.div key={`${viewMode}-${index}`} variants={itemVariant}>
                                <OperationalDetailCard data={item} />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mb-3 opacity-20" />
                        <p className="text-sm font-medium">Nenhum dado disponível</p>
                        <p className="text-xs mt-1 opacity-70">
                            Ajuste os filtros para visualizar os dados
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
});
