'use client';

import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Entregador } from '@/types';
import { calculateHealthScore } from '@/components/ui/HealthBadge';
import { safeLog } from '@/lib/errorHandler';
import { cn } from '@/lib/utils';
import { buildDedicadoFilterPayload } from '../dedicado/rpcFallback';
import { calculateNormalAderencia, normalizeMetricNumber } from '../dedicado/metrics';
import type { FilterPayload } from '@/types/filters';
import { fetchDedicadoApi } from '@/utils/dedicado/fetchDedicadoApi';
import { createRequestKey } from '@/utils/request/createRequestKey';
import { fetchEntregadoresFirstSeen, formatFirstSeenDate } from './fetchEntregadoresFirstSeen';

// Subcomponentes modulares extraídos
import { EntregadorProfileHeader } from './components/EntregadorProfileHeader';
import { EntregadorMetricsGrid } from './components/EntregadorMetricsGrid';
import { EntregadorOrigemBreakdown } from './components/EntregadorOrigemBreakdown';

interface OrigemBreakdownRow {
    origem: string;
    corridas_ofertadas: number;
    corridas_aceitas: number;
    corridas_rejeitadas: number;
    corridas_completadas: number;
    segundos_realizados: number;
    aderencia_percentual: number;
    rejeicao_percentual: number;
    completude_percentual: number;
}

interface OrigemBreakdownPayload {
    origens?: OrigemBreakdownRow[];
    periodo_resolvido?: {
        ano?: number | null;
        semana?: number | null;
        auto_semana?: boolean;
    };
}

interface Props {
    entregador: Entregador | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    organizationId?: string;
    variant?: 'entregadores' | 'dedicado';
    filterPayload?: FilterPayload;
    requestScopeKey?: string;
}

export const EntregadorProfileDialog = React.memo(function EntregadorProfileDialog({
    entregador,
    open,
    onOpenChange,
    organizationId,
    variant = 'entregadores',
    filterPayload,
    requestScopeKey,
}: Props) {
    const isDedicado = variant === 'dedicado';
    const [origemBreakdown, setOrigemBreakdown] = React.useState<OrigemBreakdownRow[]>([]);
    const [origemLoading, setOrigemLoading] = React.useState(false);
    const [firstSeenDate, setFirstSeenDate] = React.useState<string | null>(entregador?.primeira_data_aparicao || null);
    const [firstSeenLoading, setFirstSeenLoading] = React.useState(false);

    const origemPayloadKey = React.useMemo(() => {
        if (!entregador || !isDedicado) return '';

        return createRequestKey(buildDedicadoFilterPayload(filterPayload, {
            p_entregador_id: entregador.id_entregador,
        }));
    }, [entregador, filterPayload, isDedicado]);

    React.useEffect(() => {
        let cancelled = false;

        async function loadOrigemBreakdown() {
            if (!open || !isDedicado || !origemPayloadKey) {
                setOrigemBreakdown([]);
                return;
            }

            setOrigemLoading(true);

            try {
                const payload = JSON.parse(origemPayloadKey) as Record<string, unknown>;
                const { data, error } = await fetchDedicadoApi<OrigemBreakdownPayload>('entregador', payload, requestScopeKey);

                if (cancelled) return;

                if (error) {
                    safeLog.error('Erro ao carregar origens do entregador:', error);
                    setOrigemBreakdown([]);
                    return;
                }

                setOrigemBreakdown(
                    Array.isArray(data?.origens)
                        ? data.origens.map((row) => ({
                            ...row,
                            corridas_ofertadas: normalizeMetricNumber(row.corridas_ofertadas),
                            corridas_aceitas: normalizeMetricNumber(row.corridas_aceitas),
                            corridas_rejeitadas: normalizeMetricNumber(row.corridas_rejeitadas),
                            corridas_completadas: normalizeMetricNumber(row.corridas_completadas),
                            segundos_realizados: normalizeMetricNumber(row.segundos_realizados),
                            aderencia_percentual: calculateNormalAderencia(row.corridas_completadas, row.corridas_ofertadas),
                            rejeicao_percentual: normalizeMetricNumber(row.rejeicao_percentual),
                            completude_percentual: normalizeMetricNumber(row.completude_percentual),
                        }))
                        : []
                );
            } catch (error) {
                if (!cancelled) {
                    safeLog.error('Erro inesperado ao carregar origens do entregador:', error);
                    setOrigemBreakdown([]);
                }
            } finally {
                if (!cancelled) setOrigemLoading(false);
            }
        }

        void loadOrigemBreakdown();

        return () => {
            cancelled = true;
        };
    }, [open, isDedicado, origemPayloadKey, requestScopeKey]);

    React.useEffect(() => {
        let cancelled = false;

        async function loadFirstSeenDate() {
            if (!open || !entregador?.id_entregador) {
                setFirstSeenDate(null);
                setFirstSeenLoading(false);
                return;
            }

            if (entregador.primeira_data_aparicao) {
                setFirstSeenDate(entregador.primeira_data_aparicao);
                setFirstSeenLoading(false);
                return;
            }

            setFirstSeenLoading(true);

            try {
                const firstSeenById = await fetchEntregadoresFirstSeen([entregador.id_entregador], organizationId);
                if (!cancelled) {
                    setFirstSeenDate(firstSeenById.get(entregador.id_entregador) || null);
                }
            } catch (error) {
                if (!cancelled) {
                    safeLog.error('Erro ao carregar primeira aparicao do entregador:', error);
                    setFirstSeenDate(null);
                }
            } finally {
                if (!cancelled) setFirstSeenLoading(false);
            }
        }

        void loadFirstSeenDate();

        return () => {
            cancelled = true;
        };
    }, [entregador, open, organizationId]);

    if (!entregador) return null;

    const hs = calculateHealthScore(
        entregador.aderencia_percentual,
        entregador.corridas_completadas,
        entregador.corridas_ofertadas,
        entregador.total_segundos
    );

    const firstSeenLabel = firstSeenLoading ? 'Carregando...' : formatFirstSeenDate(firstSeenDate);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                'subtle-scrollbar max-h-[90vh] w-[calc(100vw-1.5rem)] gap-0 overflow-x-hidden overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.58)] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 [&>button:last-child]:z-10 [&>button:last-child]:rounded-full [&>button:last-child]:bg-white/10 [&>button:last-child]:p-2 [&>button:last-child]:text-white [&>button:last-child]:opacity-100 [&>button:last-child]:hover:bg-white/20 [&>button:last-child]:focus:ring-white/60 [&>button:last-child]:focus:ring-offset-[#164d72]',
                isDedicado ? 'max-w-5xl' : 'max-w-4xl'
            )}>
                <EntregadorProfileHeader
                    nome={entregador.nome_entregador}
                    id={entregador.id_entregador}
                    grade={hs.grade}
                    score={hs.score}
                />

                <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                    <EntregadorMetricsGrid
                        entregador={entregador}
                        firstSeenLabel={firstSeenLabel}
                    />

                    {isDedicado ? (
                        <div className="px-5 py-6 sm:px-7">
                            <EntregadorOrigemBreakdown
                                origemBreakdown={origemBreakdown}
                                origemLoading={origemLoading}
                            />
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
});
