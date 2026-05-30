import React, { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
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
        <div className="space-y-4">
            <div className="flex min-w-0 justify-start lg:justify-end">
                <OperationalViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            </div>

            <div className="min-w-0">
                {viewMode === 'ranking' ? (
                    aderenciaSubPraca.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 animate-fade-in lg:grid-cols-2">
                            <BenchmarkPracas subPracas={aderenciaSubPraca} />
                        </div>
                    ) : <EmptyState text="Nenhum dado de ranking disponivel" />
                ) : dataToRender.length > 0 ? (
                    <div key={viewMode} className="grid grid-cols-1 gap-4 animate-fade-in md:grid-cols-2 xl:grid-cols-3">
                        {dataToRender.map((item, index) => (
                            <OperationalDetailCard key={`${viewMode}-${index}`} data={item} index={index} />
                        ))}
                    </div>
                ) : <EmptyState text="Nenhum dado disponivel" sub="Ajuste os filtros para visualizar os dados" />}
            </div>
        </div>
    );
});

DashboardOperationalDetail.displayName = 'DashboardOperationalDetail';

const EmptyState = ({ text, sub }: { text: string; sub?: string }) => (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/80 bg-white/70 py-12 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
        <BarChart3 className="mb-3 h-10 w-10 opacity-30" />
        <p className="text-sm font-semibold">{text}</p>
        {sub && <p className="mt-1 text-xs opacity-70">{sub}</p>}
    </div>
);
