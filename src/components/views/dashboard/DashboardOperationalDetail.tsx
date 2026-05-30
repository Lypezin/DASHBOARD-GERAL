import React, { useMemo, useState } from 'react';
import { BarChart3, Layers3, Target } from 'lucide-react';
import { AderenciaDia, AderenciaOrigem, AderenciaSubPraca, AderenciaTurno } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { BenchmarkPracas } from '../comparacao/BenchmarkPracas';
import { OperationalDetailCard } from './components/OperationalDetailCard';
import { OperationalViewToggle, ViewMode } from './components/OperationalViewToggle';

interface Props {
    aderenciaTurno: AderenciaTurno[];
    aderenciaSubPraca: AderenciaSubPraca[];
    aderenciaOrigem: AderenciaOrigem[];
    aderenciaDia: AderenciaDia[];
}

const viewLabels: Record<ViewMode, string> = {
    dia: 'Dia',
    turno: 'Turno',
    sub_praca: 'Sub Praca',
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
        <Card className="overflow-hidden rounded-[1.65rem] border-slate-200/80 bg-white/95 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.45)] animate-fade-in dark:border-slate-800/80 dark:bg-slate-950/80">
            <CardContent className="p-0">
                <div className="flex flex-col gap-4 border-b border-slate-200/70 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,250,252,0.90))] p-4 dark:border-slate-800/80 dark:bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.88))] lg:flex-row lg:items-center lg:justify-between lg:p-5">
                    <div className="min-w-0">
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <Layers3 className="h-3.5 w-3.5" />
                            Quebra selecionada
                        </div>
                        <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                            <h3 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                                Visao por {viewLabels[viewMode]}
                            </h3>
                            {viewMode !== 'ranking' && (
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    {dataToRender.length} recortes analisados
                                </span>
                            )}
                        </div>
                    </div>

                    <OperationalViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                </div>

                {viewMode !== 'ranking' && dataToRender.length > 0 && (
                    <div className="grid gap-3 border-b border-slate-200/70 bg-slate-50/60 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-900/30 sm:grid-cols-3 lg:px-5">
                        <SummaryMetric icon={Target} label="Media do recorte" value={`${detailSummary.media.toFixed(1)}%`} />
                        <SummaryMetric label="Melhor aderencia" value={`${detailSummary.melhor?.aderencia.toFixed(1) || '0.0'}%`} tone="positive" />
                        <SummaryMetric label="Melhor grupo" value={detailSummary.melhor?.label || 'N/A'} truncate />
                    </div>
                )}

                <div className="min-w-0 p-4 sm:p-5">
                    {viewMode === 'ranking' ? (
                        aderenciaSubPraca.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 animate-fade-in lg:grid-cols-2">
                                <BenchmarkPracas subPracas={aderenciaSubPraca} />
                            </div>
                        ) : <EmptyState text="Nenhum dado de ranking disponivel" />
                    ) : dataToRender.length > 0 ? (
                        <div key={viewMode} className="grid grid-cols-1 gap-3 animate-fade-in lg:grid-cols-2 2xl:grid-cols-3">
                            {dataToRender.map((item, index) => (
                                <OperationalDetailCard key={`${viewMode}-${index}`} data={item} index={index} />
                            ))}
                        </div>
                    ) : <EmptyState text="Nenhum dado disponivel" sub="Ajuste os filtros para visualizar os dados" />}
                </div>
            </CardContent>
        </Card>
    );
});

DashboardOperationalDetail.displayName = 'DashboardOperationalDetail';

const EmptyState = ({ text, sub }: { text: string; sub?: string }) => (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/80 py-12 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
        <BarChart3 className="mb-3 h-10 w-10 opacity-30" />
        <p className="text-sm font-semibold">{text}</p>
        {sub && <p className="mt-1 text-xs opacity-70">{sub}</p>}
    </div>
);

function SummaryMetric({
    icon: Icon,
    label,
    value,
    tone = 'default',
    truncate = false,
}: {
    icon?: React.ElementType;
    label: string;
    value: string;
    tone?: 'default' | 'positive';
    truncate?: boolean;
}) {
    return (
        <div className="min-w-0 rounded-2xl border border-slate-200/70 bg-white/90 px-3 py-2.5 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/50">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
            </div>
            <div
                className={[
                    "font-mono text-sm font-semibold",
                    truncate ? "truncate" : "",
                    tone === 'positive' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-950 dark:text-slate-50",
                ].join(' ')}
                title={value}
            >
                {value}
            </div>
        </div>
    );
}
