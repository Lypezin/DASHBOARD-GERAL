import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, ListChecks } from 'lucide-react';
import { AderenciaDia, AderenciaOrigem, AderenciaSubPraca, AderenciaTurno } from '@/types';
import { BenchmarkPracas } from '../comparacao/BenchmarkPracas';
import { OperationalDetailCard } from './components/OperationalDetailCard';
import { OperationalViewToggle, ViewMode } from './components/OperationalViewToggle';

interface Props {
    aderenciaTurno: AderenciaTurno[];
    aderenciaSubPraca: AderenciaSubPraca[];
    aderenciaOrigem: AderenciaOrigem[];
    aderenciaDia: AderenciaDia[];
}

export const DashboardOperationalDetail = React.memo(function DashboardOperationalDetail({
    aderenciaTurno,
    aderenciaSubPraca,
    aderenciaOrigem,
    aderenciaDia
}: Props) {
    const [viewMode, setViewMode] = useState<ViewMode>('turno');

    const dataToRender = useMemo(() => {
        const mapCommon = (item: any, label: string) => ({
            label,
            aderencia: item.aderencia_percentual || 0,
            horasAEntregar: item.horas_a_entregar || '0',
            horasEntregues: item.horas_entregues || '0',
            metrics: {
                ofertadas: item.corridas_ofertadas || 0,
                aceitas: item.corridas_aceitas || 0,
                completadas: item.corridas_completadas || 0,
                rejeitadas: item.corridas_rejeitadas || 0
            }
        });

        switch (viewMode) {
            case 'dia':
                return aderenciaDia.map((item) => mapCommon(
                    item,
                    item.data
                        ? new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })
                        : (item.dia_da_semana || item.dia || 'N/A')
                ));
            case 'turno':
                return aderenciaTurno.map((item) => mapCommon(item, item.turno || 'N/A'));
            case 'sub_praca':
                return aderenciaSubPraca.map((item) => mapCommon(item, item.sub_praca || 'N/A'));
            case 'origem':
                return aderenciaOrigem.map((item) => mapCommon(item, item.origem || 'N/A'));
            default:
                return [];
        }
    }, [viewMode, aderenciaDia, aderenciaTurno, aderenciaSubPraca, aderenciaOrigem]);

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
                            <CardDescription>Analise segmentada por categorias</CardDescription>
                        </div>
                    </div>
                    <OperationalViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {viewMode === 'ranking' ? (
                    aderenciaSubPraca.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                            <BenchmarkPracas subPracas={aderenciaSubPraca} />
                        </div>
                    ) : <EmptyState text="Nenhum dado de ranking disponivel" />
                ) : dataToRender.length > 0 ? (
                    <div key={viewMode} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                        {dataToRender.map((item, index) => (
                            <OperationalDetailCard key={`${viewMode}-${index}`} data={item} />
                        ))}
                    </div>
                ) : <EmptyState text="Nenhum dado disponivel" sub="Ajuste os filtros para visualizar os dados" />}
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
