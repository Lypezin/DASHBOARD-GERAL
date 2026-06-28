'use client';

import React from 'react';
import { LayoutDashboard, ListChecks, Table2, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTabData } from '@/hooks/data/useTabData';
import { useTabDataMapper } from '@/hooks/data/useTabDataMapper';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { EntregadoresMainContent } from './entregadores/EntregadoresMainContent';
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
import { createRequestKey } from '@/utils/request/createRequestKey';
import { useDedicadoOrigensData } from '@/hooks/data/useDedicadoOrigensData';

// Subcomponentes modulares do DEDICADO
import { DedicadoDashboard } from './dedicado/DedicadoDashboard';
import { DedicadoResumo } from './dedicado/DedicadoResumo';
import { DedicadoDiaOrigem, buildDayDateMap } from './dedicado/DedicadoDiaOrigem';
import { DedicadoRanking } from './dedicado/DedicadoRanking';
import { DedicadoInlineNotice } from './dedicado/DedicadoInlineNotice';
import { ViewContainer } from '@/components/layout/ViewContainer';
import { DedicadoHeader } from './dedicado/components/DedicadoHeader';

type DedicadoSubTab = 'dashboard' | 'entregadores' | 'ranking' | 'resumo' | 'dia_origem';

const SUB_TABS: { id: DedicadoSubTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'entregadores', label: 'Entregadores', icon: Users },
  { id: 'ranking', label: 'Ranking', icon: Trophy },
  { id: 'resumo', label: 'Resumo por Origem', icon: ListChecks },
  { id: 'dia_origem', label: 'Dia x Origem', icon: Table2 },
];

function normalizeDedicadoMetricRow<T extends AderenciaOrigem | AderenciaDiaOrigem>(item: T): T {
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
}

const DedicadoView = React.memo(function DedicadoView({
  filterPayload,
  currentUser,
}: {
  filterPayload: FilterPayload;
  currentUser: CurrentUser | null;
}) {
  const [activeSubTab, setActiveSubTab] = React.useState<DedicadoSubTab>('dashboard');
  
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
  const origemOrganizationId = React.useMemo(() => {
    return typeof origemPayload.p_organization_id === 'string'
      ? origemPayload.p_organization_id.trim()
      : '';
  }, [origemPayload.p_organization_id]);

  const { data: dedicadoData, loading: dedicadoLoading, error: dedicadoError } = useDedicadoOrigensData({ origemPayload, shouldLoadOrigemSummary, shouldLoadDiaOrigem, origemOrganizationId });

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
    () => (dedicadoData.origem || []).map(normalizeDedicadoMetricRow),
    [dedicadoData.origem]
  );
  const dedicatedDiaOrigem = React.useMemo(
    () => (dedicadoData.dia_origem || []).map(normalizeDedicadoMetricRow),
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
      <DedicadoHeader
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        subTabs={SUB_TABS}
        isExporting={isExporting}
        onExport={handleExportDedicado}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeSubTab}
          {...subTabMotionProps}
          className="w-full"
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
              <DedicadoInlineNotice message="Selecione uma organizacao para carregar os entregadores dedicados." />
            )
          ) : null}

          {activeSubTab === 'ranking' ? (
            hasOrganizationContext ? (
              <DedicadoRanking entregadores={rankingEntregadores} loading={loading} />
            ) : (
              <DedicadoInlineNotice message="Selecione uma organizacao para montar o ranking do DEDICADO." />
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
