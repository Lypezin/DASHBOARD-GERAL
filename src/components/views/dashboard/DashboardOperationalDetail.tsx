import React, { useMemo, useState } from 'react';
import { BarChart3, Layers3, Target } from 'lucide-react';
import { AderenciaDia, AderenciaOrigem, AderenciaSubPraca, AderenciaTurno } from '@/types';
import { SaasMetric, SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';
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
    sub_praca: 'Sub Praça',
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
        <SaasPanel>
            <SaasPanelHeader
                eyebrow="Quebra selecionada"
                title={`Visão por ${viewLabels[viewMode]}`}
                description={viewMode !== 'ranking' ? `${dataToRender.length} recortes analisados para investigar desvios operacionais.` : 'Ranking comparativo por sub-praça.'}
                icon={Layers3}
                tone="emerald"
                actions={<OperationalViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />}
            />

            {viewMode !== 'ranking' && dataToRender.length > 0 && (
                <div className="grid gap-3 border-b border-slate-200/70 bg-slate-50/60 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-900/30 sm:grid-cols-3 lg:px-5">
                    <SaasMetric icon={Target} label="Média do recorte" value={`${detailSummary.media.toFixed(1)}%`} />
                    <SaasMetric label="Melhor aderência" value={`${detailSummary.melhor?.aderencia.toFixed(1) || '0.0'}%`} tone="emerald" />
                    <SaasMetric label="Melhor grupo" value={detailSummary.melhor?.label || 'N/A'} truncate />
                </div>
            )}

            <div className="min-w-0 p-4 sm:p-5">
                {viewMode === 'ranking' ? (
                    aderenciaSubPraca.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 animate-fade-in lg:grid-cols-2">
                            <BenchmarkPracas subPracas={aderenciaSubPraca} />
                        </div>
                    ) : <EmptyState text="Nenhum dado de ranking disponível" />
                ) : dataToRender.length > 0 ? (
                    <div key={viewMode} className="grid grid-cols-1 gap-3 animate-fade-in lg:grid-cols-2 2xl:grid-cols-3">
                        {dataToRender.map((item, index) => (
                            <OperationalDetailCard key={`${viewMode}-${index}`} data={item} index={index} />
                        ))}
                    </div>
                ) : <EmptyState text="Nenhum dado disponível" sub="Ajuste os filtros para visualizar os dados" />}
            </div>
        </SaasPanel>
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
