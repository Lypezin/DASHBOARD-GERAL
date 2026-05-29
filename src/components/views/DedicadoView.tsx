'use client';

import React from 'react';
import { AlertCircle, BarChart3, CheckCircle2, Clock, Download, LayoutDashboard, ListChecks, Table2, Trophy, Truck, Users, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnaliseTable } from '@/components/analise/AnaliseTable';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { cn } from '@/lib/utils';
import { safeLog } from '@/lib/errorHandler';
import { useTabData } from '@/hooks/data/useTabData';
import { useTabDataMapper } from '@/hooks/data/useTabDataMapper';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { AnaliseDiaOrigemTable } from './analise/components/AnaliseDiaOrigemTable';
import { EntregadoresMainContent } from './EntregadoresMainView';
import { exportarDedicadoParaExcel } from './dedicado/DedicadoExcelExport';
import {
  calculateAcceptanceRate,
  calculateCompletionRate,
  calculateHourlyAderencia,
  formatMetricPercentOrNA,
  normalizeMetricNumber,
} from './dedicado/metrics';
import {
  buildDedicadoFilterPayload,
} from './dedicado/rpcFallback';
import type { AderenciaDiaOrigem, AderenciaOrigem, CurrentUser, Entregador } from '@/types';
import type { FilterPayload } from '@/types/filters';
import { fetchDedicadoApi } from '@/utils/dedicado/fetchDedicadoApi';
import { createRequestKey } from '@/utils/request/createRequestKey';

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

type DedicadoDiaOrigemRow = AderenciaDiaOrigem & {
  dia_semana?: string;
  dia_da_semana?: string;
  data?: string;
  data_do_periodo?: string;
};

function buildDayDateMap(diaOrigem: AderenciaDiaOrigem[], filterPayload: FilterPayload) {
  const map: Record<string, string> = {};

  (diaOrigem as DedicadoDiaOrigemRow[]).forEach((dia) => {
    const dayName = dia.dia || dia.dia_semana || dia.dia_da_semana;
    const rawDate = dia.data || dia.data_do_periodo;
    if (!dayName || !rawDate || typeof rawDate !== 'string') return;

    const normalizedKey = dayName.split('-')[0].trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const parts = rawDate.split('T')[0].split('-');

    if (parts.length === 3) {
      const [, month, day] = parts;
      map[normalizedKey] = `${day}/${month}`;
    }
  });

  if (Object.keys(map).length > 0 || !filterPayload?.p_ano || !filterPayload?.p_semana) {
    return map;
  }

  try {
    const year = Number(filterPayload.p_ano);
    const week = Number(filterPayload.p_semana);
    const jan4 = new Date(year, 0, 4);
    const jan4Day = jan4.getDay() || 7;
    const monday1 = new Date(jan4.getTime());
    monday1.setDate(jan4.getDate() - (jan4Day - 1));

    const startOfSpecifiedWeek = new Date(monday1.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
    const nomesDias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];

    nomesDias.forEach((nome, index) => {
      const curr = new Date(startOfSpecifiedWeek.getTime() + index * 24 * 60 * 60 * 1000);
      const dStr = String(curr.getDate()).padStart(2, '0');
      const mStr = String(curr.getMonth() + 1).padStart(2, '0');
      map[nome] = `${dStr}/${mStr}`;
    });
  } catch {
    return map;
  }

  return map;
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
        setDedicadoError('Selecione uma organizacao para carregar os dados do DEDICADO.');
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
        const { data, error } = await fetchDedicadoApi<DedicadoOrigensPayload>('summary', requestWithMode);

        if (cancelled) return;

        if (error) {
          safeLog.error('Erro ao carregar resumo dedicado por origem:', error);
          setDedicadoError(
            shouldLoadDiaOrigem
              ? 'Nao foi possivel carregar Dia x Origem agora. Tente novamente ou ajuste o periodo.'
              : 'Nao foi possivel carregar o resumo do DEDICADO agora. As outras subguias continuam disponiveis.'
          );
          setDedicadoData((current) => ({
            ...current,
            ...(shouldLoadDiaOrigem ? { dia_origem: [] } : { origem: [], totais: {} }),
          }));
          return;
        }

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

  return (
    <div className="mx-auto flex w-full max-w-[1500px] min-w-0 flex-col gap-6 px-3 pb-10 sm:px-6 lg:px-8 animate-fade-in">
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
              Visao separada para restaurantes e origens, com entregadores, resumo por origem e matriz Dia x Origem no mesmo lugar.
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

            <div className="grid w-full grid-cols-2 gap-1.5 rounded-2xl border border-slate-200 bg-white/85 p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:grid-cols-3 xl:min-w-[720px] xl:grid-cols-5">
              {SUB_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeSubTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={cn(
                      'inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold transition-colors sm:gap-2 sm:px-3.5 sm:text-xs',
                      active
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 text-center leading-tight">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
});

DedicadoView.displayName = 'DedicadoView';

export default DedicadoView;

function DedicadoDashboard({
  loading,
  error,
  stats,
  topOrigens,
}: {
  loading: boolean;
  error?: string | null;
  stats: {
    entregadores: number;
    origens: number;
    ofertadas: number;
    aceitas: number;
    rejeitadas: number;
    completadas: number;
    segundos: number;
    segundosPlanejados?: number;
    taxaAceitacao: number;
    taxaRejeicao: number;
    taxaCompletude: number;
  };
  topOrigens: DedicadoOrigemRow[];
}) {
  if (loading) return <DashboardSkeleton contentOnly />;

  const cards = [
    { title: 'Entregadores', value: stats.entregadores.toLocaleString('pt-BR'), sub: 'ativos no filtro dedicado', icon: Users, color: 'text-blue-500' },
    { title: 'Origens', value: stats.origens.toLocaleString('pt-BR'), sub: 'restaurantes/origens no filtro', icon: BarChart3, color: 'text-indigo-500' },
    { title: 'Ofertadas', value: stats.ofertadas.toLocaleString('pt-BR'), sub: `${stats.taxaAceitacao.toFixed(1)}% aceitas`, icon: Truck, color: 'text-sky-500' },
    { title: 'Aceitas', value: stats.aceitas.toLocaleString('pt-BR'), sub: `${stats.taxaCompletude.toFixed(1)}% completadas`, icon: CheckCircle2, color: 'text-emerald-500' },
    { title: 'Rejeitadas', value: stats.rejeitadas.toLocaleString('pt-BR'), sub: `${stats.taxaRejeicao.toFixed(1)}% rejeicao`, icon: XCircle, color: 'text-rose-500' },
    { title: 'Horas', value: formatarHorasParaHMS(stats.segundos / 3600), sub: 'tempo entregue', icon: Clock, color: 'text-orange-500', compact: true },
  ];

  return (
    <div className="space-y-6">
      {error ? <DedicadoInlineNotice message={error} /> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title} className="min-w-0 border-slate-200/70 bg-white/90 shadow-sm transition-[border-color,box-shadow] hover:border-slate-300/80 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-900/85 dark:hover:border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="min-w-0 truncate text-sm font-semibold text-slate-500 dark:text-slate-400">{card.title}</CardTitle>
                <Icon className={cn('h-4 w-4 shrink-0', card.color)} />
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    'font-mono font-black text-slate-950 dark:text-white',
                    card.compact
                      ? 'break-words text-lg tracking-tighter sm:text-xl 2xl:text-xl'
                      : 'break-words text-xl 2xl:text-2xl'
                  )}
                  title={card.value}
                >
                  {card.value}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400" title={card.sub}>{card.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/85">
        <CardHeader>
          <CardTitle className="text-lg font-black text-slate-950 dark:text-white">Top origens</CardTitle>
        </CardHeader>
        <CardContent>
          {topOrigens.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {topOrigens.map((origem) => (
                <div key={origem.origem} className="min-w-0 rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/30">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <p className="min-w-0 break-words pr-1 text-sm font-bold leading-snug text-slate-800 dark:text-slate-100">{origem.origem}</p>
                    <span className="w-fit shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      Aderencia {formatMetricPercentOrNA(origem.aderencia_percentual, Boolean(origem.segundos_planejados))}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-950/60">
                      <span className="block font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Ofertadas</span>
                      <span className="mt-0.5 block font-mono font-black text-slate-700 dark:text-slate-200">{(origem.corridas_ofertadas || 0).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="rounded-xl bg-emerald-50 px-3 py-2 dark:bg-emerald-950/20">
                      <span className="block font-bold uppercase tracking-wide text-emerald-500 dark:text-emerald-400">Aceitas</span>
                      <span className="mt-0.5 block break-words font-mono font-black text-emerald-700 dark:text-emerald-300">
                        {(origem.corridas_aceitas || 0).toLocaleString('pt-BR')} ({formatMetricPercentOrNA(origem.taxa_aceitacao, Boolean(origem.corridas_ofertadas))})
                      </span>
                    </div>
                    <div className="rounded-xl bg-indigo-50 px-3 py-2 dark:bg-indigo-950/20">
                      <span className="block font-bold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">Completadas</span>
                      <span className="mt-0.5 block break-words font-mono font-black text-indigo-700 dark:text-indigo-300">
                        {(origem.corridas_completadas || 0).toLocaleString('pt-BR')} ({formatMetricPercentOrNA(origem.taxa_completude, Boolean(origem.corridas_aceitas))})
                      </span>
                    </div>
                    <div className="rounded-xl bg-orange-50 px-3 py-2 dark:bg-orange-950/20">
                      <span className="block font-bold uppercase tracking-wide text-orange-500 dark:text-orange-400">Horas</span>
                      <span className="mt-0.5 block break-words font-mono font-black text-orange-700 dark:text-orange-300">
                        {formatarHorasParaHMS((origem.segundos_realizados || 0) / 3600)}
                        {origem.segundos_planejados ? ` / ${formatarHorasParaHMS((origem.segundos_planejados || 0) / 3600)}` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Nenhuma origem encontrada no resumo do periodo atual.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DedicadoResumo({
  rows,
  loading,
  error,
}: {
  rows: Array<DedicadoOrigemRow & { label: string; horas_entregues?: string }>;
  loading: boolean;
  error?: string | null;
}) {
  if (loading) return <DashboardSkeleton contentOnly />;

  return (
    <Card className="min-w-0 overflow-hidden border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/85">
      <CardHeader>
        <CardTitle className="text-lg font-black text-slate-950 dark:text-white">Resumo por Origem</CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Dados agrupados por origem, respeitando os filtros atuais de periodo, cidade e organizacao.
        </p>
      </CardHeader>
      {error ? (
        <CardContent className="pb-0">
          <DedicadoInlineNotice message={error} />
        </CardContent>
      ) : null}
      <CardContent className="max-w-full overflow-hidden p-0">
        <AnaliseTable data={rows} labelColumn="Origem" />
      </CardContent>
    </Card>
  );
}

function DedicadoDiaOrigem({
  data,
  dayDateMap,
  loading,
  error,
}: {
  data: AderenciaDiaOrigem[];
  dayDateMap: Record<string, string>;
  loading: boolean;
  error?: string | null;
}) {
  if (loading) return <DashboardSkeleton contentOnly />;

  return (
    <Card className="min-w-0 overflow-hidden border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/85">
      <CardHeader>
        <CardTitle className="text-lg font-black text-slate-950 dark:text-white">Dia x Origem</CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Matriz migrada da guia Analise e filtrada para as origens do periodo atual.
        </p>
      </CardHeader>
      <CardContent className="min-w-0 p-3 sm:p-6">
        {error ? <DedicadoInlineNotice message={error} /> : null}
        <AnaliseDiaOrigemTable data={data} dayDateMap={dayDateMap} />
      </CardContent>
    </Card>
  );
}

function DedicadoRanking({ entregadores, loading }: { entregadores: Entregador[]; loading: boolean }) {
  if (loading) return <DashboardSkeleton contentOnly />;

  if (entregadores.length === 0) {
    return (
      <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/85">
        <CardContent className="p-10 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-700" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Ranking sem dados</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Ajuste os filtros ou aguarde a carga dos entregadores dedicados para montar o ranking.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 overflow-hidden border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/85">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-lg font-black text-slate-950 dark:text-white">Ranking de Aderencia</CardTitle>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Ordenado pela mesma aderencia usada na tabela de Entregadores do DEDICADO.
            </p>
          </div>
          <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            {entregadores.length.toLocaleString('pt-BR')} entregadores
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-4 text-left">#</th>
                <th className="px-5 py-4 text-left">Entregador</th>
                <th className="px-5 py-4 text-right">Aderencia</th>
                <th className="px-5 py-4 text-right">Completadas</th>
                <th className="px-5 py-4 text-right">Ofertadas</th>
                <th className="px-5 py-4 text-right">Aceitas</th>
                <th className="px-5 py-4 text-right">Rejeitadas</th>
                <th className="px-5 py-4 text-right">Horas</th>
                <th className="px-5 py-4 text-right">Rejeicao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {entregadores.map((entregador, index) => {
                const baixoVolume = normalizeMetricNumber(entregador.corridas_ofertadas) < 20;
                const positionClass = index === 0
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                  : index === 1
                    ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    : index === 2
                      ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300';

                return (
                  <tr key={`${entregador.id_entregador}-${index}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-950/50">
                    <td className="px-5 py-4">
                      <span className={cn('inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 font-black', positionClass)}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-900 dark:text-white">{entregador.nome_entregador || 'Sem nome'}</p>
                          {baixoVolume ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                              baixo volume
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">{entregador.id_entregador}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-black text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                        {normalizeMetricNumber(entregador.aderencia_percentual).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-semibold text-slate-700 dark:text-slate-200">{normalizeMetricNumber(entregador.corridas_completadas).toLocaleString('pt-BR')}</td>
                    <td className="px-5 py-4 text-right font-mono text-slate-600 dark:text-slate-300">{normalizeMetricNumber(entregador.corridas_ofertadas).toLocaleString('pt-BR')}</td>
                    <td className="px-5 py-4 text-right font-mono text-slate-600 dark:text-slate-300">{normalizeMetricNumber(entregador.corridas_aceitas).toLocaleString('pt-BR')}</td>
                    <td className="px-5 py-4 text-right font-mono text-slate-600 dark:text-slate-300">{normalizeMetricNumber(entregador.corridas_rejeitadas).toLocaleString('pt-BR')}</td>
                    <td className="px-5 py-4 text-right font-mono text-slate-600 dark:text-slate-300">{formatarHorasParaHMS(normalizeMetricNumber(entregador.total_segundos) / 3600)}</td>
                    <td className="px-5 py-4 text-right font-mono text-slate-600 dark:text-slate-300">{normalizeMetricNumber(entregador.rejeicao_percentual).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function DedicadoInlineNotice({ message }: { message: string }) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="font-semibold">{message}</p>
    </div>
  );
}
