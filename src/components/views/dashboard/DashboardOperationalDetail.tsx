import React, { useState, useMemo } from 'react';
import { AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ListChecks, BarChart3 } from 'lucide-react';
import { OperationalDetailCard } from './components/OperationalDetailCard';
import { OperationalViewToggle, ViewMode } from './components/OperationalViewToggle';
import { BenchmarkPracas } from '../comparacao/BenchmarkPracas';
import { motion } from 'framer-motion';

interface Props { aderenciaTurno: AderenciaTurno[]; aderenciaSubPraca: AderenciaSubPraca[]; aderenciaOrigem: AderenciaOrigem[]; aderenciaDia: AderenciaDia[]; }

export const DashboardOperationalDetail = React.memo(function DashboardOperationalDetail({ aderenciaTurno, aderenciaSubPraca, aderenciaOrigem, aderenciaDia }: Props) {
    const [viewMode, setViewMode] = useState<ViewMode>('turno');

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const itemVariant = { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1, transition: { duration: 0.3 } } };

    const dataToRender = useMemo(() => {
        const mapCommon = (item: any, label: string) => ({
            label, aderencia: item.aderencia_percentual || 0, horasAEntregar: item.horas_a_entregar || '0', horasEntregues: item.horas_entregues || '0',
            metrics: { ofertadas: item.corridas_ofertadas || 0, aceitas: item.corridas_aceitas || 0, completadas: item.corridas_completadas || 0, rejeitadas: item.corridas_rejeitadas || 0 }
        });

        switch (viewMode) {
            case 'dia': return aderenciaDia.map(i => mapCommon(i, i.data ? new Date(i.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' }) : (i.dia_da_semana || i.dia || 'N/A')));
            case 'turno': return aderenciaTurno.map(i => mapCommon(i, i.turno || 'N/A'));
            case 'sub_praca': return aderenciaSubPraca.map(i => mapCommon(i, i.sub_praca || 'N/A'));
            case 'origem': return aderenciaOrigem.map(i => mapCommon(i, i.origem || 'N/A'));
            default: return [];
        }
    }, [viewMode, aderenciaDia, aderenciaTurno, aderenciaSubPraca, aderenciaOrigem]);

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><ListChecks className="h-5 w-5 text-slate-600 dark:text-slate-400" /></div>
                        <div><CardTitle className="text-lg font-semibold">Detalhamento Operacional</CardTitle><CardDescription>Análise segmentada por categorias</CardDescription></div>
                    </div>
                    <OperationalViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {viewMode === 'ranking' ? (
                    aderenciaSubPraca.length > 0 ? (
                        <motion.div variants={itemVariant} initial="hidden" animate="show"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><BenchmarkPracas subPracas={aderenciaSubPraca} /></div></motion.div>
                    ) : <EmptyState text="Nenhum dado de ranking disponível" />
                ) : dataToRender.length > 0 ? (
                    <div className="space-y-6">
                        <motion.div key={viewMode} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" variants={container} initial="hidden" animate="show">
                            {dataToRender.map((item, i) => <motion.div key={`${viewMode}-${i}`} variants={itemVariant}><OperationalDetailCard data={item} /></motion.div>)}
                        </motion.div>
                    </div>
                ) : <EmptyState text="Nenhum dado disponível" sub="Ajuste os filtros para visualizar os dados" />}
            </CardContent>
        </Card>
    );
});

const EmptyState = ({ text, sub }: { text: string; sub?: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <BarChart3 className="h-12 w-12 mb-3 opacity-20" />
        <p className="text-sm font-medium">{text}</p>
        {sub && <p className="text-xs mt-1 opacity-70">{sub}</p>}
    </div>
);
