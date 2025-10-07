"use client";

import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Totals {
  ofertadas: number;
  aceitas: number;
  rejeitadas: number;
  completadas: number;
}

interface DashboardTotalsRow {
  corridas_ofertadas: number | string | null;
  corridas_aceitas: number | string | null;
  corridas_rejeitadas: number | string | null;
  corridas_completadas: number | string | null;
}

interface AderenciaSemanal {
  semana: string;
  horas_a_entregar: string;
  horas_entregues: string;
  aderencia_percentual: number;
}

interface AderenciaDia {
  dia_iso: number;
  dia_da_semana: string;
  horas_a_entregar: string;
  horas_entregues: string;
  aderencia_percentual: number;
}

interface AderenciaTurno {
  periodo: string;
  horas_a_entregar: string;
  horas_entregues: string;
  aderencia_percentual: number;
}

interface AderenciaSubPraca {
  sub_praca: string;
  horas_a_entregar: string;
  horas_entregues: string;
  aderencia_percentual: number;
}

interface AderenciaOrigem {
  origem: string;
  horas_a_entregar: string;
  horas_entregues: string;
  aderencia_percentual: number;
}

interface FilterOption {
  value: string;
  label: string;
}

interface Filters {
  ano: number | null;
  semana: number | null;
  praca: string | null;
  subPraca: string | null;
  origem: string | null;
}

type DimensoesDashboard = {
  anos: number[];
  semanas: number[];
  pracas: string[];
  sub_pracas: string[];
  origens: string[];
  map_sub_praca: { [key: string]: string[] };
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analise'>('dashboard');
  const [viewMode, setViewMode] = useState<'geral' | 'turno' | 'sub_praca' | 'origem'>('geral');
  const [totals, setTotals] = useState<Totals | null>(null);
  const [aderenciaSemanal, setAderenciaSemanal] = useState<AderenciaSemanal[]>([]);
  const [aderenciaDia, setAderenciaDia] = useState<AderenciaDia[]>([]);
  const [aderenciaTurno, setAderenciaTurno] = useState<AderenciaTurno[]>([]);
  const [aderenciaSubPraca, setAderenciaSubPraca] = useState<AderenciaSubPraca[]>([]);
  const [aderenciaOrigem, setAderenciaOrigem] = useState<AderenciaOrigem[]>([]);
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [semanasDisponiveis, setSemanasDisponiveis] = useState<number[]>([]);
  const [pracas, setPracas] = useState<FilterOption[]>([]);
  const [subPracas, setSubPracas] = useState<FilterOption[]>([]);
  const [origens, setOrigens] = useState<FilterOption[]>([]);
  const [filters, setFilters] = useState<Filters>({ ano: null, semana: null, praca: null, subPraca: null, origem: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const aderenciaGeral = useMemo(() => aderenciaSemanal[0], [aderenciaSemanal]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const { data: totalsData, error: totalsError } = await supabase.rpc('dashboard_totals');

      if (totalsError) {
        console.error('Erro ao buscar totais:', totalsError);
        setError('Não foi possível carregar os dados. Verifique a conexão com o Supabase.');
        setTotals(null);
      } else if (totalsData && Array.isArray(totalsData) && totalsData.length > 0) {
        const totalsRow = totalsData[0] as DashboardTotalsRow;
        const safeNumber = (value: number | string | null | undefined) => (value === null || value === undefined ? 0 : Number(value));

        setTotals({
          ofertadas: safeNumber(totalsRow.corridas_ofertadas),
          aceitas: safeNumber(totalsRow.corridas_aceitas),
          rejeitadas: safeNumber(totalsRow.corridas_rejeitadas),
          completadas: safeNumber(totalsRow.corridas_completadas),
        });
      } else {
        setTotals({ ofertadas: 0, aceitas: 0, rejeitadas: 0, completadas: 0 });
      }

      const params = buildFilterPayload(filters);

      const [
        semanal,
        porDia,
        porTurno,
        porSubPraca,
        porOrigem,
        filtrosDisponiveis,
      ] = await Promise.all([
        supabase.rpc('calcular_aderencia_semanal', params),
        supabase.rpc('calcular_aderencia_por_dia', params),
        supabase.rpc('calcular_aderencia_por_turno', params),
        supabase.rpc('calcular_aderencia_por_sub_praca', params),
        supabase.rpc('calcular_aderencia_por_origem', params),
        supabase.rpc('listar_dimensoes_dashboard'),
      ]);

      setAderenciaSemanal(!semanal.error ? ((semanal.data as AderenciaSemanal[]) || []) : []);
      setAderenciaDia(!porDia.error ? ((porDia.data as AderenciaDia[]) || []) : []);
      setAderenciaTurno(!porTurno.error ? ((porTurno.data as AderenciaTurno[]) || []) : []);
      setAderenciaSubPraca(!porSubPraca.error ? ((porSubPraca.data as AderenciaSubPraca[]) || []) : []);
      setAderenciaOrigem(!porOrigem.error ? ((porOrigem.data as AderenciaOrigem[]) || []) : []);

      if (!filtrosDisponiveis.error && filtrosDisponiveis.data) {
        const { anos, semanas, pracas: pracasData, sub_pracas: subPracasData, origens: origensData } = filtrosDisponiveis.data as DimensoesDashboard;
        setAnosDisponiveis(anos || []);
        setSemanasDisponiveis(semanas || []);
        setPracas((pracasData || []).map((p: string) => ({ value: p, label: p })));
        setSubPracas((subPracasData || []).map((sp: string) => ({ value: sp, label: sp })));
        setOrigens((origensData || []).map((origem: string) => ({ value: origem, label: origem })));
      }

      setLoading(false);
    }

    fetchData();
  }, [filters]);

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-4 px-6 py-5">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200"></div>
                <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-t-4 border-blue-600"></div>
              </div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-200">Carregando dados do dashboard...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-md rounded-2xl border border-blue-200 bg-white px-8 py-6 text-center shadow-lg dark:border-blue-700 dark:bg-slate-900">
              <div className="text-4xl">⚠️</div>
              <p className="mt-4 text-lg font-semibold text-blue-800 dark:text-blue-200">Não foi possível carregar os dados</p>
              <p className="mt-2 text-sm text-blue-600 dark:text-blue-300">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {totals && !loading && !error && (
          <div className="flex h-full flex-col gap-4 overflow-hidden">
            <div className="flex flex-shrink-0 flex-col gap-4 rounded-2xl border border-blue-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-blue-800 dark:bg-slate-900/70">
              <FiltroBar
                filters={filters}
                setFilters={setFilters}
                anos={anosDisponiveis}
                semanas={semanasDisponiveis}
                pracas={pracas}
                subPracas={subPracas}
                origens={origens}
              />
              <div className="flex items-center gap-3">
                <TabButton label="Dashboard" icon="📊" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <TabButton label="Análise" icon="📈" active={activeTab === 'analise'} onClick={() => setActiveTab('analise')} />
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {activeTab === 'dashboard' && (
                <DashboardView
                  aderenciaGeral={aderenciaGeral}
                  aderenciaSemanal={aderenciaSemanal}
                  aderenciaDia={aderenciaDia}
                  aderenciaTurno={aderenciaTurno}
                  aderenciaSubPraca={aderenciaSubPraca}
                  aderenciaOrigem={aderenciaOrigem}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                />
              )}
              {activeTab === 'analise' && <AnaliseView totals={totals} aderenciaGeral={aderenciaGeral} aderenciaSemanal={aderenciaSemanal} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface TabButtonProps {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ label, icon, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50'
      }`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

interface DashboardViewProps {
  aderenciaGeral?: AderenciaSemanal;
  aderenciaSemanal: AderenciaSemanal[];
  aderenciaDia: AderenciaDia[];
  aderenciaTurno: AderenciaTurno[];
  aderenciaSubPraca: AderenciaSubPraca[];
  aderenciaOrigem: AderenciaOrigem[];
  viewMode: 'geral' | 'turno' | 'sub_praca' | 'origem';
  setViewMode: (mode: 'geral' | 'turno' | 'sub_praca' | 'origem') => void;
}

function DashboardView({
  aderenciaGeral,
  aderenciaSemanal,
  aderenciaDia,
  aderenciaTurno,
  aderenciaSubPraca,
  aderenciaOrigem,
  viewMode,
  setViewMode,
}: DashboardViewProps) {
  const melhorDia = aderenciaDia.length > 0 ? aderenciaDia.reduce((prev, curr) => (curr.aderencia_percentual > prev.aderencia_percentual ? curr : prev)) : null;
  const piorDia = aderenciaDia.length > 0 ? aderenciaDia.reduce((prev, curr) => (curr.aderencia_percentual < prev.aderencia_percentual ? curr : prev)) : null;
  const melhorTurno = aderenciaTurno.length > 0 ? aderenciaTurno.reduce((prev, curr) => (curr.aderencia_percentual > prev.aderencia_percentual ? curr : prev)) : null;

  return (
    <div className="grid h-full grid-cols-12 grid-rows-6 gap-4">
      <section className="col-span-4 row-span-4 flex flex-col rounded-2xl border border-blue-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-blue-800 dark:bg-slate-900/80">
        <header className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg text-white shadow-sm">🎯</div>
          <div>
            <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100">Aderência Geral</h2>
            <p className="text-xs text-blue-600 dark:text-blue-300">Última semana calculada</p>
          </div>
        </header>
        <div className="mt-4 flex flex-1 flex-col gap-5">
          {aderenciaGeral ? (
            <>
              <div className="flex flex-1 items-center justify-center">
                <Gauge percentual={aderenciaGeral.aderencia_percentual} size="lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MetricChip label="Horas planejadas" value={aderenciaGeral.horas_a_entregar} accent="primary" />
                <MetricChip label="Horas entregues" value={aderenciaGeral.horas_entregues} accent="secondary" />
              </div>
              <div className="flex justify-center">
                <Badge value={aderenciaGeral.aderencia_percentual} size="lg" />
              </div>
            </>
          ) : (
            <EmptyState message="Sem dados consolidados." />
          )}
        </div>
      </section>

      <section className="col-span-8 row-span-4 flex flex-col rounded-2xl border border-blue-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-blue-800 dark:bg-slate-900/80">
        <header className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg text-white shadow-sm">📅</div>
          <div>
            <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100">Aderência por Dia</h2>
            <p className="text-xs text-blue-600 dark:text-blue-300">Comparativo entre os dias da semana</p>
          </div>
        </header>
        <div className="mt-4 flex flex-1 items-stretch gap-3">
          {aderenciaDia.length === 0 ? (
            <EmptyState message="Ainda não existem dados por dia." />
          ) : (
            <div className="grid flex-1 grid-cols-7 gap-3">
              {aderenciaDia.map((dia) => (
                <DayCard key={dia.dia_iso} dia={dia} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="col-span-8 row-span-2 flex flex-col rounded-2xl border border-blue-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-blue-800 dark:bg-slate-900/80">
        <header className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100">Visualizações adicionais</h3>
            <p className="text-xs text-blue-600 dark:text-blue-300">Explore os recortes de aderência</p>
          </div>
          <div className="flex gap-2">
            {[
              { key: 'geral', label: 'Resumo', icon: '📊' },
              { key: 'turno', label: 'Turnos', icon: '⏰' },
              { key: 'sub_praca', label: 'Sub praças', icon: '🏢' },
              { key: 'origem', label: 'Origem', icon: '🌐' },
            ].map((mode) => (
              <button
                key={mode.key}
                onClick={() => setViewMode(mode.key as typeof viewMode)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === mode.key
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50'
                }`}
              >
                {mode.icon} {mode.label}
              </button>
            ))}
          </div>
        </header>
        <div className="mt-4 flex flex-1 items-stretch">
          {viewMode === 'geral' && (
            <div className="grid flex-1 grid-cols-3 gap-3">
              <SummaryCard
                title="Histórico recente"
                value={aderenciaSemanal.slice(0, 3).map((semana) => semana.aderencia_percentual).reduce((acc, cur, _, arr) => acc + cur / (arr.length || 1), 0).toFixed(1) + '%'}
                subtitle="Média das últimas semanas"
              />
              <SummaryCard
                title="Melhor semana"
                value={aderenciaSemanal.reduce((prev, curr) => (curr.aderencia_percentual > prev.aderencia_percentual ? curr : prev), aderenciaSemanal[0] ?? { semana: 'N/D', aderencia_percentual: 0 }).aderencia_percentual.toFixed(1) + '%'}
                subtitle={aderenciaSemanal.length > 0 ? aderenciaSemanal.reduce((prev, curr) => (curr.aderencia_percentual > prev.aderencia_percentual ? curr : prev)).semana : 'Sem dados'}
              />
              <SummaryCard
                title="Participação por turno"
                value={`${aderenciaTurno.length} turnos`}
                subtitle="Monitorados no período"
              />
            </div>
          )}

          {viewMode === 'turno' && (
            <div className="grid flex-1 grid-cols-2 gap-3">
              {aderenciaTurno.length === 0 ? (
                <EmptyState message="Sem dados por turno." />
              ) : (
                aderenciaTurno.slice(0, 4).map((turno) => (
                  <CompactMetric key={turno.periodo} title={turno.periodo} direita={turno.horas_entregues} esquerda={turno.horas_a_entregar} percentual={turno.aderencia_percentual} />
                ))
              )}
            </div>
          )}

          {viewMode === 'sub_praca' && (
            <div className="grid flex-1 grid-cols-4 gap-3">
              {aderenciaSubPraca.length === 0 ? (
                <EmptyState message="Sem dados por sub praça." />
              ) : (
                aderenciaSubPraca.slice(0, 8).map((sub) => (
                  <MiniGauge key={sub.sub_praca} titulo={sub.sub_praca} percentual={sub.aderencia_percentual} />
                ))
              )}
            </div>
          )}

          {viewMode === 'origem' && (
            <div className="grid flex-1 grid-cols-4 gap-3">
              {aderenciaOrigem.length === 0 ? (
                <EmptyState message="Sem dados por origem." />
              ) : (
                aderenciaOrigem.slice(0, 8).map((origem) => (
                  <MiniGauge key={origem.origem} titulo={origem.origem} percentual={origem.aderencia_percentual} />
                ))
              )}
            </div>
          )}
        </div>
      </section>

      <section className="col-span-4 row-span-2 flex flex-col rounded-2xl border border-blue-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-blue-800 dark:bg-slate-900/80">
        <header className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg text-white shadow-sm">🔍</div>
          <div>
            <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100">Destaques</h3>
            <p className="text-xs text-blue-600 dark:text-blue-300">Melhores pontos da operação</p>
          </div>
        </header>
        <div className="mt-4 flex flex-1 flex-col justify-between gap-3">
          <HighlightItem titulo="Melhor dia" valor={melhorDia?.dia_da_semana ?? 'N/D'} percentual={melhorDia?.aderencia_percentual} />
          <HighlightItem titulo="Maior desafio" valor={piorDia?.dia_da_semana ?? 'N/D'} percentual={piorDia?.aderencia_percentual} invert />
          <HighlightItem titulo="Turno destaque" valor={melhorTurno?.periodo ?? 'N/D'} percentual={melhorTurno?.aderencia_percentual} />
        </div>
      </section>
    </div>
  );
}

interface AnaliseViewProps {
  totals: Totals;
  aderenciaGeral?: AderenciaSemanal;
  aderenciaSemanal: AderenciaSemanal[];
}

function AnaliseView({ totals, aderenciaGeral, aderenciaSemanal }: AnaliseViewProps) {
  const taxaAceitacao = totals.ofertadas > 0 ? (totals.aceitas / totals.ofertadas) * 100 : 0;
  const taxaCompletude = totals.aceitas > 0 ? (totals.completadas / totals.aceitas) * 100 : 0;

  return (
    <div className="grid h-full grid-cols-12 grid-rows-6 gap-4">
      <section className="col-span-12 row-span-3 grid grid-cols-12 gap-4">
        {[{ titulo: 'Ofertadas', valor: totals.ofertadas, icon: '🎯', cor: 'bg-blue-600' }, { titulo: 'Aceitas', valor: totals.aceitas, icon: '✅', cor: 'bg-blue-500' }, { titulo: 'Rejeitadas', valor: totals.rejeitadas, icon: '❌', cor: 'bg-blue-400' }, { titulo: 'Completadas', valor: totals.completadas, icon: '🏆', cor: 'bg-blue-700' }].map((metrica) => (
          <article key={metrica.titulo} className="col-span-3 flex flex-col justify-between rounded-2xl border border-blue-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-blue-800 dark:bg-slate-900/80">
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${metrica.cor} text-lg text-white shadow-sm`}>{metrica.icon}</div>
              <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">{metrica.valor.toLocaleString('pt-BR')}</span>
            </div>
            <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">{metrica.titulo}</h3>
          </article>
        ))}
      </section>

      <section className="col-span-12 row-span-3 grid grid-cols-12 gap-4">
        <article className="col-span-4 rounded-2xl border border-blue-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-blue-800 dark:bg-slate-900/80">
          <header className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg text-white shadow-sm">📊</div>
            <div>
              <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100">Taxa de Aceitação</h3>
              <p className="text-xs text-blue-600 dark:text-blue-300">Aceitas vs ofertadas</p>
            </div>
          </header>
          <div className="mt-6 flex justify-center">
            <Gauge percentual={taxaAceitacao} size="lg" />
          </div>
        </article>

        <article className="col-span-4 rounded-2xl border border-blue-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-blue-800 dark:bg-slate-900/80">
          <header className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg text-white shadow-sm">🎯</div>
            <div>
              <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100">Taxa de Completude</h3>
              <p className="text-xs text-blue-600 dark:text-blue-300">Completadas vs aceitas</p>
            </div>
          </header>
          <div className="mt-6 flex justify-center">
            <Gauge percentual={taxaCompletude} size="lg" />
          </div>
        </article>

        <article className="col-span-4 rounded-2xl border border-blue-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-blue-800 dark:bg-slate-900/80">
          <header className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg text-white shadow-sm">📈</div>
            <div>
              <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100">Resumo Operacional</h3>
              <p className="text-xs text-blue-600 dark:text-blue-300">Indicadores chave</p>
            </div>
          </header>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <SummaryCard title="Resposta" value={(totals.ofertadas > 0 ? ((totals.aceitas + totals.rejeitadas) / totals.ofertadas) * 100 : 0).toFixed(1) + '%'} subtitle="Ações sobre corridas" />
            <SummaryCard title="Eficiência" value={(totals.ofertadas > 0 ? (totals.completadas / totals.ofertadas) * 100 : 0).toFixed(1) + '%'} subtitle="Completadas vs ofertadas" />
            <SummaryCard title="Horas últimas semanas" value={(aderenciaSemanal.slice(0, 3).reduce((acc, semana) => acc + semana.aderencia_percentual, 0) / Math.max(aderenciaSemanal.slice(0, 3).length, 1)).toFixed(1) + '%'} subtitle="Média aderência" />
            <SummaryCard title="Semana atual" value={`${aderenciaGeral ? aderenciaGeral.aderencia_percentual.toFixed(1) : '0.0'}%`} subtitle={aderenciaGeral ? aderenciaGeral.semana : 'Semana não informada'} />
          </div>
        </article>
      </section>
    </div>
  );
}

function MetricChip({ label, value, accent }: { label: string; value: string; accent: 'primary' | 'secondary' }) {
  const accentClasses = accent === 'primary' ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
  return (
    <div className={`rounded-lg px-3 py-2 text-center ${accentClasses}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function SummaryCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="flex flex-col justify-center rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2 text-center dark:border-blue-800 dark:bg-blue-900/30">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">{title}</p>
      <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{value}</p>
      <p className="text-[11px] text-blue-600 dark:text-blue-300">{subtitle}</p>
    </div>
  );
}

function HighlightItem({ titulo, valor, percentual, invert }: { titulo: string; valor: string; percentual?: number; invert?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2 dark:border-blue-800 dark:bg-blue-900/30">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">{titulo}</p>
        <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{valor}</p>
      </div>
      {percentual !== undefined && <Badge value={percentual} size="md" emphasis={invert ? 'low' : 'high'} />}
    </div>
  );
}

function DayCard({ dia }: { dia: AderenciaDia }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-blue-100 bg-blue-50/80 p-3 text-center dark:border-blue-800 dark:bg-blue-900/40">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-200">{dia.dia_da_semana}</p>
      <div className="flex flex-1 items-center justify-center">
        <Gauge percentual={dia.aderencia_percentual} size="sm" />
      </div>
      <Badge value={dia.aderencia_percentual} size="sm" />
    </div>
  );
}

function CompactMetric({ title, esquerda, direita, percentual }: { title: string; esquerda: string; direita: string; percentual: number }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50/80 px-3 py-3 dark:border-blue-800 dark:bg-blue-900/40">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-200">{title}</p>
        <Badge value={percentual} size="sm" />
      </div>
      <div className="grid grid-cols-2 gap-2 text-center text-[11px] text-blue-700 dark:text-blue-200">
        <div className="rounded-lg bg-blue-100/70 px-2 py-1 dark:bg-blue-900/60">{esquerda}</div>
        <div className="rounded-lg bg-blue-100/70 px-2 py-1 dark:bg-blue-900/60">{direita}</div>
      </div>
    </div>
  );
}

function MiniGauge({ titulo, percentual }: { titulo: string; percentual: number }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/80 p-3 text-center dark:border-blue-800 dark:bg-blue-900/40">
      <p className="w-full truncate text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-200">{titulo}</p>
      <Gauge percentual={percentual} size="xs" />
      <Badge value={percentual} size="sm" />
    </div>
  );
}

function Gauge({ percentual, size = 'md' }: { percentual: number; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const clamped = Math.min(Math.max(percentual, 0), 100);
  const config = {
    xs: { radius: 18, stroke: 4, font: '10px' },
    sm: { radius: 26, stroke: 5, font: '11px' },
    md: { radius: 36, stroke: 6, font: '13px' },
    lg: { radius: 52, stroke: 8, font: '15px' },
  }[size];
  const circumference = 2 * Math.PI * config.radius;
  const offset = circumference * (1 - clamped / 100);

  const color = clamped >= 85 ? '#1e3a8a' : clamped >= 70 ? '#1d4ed8' : clamped >= 55 ? '#2563eb' : '#3b82f6';

  return (
    <div className="relative flex items-center justify-center" style={{ width: config.radius * 2, height: config.radius * 2 }}>
      <svg className="-rotate-90 transform" width={config.radius * 2} height={config.radius * 2}>
        <circle cx={config.radius} cy={config.radius} r={config.radius} fill="transparent" stroke="#dbeafe" strokeWidth={config.stroke} />
        <circle
          cx={config.radius}
          cy={config.radius}
          r={config.radius}
          fill="transparent"
          stroke={color}
          strokeWidth={config.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ color, fontSize: config.font }} className="font-semibold">
          {clamped.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function Badge({ value, size = 'md', emphasis = 'high' }: { value: number; size?: 'sm' | 'md' | 'lg'; emphasis?: 'high' | 'low' }) {
  let base = 'bg-blue-200 text-blue-900';
  if (value >= 85) base = 'bg-blue-700 text-white';
  else if (value >= 70) base = 'bg-blue-600 text-white';
  else if (value >= 55) base = 'bg-blue-500 text-white';
  else if (value < 55 && emphasis === 'low') base = 'bg-blue-200 text-blue-900';

  const padding = size === 'lg' ? 'px-4 py-1.5 text-sm' : size === 'md' ? 'px-3 py-1 text-xs' : 'px-2 py-[2px] text-[11px]';

  return <span className={`inline-flex items-center rounded-full font-semibold ${base} ${padding}`}>{value.toFixed(1)}%</span>;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center text-center text-sm text-blue-600 dark:text-blue-300">
      <div className="text-2xl">📊</div>
      <p className="mt-2 font-medium">{message}</p>
    </div>
  );
}

function buildFilterPayload(filters: Filters) {
  return {
    p_ano: filters.ano,
    p_semana: filters.semana,
    p_praca: filters.praca,
    p_sub_praca: filters.subPraca,
    p_origem: filters.origem,
  };
}

interface FiltroBarProps {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
  anos: number[];
  semanas: number[];
  pracas: FilterOption[];
  subPracas: FilterOption[];
  origens: FilterOption[];
}

function FiltroBar({ filters, setFilters, anos, semanas, pracas, subPracas, origens }: FiltroBarProps) {
  const handleChange = (key: keyof Filters, rawValue: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: rawValue === '' || rawValue === null ? null : key === 'ano' || key === 'semana' ? Number(rawValue) : rawValue,
    }));
  };

  return (
    <div className="grid grid-cols-5 gap-3">
      <FiltroSelect label="Ano" value={filters.ano !== null ? String(filters.ano) : ''} options={anos.map((ano) => ({ value: String(ano), label: String(ano) }))} placeholder="Todos" onChange={(value) => handleChange('ano', value)} />
      <FiltroSelect label="Semana" value={filters.semana !== null ? String(filters.semana) : ''} options={semanas.map((sem) => ({ value: String(sem), label: `S${sem.toString().padStart(2, '0')}` }))} placeholder="Todas" onChange={(value) => handleChange('semana', value)} />
      <FiltroSelect label="Praça" value={filters.praca ?? ''} options={pracas} placeholder="Todas" onChange={(value) => handleChange('praca', value)} />
      <FiltroSelect label="Sub praça" value={filters.subPraca ?? ''} options={subPracas} placeholder="Todas" onChange={(value) => handleChange('subPraca', value)} />
      <FiltroSelect label="Origem" value={filters.origem ?? ''} options={origens} placeholder="Todas" onChange={(value) => handleChange('origem', value)} />
    </div>
  );
}

interface FiltroSelectProps {
  label: string;
  placeholder: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string | null) => void;
}

function FiltroSelect({ label, placeholder, options, value, onChange }: FiltroSelectProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">{label}</span>
      <select
        className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-800 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-blue-700 dark:bg-slate-900 dark:text-blue-100 dark:focus:border-blue-500 dark:focus:ring-blue-800"
        value={value}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}