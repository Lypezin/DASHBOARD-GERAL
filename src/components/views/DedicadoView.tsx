'use client';

import React from 'react';
import { BarChart3, Download, LayoutDashboard, ListChecks, Table2, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { safeLog } from '@/lib/errorHandler';
import { useTabData } from '@/hooks/data/useTabData';
import { useTabDataMapper } from '@/hooks/data/useTabDataMapper';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { EntregadoresMainContent } from './EntregadoresMainView';
import { exportarDedicadoParaExcel } from './dedicado/DedicadoExcelExport';
import {
  calculateAcceptanceRate,
  calculateCompletionRate,
  calculateHourlyAderencia,
  normalizeMetricNumber,
} from './dedicado/metrics';
import {
  buildDedicadoFilterPayload,
} from './dedicado/rpcFallback';
import type { AderenciaDiaOrigem, AderenciaOrigem, CurrentUser } from '@/types';
import type { FilterPayload } from '@/types/filters';
import { fetchDedicadoApi } from '@/utils/dedicado/fetchDedicadoApi';
import { createRequestKey } from '@/utils/request/createRequestKey';

// ImportaÃ§Ã£o dos subcomponentes modulares extraÃ­dos
import { DedicadoDashboard } from './dedicado/DedicadoDashboard';
import { DedicadoResumo } from './dedicado/DedicadoResumo';
import { DedicadoDiaOrigem, buildDayDateMap } from './dedicado/DedicadoDiaOrigem';
import { DedicadoRanking } from './dedicado/DedicadoRanking';
import { DedicadoInlineNotice } from './dedicado/DedicadoInlineNotice';
import { ViewContainer } from '@/components/layout/ViewContainer';

type DedicadoSubTab = 'dashboard' | 'entregadores' | 'ranking' | 'resumo' | 'dia_origem';

const SUB_TABS: { id: DedicadoSubTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'entregadores', label: 'Entregadores', icon: Users },
  { id: 'ranking', label: 'Ranking', icon: Trophy },
  { id: 'resumo', label: 'Resumo por Origem', icon: ListChecks },
  { id: 'dia_origem', label: 'Dia x Origem', icon: Table2 },
];

type DedicadoOrigemRow = AderenciaOrigem & {
  segundos_realizados?: number;
  segundos_planejados?: number;
  taxa_aceitacao?: number;
  taxa_completude?: number;
};

interface DedicadoOrigensPayload {
  totais?: {
    total_entregadores?: number;
    total_origens?: number;
    corridas_ofertadas?: number;
    corridas_aceitas?: number;
    corridas_rejeitadas?: number;
    corridas_completadas?: number;
    segundos_realizados?: number;
    segundos_planejados?: number;
  };
  origem?: DedicadoOrigemRow[];
  dia_origem?: AderenciaDiaOrigem[];
  periodo_resolvido?: {
    ano?: number | null;
    semana?: number | null;
    auto_semana?: boolean;
  };
}

const DEDICADO_ORIGENS_CACHE_TTL_MS = 5 * 60 * 1000;
const dedicadoOrigensCache = new Map<string, { timestamp: number; data: DedicadoOrigensPayload }>();
const dedicadoOrigensRequests = new Map<string, Promise<DedicadoOrigensPayload>>();

function getCachedDedicadoOrigens(cacheKey: string) {
  const cached = dedicadoOrigensCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > DEDICADO_ORIGENS_CACHE_TTL_MS) {
    dedicadoOrigensCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

async function fetchDedicadoOrigensWithDedupe(cacheKey: string, requestWithMode: Record<string, unknown>) {
  const activeRequest = dedicadoOrigensRequests.get(cacheKey);
  if (activeRequest) return activeRequest;

  const request = (async () => {
    const { data, error } = await fetchDedicadoApi<DedicadoOrigensPayload>('summary', requestWithMode);
    if (error) throw error;

    const normalized = {
      totais: data?.totais || {},
      origem: Array.isArray(data?.origem) ? data.origem : [],
      dia_origem: Array.isArray(data?.dia_origem) ? data.dia_origem : [],
      periodo_resolvido: data?.periodo_resolvido,
    };

    dedicadoOrigensCache.set(cacheKey, {
      timestamp: Date.now(),
      data: normalized,
    });

    return normalized;
  })().finally(() => {
    dedicadoOrigensRequests.delete(cacheKey);
  });

  dedicadoOrigensRequests.set(cacheKey, request);
  return request;
}

const DedicadoView = React.memo(function DedicadoView({
  filterPayload,
  currentUser,
}: {
  filterPayload: FilterPayload;
  currentUser: CurrentUser | null;
}) {
  const [activeSubTab, setActiveSubTab] = React.useState<DedicadoSubTab>('dashboard');
  const [dedicadoData, setDedicadoData] = React.useState<DedicadoOrigensPayload>({ origem: [], dia_origem: [] });
  const [dedicadoLoading, setDedicadoLoading] = React.useState(false);
  const [dedicadoError, setDedicadoError] = React.useState<string | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();
  const filterPayloadKey = React.useMemo(() => createRequestKey(filterPayload), [filterPayload]);
  const dedicatedPayload = React.useMemo<FilterPayload>(() => {
    const payload = JSON.parse(filterPayloadKey) as FilterPayload;
    const isIntervalMode = payload.p_filtro_modo === 'intervalo';
    const hasDateRange = Boolean(payload.p_data_inicial || payload.p_data_final);
    const hasExplicitWeek = payload.p_semana !== null && payload.p_semana !== undefined;
    const hasMultiWeekFilter = Array.isArray(payload.p_semanas) && payload.p_semanas.length > 0;

    if (!isIntervalMode && !hasDateRange && !hasExplicitWeek && !hasMultiWeekFilter && payload.p_ano) {
      // Marcador entendido apenas pelas RPCs v2 do DEDICADO: semana "Todas" = ano inteiro.
      payload.p_semana = 0;
    }

    return payload;
  }, [filterPayloadKey]);
  const hasOrganizationContext = typeof dedicatedPayload.p_organization_id === 'string'
    && dedicatedPayload.p_organization_id.trim().length > 0;
  const shouldLoadEntregadores = hasOrganizationContext && (activeSubTab === 'entregadores' || activeSubTab === 'ranking');
  const shouldLoadOrigemSummary = activeSubTab === 'dashboard' || activeSubTab === 'resumo';
  const shouldLoadDiaOrigem = activeSubTab === 'dia_origem';
  const { data: tabData, loading } = useTabData('dedicado', dedicatedPayload, currentUser, {
    enabled: shouldLoadEntregadores,
  });
  const { entregadoresData } = useTabDataMapper({ activeTab: 'dedicado', tabData });
  const origemPayload = React.useMemo(() => {
    return buildDedicadoFilterPayload(dedicatedPayload);
  }, [dedicatedPayload]);
  const origemPayloadKey = React.useMemo(() => createRequestKey(origemPayload), [origemPayload]);
  const origemOrganizationId = React.useMemo(() => {
    return typeof origemPayload.p_organization_id === 'string'
      ? origemPayload.p_organization_id.trim()
      : '';
  }, [origemPayload.p_organization_id]);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchDedicadoOrigens() {
      if (!shouldLoadOrigemSummary && !shouldLoadDiaOrigem) {
        setDedicadoLoading(false);
        setDedicadoError(null);
        return;
      }

      if (!origemOrganizationId) {
        setDedicadoLoading(false);
        setDedicadoError('Selecione uma organizaÃ§Ã£o para carregar os dados do DEDICADO.');
        setDedicadoData({ origem: [], dia_origem: [] });
        return;
      }

      setDedicadoLoading(true);
      setDedicadoError(null);

      try {
        const requestPayload = JSON.parse(origemPayloadKey) as Record<string, unknown>;
        const requestWithMode = {
          ...requestPayload,
          p_include_dia_origem: shouldLoadDiaOrigem,
        };
        const cacheKey = createRequestKey(requestWithMode);
        const cached = getCachedDedicadoOrigens(cacheKey);
        const data = cached || await fetchDedicadoOrigensWithDedupe(cacheKey, requestWithMode);

        if (cancelled) return;

        setDedicadoData({
          totais: data?.totais || {},
          origem: Array.isArray(data?.origem) ? data.origem : [],
          dia_origem: shouldLoadDiaOrigem && Array.isArray(data?.dia_origem) ? data.dia_origem : [],
          periodo_resolvido: data?.periodo_resolvido,
        });
      } catch (error) {
        if (!cancelled) {
          safeLog.error('Erro inesperado ao carregar dedicado por origem:', error);
          setDedicadoError('Erro inesperado ao carregar o DEDICADO. Tente novamente em alguns instantes.');
        }
      } finally {
        if (!cancelled) setDedicadoLoading(false);
      }
    }

    void fetchDedicadoOrigens();

    return () => {
      cancelled = true;
    };
  }, [origemOrganizationId, origemPayloadKey, shouldLoadDiaOrigem, shouldLoadOrigemSummary]);

  const entregadores = React.useMemo(
    () => entregadoresData?.entregadores || [],
    [entregadoresData?.entregadores]
  );
  const rankingEntregadores = React.useMemo(
    () => [...entregadores].sort((a, b) => {
      const aderenciaDiff = normalizeMetricNumber(b.aderencia_percentual) - normalizeMetricNumber(a.aderencia_percentual);
      if (aderenciaDiff !== 0) return aderenciaDiff;

      const completadasDiff = normalizeMetricNumber(b.corridas_completadas) - normalizeMetricNumber(a.corridas_completadas);
      if (completadasDiff !== 0) return completadasDiff;

      return normalizeMetricNumber(b.corridas_ofertadas) - normalizeMetricNumber(a.corridas_ofertadas);
    }),
    [entregadores]
  );
  const dedicatedOrigem = React.useMemo(
    () => (dedicadoData.origem || [])
      .map((item) => {
        const corridasOfertadas = normalizeMetricNumber(item.corridas_ofertadas);
        const corridasAceitas = normalizeMetricNumber(item.corridas_aceitas);
        const corridasCompletadas = normalizeMetricNumber(item.corridas_completadas);
        const segundosRealizados = normalizeMetricNumber(item.segundos_realizados);
        const segundosPlanejados = normalizeMetricNumber(item.segundos_planejados);

        return {
          ...item,
          corridas_ofertadas: corridasOfertadas,
          corridas_aceitas: corridasAceitas,
          corridas_rejeitadas: normalizeMetricNumber(item.corridas_rejeitadas),
          corridas_completadas: corridasCompletadas,
          segundos_realizados: segundosRealizados,
          segundos_planejados: segundosPlanejados,
          aderencia_percentual: calculateHourlyAderencia(segundosRealizados, segundosPlanejados),
          taxa_aceitacao: calculateAcceptanceRate(corridasAceitas, corridasOfertadas),
          taxa_completude: calculateCompletionRate(corridasCompletadas, corridasAceitas),
        };
      }),
    [dedicadoData.origem]
  );
  const dedicatedDiaOrigem = React.useMemo(
    () => (dedicadoData.dia_origem || [])
      .map((item) => {
        const corridasOfertadas = normalizeMetricNumber(item.corridas_ofertadas);
        const corridasAceitas = normalizeMetricNumber(item.corridas_aceitas);
        const corridasCompletadas = normalizeMetricNumber(item.corridas_completadas);
        const segundosRealizados = normalizeMetricNumber(item.segundos_realizados);
        const segundosPlanejados = normalizeMetricNumber(item.segundos_planejados);

        return {
          ...item,
          corridas_ofertadas: corridasOfertadas,
          corridas_aceitas: corridasAceitas,
          corridas_rejeitadas: normalizeMetricNumber(item.corridas_rejeitadas),
          corridas_completadas: corridasCompletadas,
          segundos_realizados: segundosRealizados,
          segundos_planejados: segundosPlanejados,
          aderencia_percentual: calculateHourlyAderencia(segundosRealizados, segundosPlanejados),
          taxa_aceitacao: calculateAcceptanceRate(corridasAceitas, corridasOfertadas),
          taxa_completude: calculateCompletionRate(corridasCompletadas, corridasAceitas),
        };
      }),
    [dedicadoData.dia_origem]
  );
  const dedicatedTotals = React.useMemo(() => ({
    totalEntregadores: normalizeMetricNumber(dedicadoData.totais?.total_entregadores),
    totalOrigens: normalizeMetricNumber(dedicadoData.totais?.total_origens),
    ofertadas: normalizeMetricNumber(dedicadoData.totais?.corridas_ofertadas),
    aceitas: normalizeMetricNumber(dedicadoData.totais?.corridas_aceitas),
    rejeitadas: normalizeMetricNumber(dedicadoData.totais?.corridas_rejeitadas),
    completadas: normalizeMetricNumber(dedicadoData.totais?.corridas_completadas),
    segundos: normalizeMetricNumber(dedicadoData.totais?.segundos_realizados),
    segundosPlanejados: normalizeMetricNumber(dedicadoData.totais?.segundos_planejados),
  }), [dedicadoData.totais]);
  const dayDateMap = React.useMemo(
    () => buildDayDateMap(dedicatedDiaOrigem, filterPayload),
    [dedicatedDiaOrigem, filterPayload]
  );

  const stats = React.useMemo(() => {
    const entregadoresTotals = entregadores.reduce((acc, entregador) => {
      acc.ofertadas += normalizeMetricNumber(entregador.corridas_ofertadas);
      acc.aceitas += normalizeMetricNumber(entregador.corridas_aceitas);
      acc.rejeitadas += normalizeMetricNumber(entregador.corridas_rejeitadas);
      acc.completadas += normalizeMetricNumber(entregador.corridas_completadas);
      acc.segundos += normalizeMetricNumber(entregador.total_segundos);
      return acc;
    }, { ofertadas: 0, aceitas: 0, rejeitadas: 0, completadas: 0, segundos: 0 });
    const totals = {
      ofertadas: dedicatedTotals.ofertadas || entregadoresTotals.ofertadas,
      aceitas: dedicatedTotals.aceitas || entregadoresTotals.aceitas,
      rejeitadas: dedicatedTotals.rejeitadas || entregadoresTotals.rejeitadas,
      completadas: dedicatedTotals.completadas || entregadoresTotals.completadas,
      segundos: dedicatedTotals.segundos || entregadoresTotals.segundos,
    };

    return {
      ...totals,
      entregadores: dedicatedTotals.totalEntregadores || entregadores.length,
      origens: dedicatedTotals.totalOrigens || dedicatedOrigem.length,
      taxaAceitacao: totals.ofertadas > 0 ? (totals.aceitas / totals.ofertadas) * 100 : 0,
      taxaRejeicao: totals.ofertadas > 0 ? (totals.rejeitadas / totals.ofertadas) * 100 : 0,
      taxaCompletude: totals.aceitas > 0 ? (totals.completadas / totals.aceitas) * 100 : 0,
    };
  }, [dedicatedOrigem.length, dedicatedTotals, entregadores]);

  const handleExportDedicado = React.useCallback(async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      await exportarDedicadoParaExcel(dedicatedPayload);
    } finally {
      setIsExporting(false);
    }
  }, [dedicatedPayload, isExporting]);

  const resumoOrigemRows = React.useMemo(() => {
    return dedicatedOrigem.map((item) => ({
      ...item,
      label: item.origem,
      horas_entregues: item.horas_entregues || formatarHorasParaHMS((item.segundos_realizados || 0) / 3600),
    }));
  }, [dedicatedOrigem]);

  const subTabMotionProps = {
    initial: shouldReduceMotion ? false : { opacity: 0, y: 6 },
    animate: shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
    exit: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 },
    transition: { duration: shouldReduceMotion ? 0.01 : 0.13, ease: [0.22, 1, 0.36, 1] },
  } as const;

  return (
    <ViewContainer className="flex min-w-0 flex-col gap-6 pb-10">
      <div className="min-w-0 overflow-hidden rounded-3xl border border-blue-200/60 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5 shadow-sm dark:border-blue-900/40 dark:from-blue-950/30 dark:via-slate-950 dark:to-slate-950 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
              <BarChart3 className="h-3.5 w-3.5" />
              Origem
            </div>
            <h2 className="break-words text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              DEDICADO
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              VisÃ£o separada para restaurantes e origens, com entregadores, resumo por origem e matriz Dia x Origem no mesmo lugar.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 xl:w-auto xl:items-end">
            <button
              type="button"
              onClick={handleExportDedicado}
              disabled={isExporting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-600 px-4 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-500/40 sm:w-auto xl:self-end"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exportando...' : 'Baixar Excel'}
            </button>

            <div className="grid w-full grid-cols-2 gap-1.5 rounded-2xl border border-slate-200 bg-white/85 p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:grid-cols-3 xl:grid-cols-5 xl:self-stretch">
              {SUB_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeSubTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={cn(
                      'relative inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold transition-all sm:gap-2 sm:px-3.5 sm:text-xs focus:outline-none',
                      active
                        ? 'text-white'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeSubTab"
                        className="absolute inset-0 rounded-xl bg-blue-600 shadow-sm shadow-blue-600/20"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className="h-4 w-4 shrink-0 relative z-10" />
                    <span className="min-w-0 text-center leading-tight relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeSubTab}
          {...subTabMotionProps}
          className="w-full transform-gpu will-change-transform"
        >
          {activeSubTab === 'dashboard' ? (
            <DedicadoDashboard loading={dedicadoLoading} error={dedicadoError} stats={stats} topOrigens={dedicatedOrigem.slice(0, 8)} />
          ) : null}

          {activeSubTab === 'entregadores' ? (
            hasOrganizationContext ? (
              <EntregadoresMainContent
                entregadoresData={entregadoresData}
                loading={loading}
                variant="dedicado"
                filterPayload={dedicatedPayload}
              />
            ) : (
              <DedicadoInlineNotice message="Selecione uma organizaÃ§Ã£o para carregar os entregadores dedicados." />
            )
          ) : null}

          {activeSubTab === 'ranking' ? (
            hasOrganizationContext ? (
              <DedicadoRanking entregadores={rankingEntregadores} loading={loading} />
            ) : (
              <DedicadoInlineNotice message="Selecione uma organizaÃ§Ã£o para montar o ranking do DEDICADO." />
            )
          ) : null}

          {activeSubTab === 'resumo' ? (
            <DedicadoResumo rows={resumoOrigemRows} loading={dedicadoLoading} error={dedicadoError} />
          ) : null}

          {activeSubTab === 'dia_origem' ? (
            <DedicadoDiaOrigem data={dedicatedDiaOrigem} dayDateMap={dayDateMap} loading={dedicadoLoading} error={dedicadoError} />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </ViewContainer>
  );
});

DedicadoView.displayName = 'DedicadoView';

export default DedicadoView;
