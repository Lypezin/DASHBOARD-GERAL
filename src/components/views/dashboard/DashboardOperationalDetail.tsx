import React, { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { AderenciaDia, AderenciaOrigem, AderenciaSubPraca, AderenciaTurno } from '@/types';
import { BenchmarkPracas } from '../comparacao/BenchmarkPracas';
import { OperationalDetailCard } from './components/OperationalDetailCard';
import { OperationalViewToggle, ViewMode } from './components/OperationalViewToggle';
import { ViewTransition } from '@/components/ui/view-transition';

interface Props {
    aderenciaTurno: AderenciaTurno[];
    aderenciaSubPraca: AderenciaSubPraca[];
    aderenciaOrigem: AderenciaOrigem[];
    aderenciaDia: AderenciaDia[];
}

const viewLabels: Record<ViewMode, string> = {
    dia: 'Dia',
    turno: 'Turno',
    sub_praca: 'Sub-praça',
    origem: 'Origem',
    ranking: 'Ranking',
};

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

    const detailSummary = useMemo(() => {
        if (dataToRender.length === 0) {
            return { media: 0, melhor: null as null | { label: string; aderencia: number } };
        }

        const total = dataToRender.reduce((sum, item) => sum + item.aderencia, 0);
        const melhor = dataToRender.reduce((best, item) => (
            item.aderencia > best.aderencia ? item : best
        ), dataToRender[0]);

        return {
            media: total / dataToRender.length,
            melhor: { label: melhor.label, aderencia: melhor.aderencia },
        };
    }, [dataToRender]);

    return (
        <section aria-labelledby="overview-detail-title" className="min-w-0 space-y-3">
            <header className="flex min-w-0 flex-col gap-3 px-0.5 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <h2 id="overview-detail-title" className="text-[15px] font-semibold tracking-tight text-[#183f58] dark:text-slate-100">Detalhamento operacional</h2>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {viewMode !== 'ranking'
                            ? `${dataToRender.length} recortes na dimensão ${viewLabels[viewMode].toLowerCase()}.`
                            : 'Ranking comparativo por sub-praça.'}
                    </p>
                </div>
                <OperationalViewToggle viewMode={viewMode} onViewModeChange={setViewMode} className="w-full sm:w-auto" />
            </header>

            {viewMode !== 'ranking' && dataToRender.length > 0 ? (
                <dl className="flex flex-wrap gap-x-7 gap-y-2 border-y border-[#d8e4eb] px-1 py-2.5 dark:border-slate-800">
                    <div>
                        <dt className="text-[10px] text-slate-500 dark:text-slate-400">Média do recorte</dt>
                        <dd className="mt-0.5 text-sm font-semibold tabular-nums text-[#183f58] dark:text-slate-100">{detailSummary.media.toFixed(1)}%</dd>
                    </div>
                    <div>
                        <dt className="text-[10px] text-slate-500 dark:text-slate-400">Melhor aderência</dt>
                        <dd className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{detailSummary.melhor?.aderencia.toFixed(1) || '0.0'}%</dd>
                    </div>
                    <div className="min-w-0 max-w-full">
                        <dt className="text-[10px] text-slate-500 dark:text-slate-400">Melhor grupo</dt>
                        <dd className="mt-0.5 max-w-[18rem] truncate text-sm font-semibold text-[#183f58] dark:text-slate-100" title={detailSummary.melhor?.label || 'N/A'}>{detailSummary.melhor?.label || 'N/A'}</dd>
                    </div>
                </dl>
            ) : null}

            <div className="min-w-0">
                <ViewTransition stateKey={viewMode} className="w-full" preventExitInteraction>
                    {viewMode === 'ranking' ? (
                        aderenciaSubPraca.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                <BenchmarkPracas subPracas={aderenciaSubPraca} />
                            </div>
                        ) : <EmptyState text="Nenhum dado de ranking disponível" />
                    ) : dataToRender.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                            {dataToRender.map((item, index) => (
                                <OperationalDetailCard key={`${viewMode}-${index}`} data={item} />
                            ))}
                        </div>
                    ) : <EmptyState text="Nenhum dado disponível" sub="Ajuste os filtros para visualizar os dados." />}
                </ViewTransition>
            </div>
        </section>
    );
});

DashboardOperationalDetail.displayName = 'DashboardOperationalDetail';

const EmptyState = ({ text, sub }: { text: string; sub?: string }) => (
    <div className="flex flex-col items-center justify-center border-y border-dashed border-[#d8e4eb] py-10 text-center text-slate-600 dark:border-slate-800 dark:text-slate-400">
        <BarChart3 className="mb-2 h-7 w-7 text-slate-400 dark:text-slate-500" aria-hidden="true" />
        <p className="text-sm font-semibold">{text}</p>
        {sub && <p className="mt-1 text-xs opacity-70">{sub}</p>}
    </div>
);
