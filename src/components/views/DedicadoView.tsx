'use client';

import React from 'react';
import { BarChart3, CheckCircle2, Clock, LayoutDashboard, ListChecks, Table2, Truck, Users, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnaliseTable } from '@/components/analise/AnaliseTable';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { cn } from '@/lib/utils';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { RPC_TIMEOUTS } from '@/constants/config';
import { useTabData } from '@/hooks/data/useTabData';
import { useTabDataMapper } from '@/hooks/data/useTabDataMapper';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { AnaliseDiaOrigemTable } from './analise/components/AnaliseDiaOrigemTable';
import { EntregadoresMainContent } from './EntregadoresMainView';
import type { AderenciaDiaOrigem, AderenciaOrigem, CurrentUser } from '@/types';
import type { FilterPayload } from '@/types/filters';

type DedicadoSubTab = 'dashboard' | 'entregadores' | 'resumo' | 'dia_origem';

const SUB_TABS: { id: DedicadoSubTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'entregadores', label: 'Entregadores', icon: Users },
  { id: 'resumo', label: 'Resumo por Origem', icon: ListChecks },
  { id: 'dia_origem', label: 'Dia x Origem', icon: Table2 },
];

type DedicadoOrigemRow = AderenciaOrigem & {
  segundos_realizados?: number;
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
  };
  origem?: DedicadoOrigemRow[];
  dia_origem?: AderenciaDiaOrigem[];
  periodo_resolvido?: {
    ano?: number | null;
    semana?: number | null;
    auto_semana?: boolean;
  };
}

function normalizeNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildDayDateMap(diaOrigem: AderenciaDiaOrigem[], filterPayload: FilterPayload) {
  const map: Record<string, string> = {};

  diaOrigem.forEach((dia) => {
    const dayName = dia.dia || (dia as any).dia_semana || (dia as any).dia_da_semana;
    const rawDate = (dia as any).data || (dia as any).data_do_periodo;
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
  const filterPayloadKey = React.useMemo(() => JSON.stringify(filterPayload), [filterPayload]);
  const dedicatedPayload = React.useMemo<FilterPayload>(
    () => JSON.parse(filterPayloadKey) as FilterPayload,
    [filterPayloadKey]
  );
  const shouldLoadEntregadores = activeSubTab === 'entregadores';
  const { data: tabData, loading } = useTabData(shouldLoadEntregadores ? 'dedicado' : 'dashboard', dedicatedPayload, currentUser);
  const { entregadoresData } = useTabDataMapper({ activeTab: 'dedicado', tabData });
  const origemPayload = React.useMemo(() => {
    const allowed = ['p_ano', 'p_semana', 'p_praca', 'p_sub_praca', 'p_data_inicial', 'p_data_final', 'p_organization_id'] as const;
    const payload: Record<string, unknown> = {};

    allowed.forEach((key) => {
      const value = dedicatedPayload[key];
      if (value !== null && value !== undefined && value !== '') {
        payload[key] = value;
      }
    });

    return payload;
  }, [dedicatedPayload]);
  const origemPayloadKey = React.useMemo(() => JSON.stringify(origemPayload), [origemPayload]);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchDedicadoOrigens() {
      setDedicadoLoading(true);

      try {
        const requestPayload = JSON.parse(origemPayloadKey) as Record<string, unknown>;
        const { data, error } = await safeRpc<DedicadoOrigensPayload>('dashboard_dedicado_origens', requestPayload, {
          timeout: RPC_TIMEOUTS.DEFAULT,
          validateParams: false,
        });

        if (cancelled) return;

        if (error) {
          safeLog.error('Erro ao carregar resumo dedicado por origem:', error);
          setDedicadoData({ origem: [], dia_origem: [] });
          return;
        }

        setDedicadoData({
          totais: data?.totais || {},
          origem: Array.isArray(data?.origem) ? data.origem : [],
          dia_origem: Array.isArray(data?.dia_origem) ? data.dia_origem : [],
          periodo_resolvido: data?.periodo_resolvido,
        });
      } catch (error) {
        if (!cancelled) {
          safeLog.error('Erro inesperado ao carregar dedicado por origem:', error);
          setDedicadoData({ origem: [], dia_origem: [] });
        }
      } finally {
        if (!cancelled) setDedicadoLoading(false);
      }
    }

    void fetchDedicadoOrigens();

    return () => {
      cancelled = true;
    };
  }, [origemPayloadKey]);

  const entregadores = React.useMemo(
    () => entregadoresData?.entregadores || [],
    [entregadoresData?.entregadores]
  );
  const dedicatedOrigem = React.useMemo(
    () => (dedicadoData.origem || [])
      .map((item) => ({
        ...item,
        corridas_ofertadas: normalizeNumber(item.corridas_ofertadas),
        corridas_aceitas: normalizeNumber(item.corridas_aceitas),
        corridas_rejeitadas: normalizeNumber(item.corridas_rejeitadas),
        corridas_completadas: normalizeNumber(item.corridas_completadas),
        segundos_realizados: normalizeNumber(item.segundos_realizados),
        aderencia_percentual: normalizeNumber(item.aderencia_percentual),
      })),
    [dedicadoData.origem]
  );
  const dedicatedDiaOrigem = React.useMemo(
    () => (dedicadoData.dia_origem || [])
      .map((item) => ({
        ...item,
        corridas_ofertadas: normalizeNumber(item.corridas_ofertadas),
        corridas_aceitas: normalizeNumber(item.corridas_aceitas),
        corridas_rejeitadas: normalizeNumber(item.corridas_rejeitadas),
        corridas_completadas: normalizeNumber(item.corridas_completadas),
        segundos_realizados: normalizeNumber(item.segundos_realizados),
        aderencia_percentual: normalizeNumber(item.aderencia_percentual),
      })),
    [dedicadoData.dia_origem]
  );
  const dedicatedTotals = React.useMemo(() => ({
    totalEntregadores: normalizeNumber(dedicadoData.totais?.total_entregadores),
    totalOrigens: normalizeNumber(dedicadoData.totais?.total_origens),
    ofertadas: normalizeNumber(dedicadoData.totais?.corridas_ofertadas),
    aceitas: normalizeNumber(dedicadoData.totais?.corridas_aceitas),
    rejeitadas: normalizeNumber(dedicadoData.totais?.corridas_rejeitadas),
    completadas: normalizeNumber(dedicadoData.totais?.corridas_completadas),
    segundos: normalizeNumber(dedicadoData.totais?.segundos_realizados),
  }), [dedicadoData.totais]);
  const dayDateMap = React.useMemo(
    () => buildDayDateMap(dedicatedDiaOrigem, filterPayload),
    [dedicatedDiaOrigem, filterPayload]
  );

  const stats = React.useMemo(() => {
    const entregadoresTotals = entregadores.reduce((acc, entregador) => {
      acc.ofertadas += entregador.corridas_ofertadas || 0;
      acc.aceitas += entregador.corridas_aceitas || 0;
      acc.rejeitadas += entregador.corridas_rejeitadas || 0;
      acc.completadas += entregador.corridas_completadas || 0;
      acc.segundos += entregador.total_segundos || 0;
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

  const resumoOrigemRows = React.useMemo(() => {
    return dedicatedOrigem.map((item) => ({
      ...item,
      label: item.origem,
      horas_entregues: item.horas_entregues || formatarHorasParaHMS((item.segundos_realizados || 0) / 3600),
    }));
  }, [dedicatedOrigem]);

  return (
    <div className="mx-auto flex w-full max-w-[1500px] min-w-0 flex-col gap-6 overflow-hidden px-3 pb-10 sm:px-6 lg:px-8 animate-fade-in">
      <div className="min-w-0 overflow-hidden rounded-3xl border border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5 shadow-sm dark:border-blue-900/40 dark:from-blue-950/30 dark:via-slate-950 dark:to-slate-950">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
              <BarChart3 className="h-3.5 w-3.5" />
              Origem
            </div>
            <h2 className="break-words text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              DEDICADO
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Visão separada para restaurantes/origens, com entregadores, resumo por origem e matriz Dia x Origem no mesmo lugar.
            </p>
          </div>

          <div className="flex max-w-full gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white/85 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 lg:max-w-[58%]">
            {SUB_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeSubTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all',
                    active
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeSubTab === 'dashboard' ? (
        <DedicadoDashboard loading={loading || dedicadoLoading} stats={stats} topOrigens={dedicatedOrigem.slice(0, 8)} />
      ) : null}

      {activeSubTab === 'entregadores' ? (
        <EntregadoresMainContent
          entregadoresData={entregadoresData}
          loading={loading}
          variant="dedicado"
        />
      ) : null}

      {activeSubTab === 'resumo' ? (
        <DedicadoResumo rows={resumoOrigemRows} loading={dedicadoLoading} />
      ) : null}

      {activeSubTab === 'dia_origem' ? (
        <DedicadoDiaOrigem data={dedicatedDiaOrigem} dayDateMap={dayDateMap} loading={dedicadoLoading} />
      ) : null}
    </div>
  );
});

DedicadoView.displayName = 'DedicadoView';

export default DedicadoView;

function DedicadoDashboard({
  loading,
  stats,
  topOrigens,
}: {
  loading: boolean;
  stats: {
    entregadores: number;
    origens: number;
    ofertadas: number;
    aceitas: number;
    rejeitadas: number;
    completadas: number;
    segundos: number;
    taxaAceitacao: number;
    taxaRejeicao: number;
    taxaCompletude: number;
  };
  topOrigens: AderenciaOrigem[];
}) {
  if (loading) return <DashboardSkeleton contentOnly />;

  const cards = [
    { title: 'Entregadores', value: stats.entregadores.toLocaleString('pt-BR'), sub: 'ativos no filtro dedicado', icon: Users, color: 'text-blue-500' },
    { title: 'Origens', value: stats.origens.toLocaleString('pt-BR'), sub: 'restaurantes/origens no filtro', icon: BarChart3, color: 'text-indigo-500' },
    { title: 'Ofertadas', value: stats.ofertadas.toLocaleString('pt-BR'), sub: `${stats.taxaAceitacao.toFixed(1)}% aceitas`, icon: Truck, color: 'text-sky-500' },
    { title: 'Aceitas', value: stats.aceitas.toLocaleString('pt-BR'), sub: `${stats.taxaCompletude.toFixed(1)}% completadas`, icon: CheckCircle2, color: 'text-emerald-500' },
    { title: 'Rejeitadas', value: stats.rejeitadas.toLocaleString('pt-BR'), sub: `${stats.taxaRejeicao.toFixed(1)}% rejeição`, icon: XCircle, color: 'text-rose-500' },
    { title: 'Horas', value: formatarHorasParaHMS(stats.segundos / 3600), sub: 'tempo entregue', icon: Clock, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title} className="min-w-0 border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="min-w-0 truncate text-sm font-semibold text-slate-500 dark:text-slate-400">{card.title}</CardTitle>
                <Icon className={cn('h-4 w-4 shrink-0', card.color)} />
              </CardHeader>
              <CardContent>
                <div className="truncate font-mono text-xl font-black text-slate-950 dark:text-white 2xl:text-2xl" title={card.value}>
                  {card.value}
                </div>
                <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400" title={card.sub}>{card.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-lg font-black text-slate-950 dark:text-white">Top origens</CardTitle>
        </CardHeader>
        <CardContent>
          {topOrigens.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {topOrigens.map((origem) => (
                <div key={origem.origem} className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-4">
                    <p className="min-w-0 break-words text-sm font-bold text-slate-800 dark:text-slate-100">{origem.origem}</p>
                    <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      {(origem.aderencia_percentual || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-3">
                    <span className="min-w-0 truncate">Ofertadas: <b>{(origem.corridas_ofertadas || 0).toLocaleString('pt-BR')}</b></span>
                    <span className="min-w-0 truncate">Aceitas: <b>{(origem.corridas_aceitas || 0).toLocaleString('pt-BR')}</b></span>
                    <span className="min-w-0 truncate">Completadas: <b>{(origem.corridas_completadas || 0).toLocaleString('pt-BR')}</b></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Nenhuma origem encontrada no resumo do período atual.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DedicadoResumo({ rows, loading }: { rows: any[]; loading: boolean }) {
  if (loading) return <DashboardSkeleton contentOnly />;

  return (
    <Card className="min-w-0 overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="text-lg font-black text-slate-950 dark:text-white">Resumo por Origem</CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Dados agrupados por origem, respeitando os filtros atuais de período, cidade e organização.
        </p>
      </CardHeader>
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
}: {
  data: AderenciaDiaOrigem[];
  dayDateMap: Record<string, string>;
  loading: boolean;
}) {
  if (loading) return <DashboardSkeleton contentOnly />;

  return (
    <Card className="min-w-0 overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="text-lg font-black text-slate-950 dark:text-white">Dia x Origem</CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Matriz migrada da guia Análise e filtrada para as origens do período atual.
        </p>
      </CardHeader>
      <CardContent className="min-w-0 p-3 sm:p-6">
        <AnaliseDiaOrigemTable data={data} dayDateMap={dayDateMap} />
      </CardContent>
    </Card>
  );
}
