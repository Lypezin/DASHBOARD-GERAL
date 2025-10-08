'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// =================================================================================
// Interfaces e Tipos
// =================================================================================

interface Totals {
  ofertadas: number;
  aceitas: number;
  rejeitadas: number;
  completadas: number;
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

interface DimensoesDashboard {
  anos: number[];
  semanas: number[];
  pracas: string[];
  sub_pracas: string[];
  origens: string[];
}

interface DashboardResumoData {
  totais: {
    corridas_ofertadas: number;
    corridas_aceitas: number;
    corridas_rejeitadas: number;
    corridas_completadas: number;
  };
  semanal: AderenciaSemanal[];
  dia: AderenciaDia[];
  turno: AderenciaTurno[];
  sub_praca: AderenciaSubPraca[];
  origem: AderenciaOrigem[];
  dimensoes: DimensoesDashboard;
}

// =================================================================================
// Funções auxiliares
// =================================================================================

function buildFilterPayload(filters: Filters) {
  return {
    p_ano: filters.ano,
    p_semana: filters.semana,
    p_praca: filters.praca,
    p_sub_praca: filters.subPraca,
    p_origem: filters.origem,
  };
}

function getAderenciaColor(value: number): string {
  if (value >= 90) return 'text-emerald-600 dark:text-emerald-400';
  if (value >= 70) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function getAderenciaBgColor(value: number): string {
  if (value >= 90) return 'bg-emerald-50 dark:bg-emerald-950/30';
  if (value >= 70) return 'bg-amber-50 dark:bg-amber-950/30';
  return 'bg-rose-50 dark:bg-rose-950/30';
}

// =================================================================================
// Componentes UI
// =================================================================================

function TabButton({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
        active
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
          : 'text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/50'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
      {active && (
        <div className="absolute -bottom-0.5 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400"></div>
      )}
    </button>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  percentage, 
  percentageLabel,
  gradient 
}: { 
  title: string; 
  value: number; 
  icon: string; 
  percentage?: number;
  percentageLabel?: string;
  gradient: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:bg-slate-900">
      <div className={`absolute right-0 top-0 h-32 w-32 rounded-full opacity-10 blur-3xl ${gradient}`}></div>
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value.toLocaleString('pt-BR')}</p>
          {percentage !== undefined && (
            <div className="mt-3 flex items-center gap-2">
              <div className="rounded-lg bg-blue-50 px-2 py-1 dark:bg-blue-950/30">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {percentage.toFixed(1)}%
                </span>
              </div>
              {percentageLabel && (
                <span className="text-xs text-slate-500 dark:text-slate-400">{percentageLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-2xl shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function AderenciaCard({ 
  title, 
  planejado, 
  entregue, 
  percentual 
}: { 
  title: string; 
  planejado: string; 
  entregue: string; 
  percentual: number;
}) {
  const colorClass = getAderenciaColor(percentual);
  const bgClass = getAderenciaBgColor(percentual);

  return (
    <div className="group overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
        <div className={`rounded-xl px-3 py-1.5 ${bgClass}`}>
          <span className={`text-lg font-bold ${colorClass}`}>{percentual.toFixed(1)}%</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Planejado</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">{planejado}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Entregue</span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{entregue}</span>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${percentual >= 90 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : percentual >= 70 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-rose-500 to-rose-600'}`}
          style={{ width: `${Math.min(percentual, 100)}%` }}
        ></div>
      </div>
    </div>
  );
}

function DayCard({ day, data }: { day: string; data?: AderenciaDia }) {
  if (!data) {
    return (
      <div className="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800/50">
        <p className="text-sm font-semibold text-slate-400">{day}</p>
        <p className="mt-2 text-xs text-slate-400">Sem dados</p>
      </div>
    );
  }

  const colorClass = getAderenciaColor(data.aderencia_percentual);
  const bgClass = getAderenciaBgColor(data.aderencia_percentual);

  return (
    <div className="group overflow-hidden rounded-xl bg-white p-4 shadow-md transition-all duration-300 hover:shadow-lg dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold text-slate-900 dark:text-white">{day}</p>
        <div className={`rounded-lg px-2 py-1 ${bgClass}`}>
          <span className={`text-xs font-bold ${colorClass}`}>{data.aderencia_percentual.toFixed(0)}%</span>
        </div>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Planejado:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{data.horas_a_entregar}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Entregue:</span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">{data.horas_entregues}</span>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${data.aderencia_percentual >= 90 ? 'bg-emerald-500' : data.aderencia_percentual >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
          style={{ width: `${Math.min(data.aderencia_percentual, 100)}%` }}
        ></div>
      </div>
    </div>
  );
}

function FiltroSelect({ label, placeholder, options, value, onChange }: {
  label: string;
  placeholder: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string | null) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">{label}</span>
      <select
        className="rounded-xl border-2 border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-blue-900 shadow-sm transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-100 dark:focus:border-blue-600 dark:focus:ring-blue-900/30"
        value={value}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FiltroBar({
  filters,
  setFilters,
  anos,
  semanas,
  pracas,
  subPracas,
  origens,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  anos: number[];
  semanas: number[];
  pracas: FilterOption[];
  subPracas: FilterOption[];
  origens: FilterOption[];
}) {
  const handleChange = (key: keyof Filters, rawValue: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: rawValue === '' || rawValue === null ? null : key === 'ano' || key === 'semana' ? Number(rawValue) : rawValue,
    }));
  };

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      <FiltroSelect
        label="Ano"
        value={filters.ano !== null ? String(filters.ano) : ''}
        options={anos.map((ano) => ({ value: String(ano), label: String(ano) }))}
        placeholder="Todos"
        onChange={(value) => handleChange('ano', value)}
      />
      <FiltroSelect
        label="Semana"
        value={filters.semana !== null ? String(filters.semana) : ''}
        options={semanas.map((sem) => ({ value: String(sem), label: `S${sem.toString().padStart(2, '0')}` }))}
        placeholder="Todas"
        onChange={(value) => handleChange('semana', value)}
      />
      <FiltroSelect
        label="Praça"
        value={filters.praca ?? ''}
        options={pracas}
        placeholder="Todas"
        onChange={(value) => handleChange('praca', value)}
      />
      <FiltroSelect
        label="Sub praça"
        value={filters.subPraca ?? ''}
        options={subPracas}
        placeholder="Todas"
        onChange={(value) => handleChange('subPraca', value)}
      />
      <FiltroSelect
        label="Origem"
        value={filters.origem ?? ''}
        options={origens}
        placeholder="Todas"
        onChange={(value) => handleChange('origem', value)}
      />
    </div>
  );
}

// =================================================================================
// Views Principais
// =================================================================================

function DashboardView({
  aderenciaGeral,
  aderenciaDia,
  aderenciaTurno,
  aderenciaSubPraca,
  aderenciaOrigem,
}: {
  aderenciaGeral?: AderenciaSemanal;
  aderenciaDia: AderenciaDia[];
  aderenciaTurno: AderenciaTurno[];
  aderenciaSubPraca: AderenciaSubPraca[];
  aderenciaOrigem: AderenciaOrigem[];
}) {
  const [viewMode, setViewMode] = useState<'turno' | 'sub_praca' | 'origem'>('turno');

  const diasOrdenados = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const diasData = diasOrdenados.map((dia) => ({
    dia,
    data: aderenciaDia.find((d) => d.dia_da_semana === dia),
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Aderência Geral */}
      {aderenciaGeral && (
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-100">Aderência Geral</h2>
              <p className="mt-1 text-4xl font-bold text-white">{aderenciaGeral.aderencia_percentual.toFixed(1)}%</p>
              <div className="mt-4 flex gap-6 text-sm">
                <div>
                  <span className="text-blue-200">Planejado:</span>
                  <span className="ml-2 font-bold text-white">{aderenciaGeral.horas_a_entregar}</span>
                </div>
                <div>
                  <span className="text-blue-200">Entregue:</span>
                  <span className="ml-2 font-bold text-white">{aderenciaGeral.horas_entregues}</span>
                </div>
              </div>
            </div>
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <span className="text-5xl">📊</span>
            </div>
          </div>
        </div>
      )}

      {/* Aderência por Dia */}
      <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-900">
        <h3 className="mb-6 text-lg font-bold text-slate-900 dark:text-white">Aderência por Dia da Semana</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
          {diasData.map(({ dia, data }) => (
            <DayCard key={dia} day={dia} data={data} />
          ))}
        </div>
      </div>

      {/* Seletor de Visualização */}
      <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-900">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Visualizações Adicionais</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('turno')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                viewMode === 'turno'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              Por Turno
            </button>
            <button
              onClick={() => setViewMode('sub_praca')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                viewMode === 'sub_praca'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              Por Sub-Praça
            </button>
            <button
              onClick={() => setViewMode('origem')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                viewMode === 'origem'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              Por Origem
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {viewMode === 'turno' &&
            aderenciaTurno.map((item) => (
              <AderenciaCard
                key={item.periodo}
                title={item.periodo}
                planejado={item.horas_a_entregar}
                entregue={item.horas_entregues}
                percentual={item.aderencia_percentual}
              />
            ))}
          {viewMode === 'sub_praca' &&
            aderenciaSubPraca.map((item) => (
              <AderenciaCard
                key={item.sub_praca}
                title={item.sub_praca}
                planejado={item.horas_a_entregar}
                entregue={item.horas_entregues}
                percentual={item.aderencia_percentual}
              />
            ))}
          {viewMode === 'origem' &&
            aderenciaOrigem.map((item) => (
              <AderenciaCard
                key={item.origem}
                title={item.origem}
                planejado={item.horas_a_entregar}
                entregue={item.horas_entregues}
                percentual={item.aderencia_percentual}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

function AnaliseView({ totals, aderenciaGeral }: { totals: Totals; aderenciaGeral?: AderenciaSemanal }) {
  const taxaAceitacao = totals.ofertadas > 0 ? (totals.aceitas / totals.ofertadas) * 100 : 0;
  const taxaCompletude = totals.aceitas > 0 ? (totals.completadas / totals.aceitas) * 100 : 0;
  const taxaRejeicao = totals.ofertadas > 0 ? (totals.rejeitadas / totals.ofertadas) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Corridas Ofertadas"
          value={totals.ofertadas}
          icon="📢"
          gradient="from-blue-500 to-cyan-500"
        />
        <MetricCard
          title="Corridas Aceitas"
          value={totals.aceitas}
          icon="✅"
          percentage={taxaAceitacao}
          percentageLabel="taxa de aceitação"
          gradient="from-emerald-500 to-teal-500"
        />
        <MetricCard
          title="Corridas Rejeitadas"
          value={totals.rejeitadas}
          icon="❌"
          percentage={taxaRejeicao}
          percentageLabel="taxa de rejeição"
          gradient="from-rose-500 to-pink-500"
        />
        <MetricCard
          title="Corridas Completadas"
          value={totals.completadas}
          icon="🏁"
          percentage={taxaCompletude}
          percentageLabel="taxa de completude"
          gradient="from-violet-500 to-purple-500"
        />
      </div>

      {/* Resumo Operacional */}
      {aderenciaGeral && (
        <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-slate-900">
          <h3 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">Resumo Operacional</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 dark:from-blue-950/30 dark:to-indigo-950/30">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Aderência Geral</p>
              <p className="mt-2 text-3xl font-bold text-blue-900 dark:text-blue-100">{aderenciaGeral.aderencia_percentual.toFixed(1)}%</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-600 dark:text-blue-400">Planejado:</span>
                  <span className="font-semibold text-blue-900 dark:text-blue-100">{aderenciaGeral.horas_a_entregar}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600 dark:text-blue-400">Entregue:</span>
                  <span className="font-semibold text-blue-900 dark:text-blue-100">{aderenciaGeral.horas_entregues}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 dark:from-emerald-950/30 dark:to-teal-950/30">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Eficiência de Aceitação</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900 dark:text-emerald-100">{taxaAceitacao.toFixed(1)}%</p>
              <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
                {totals.aceitas.toLocaleString('pt-BR')} de {totals.ofertadas.toLocaleString('pt-BR')} corridas
              </p>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 p-6 dark:from-violet-950/30 dark:to-purple-950/30">
              <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">Eficiência de Completude</p>
              <p className="mt-2 text-3xl font-bold text-violet-900 dark:text-violet-100">{taxaCompletude.toFixed(1)}%</p>
              <p className="mt-4 text-sm text-violet-600 dark:text-violet-400">
                {totals.completadas.toLocaleString('pt-BR')} de {totals.aceitas.toLocaleString('pt-BR')} aceitas
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =================================================================================
// Componente Principal
// =================================================================================

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analise'>('dashboard');
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
  const abortRef = useRef<AbortController | null>(null);

  const aderenciaGeral = useMemo(() => aderenciaSemanal[0], [aderenciaSemanal]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const params = buildFilterPayload(filters);

      try {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const { data: resumoData, error: resumoError } = await supabase.rpc('dashboard_resumo', params);

        if (controller.signal.aborted) {
          return;
        }

        if (resumoError) {
          throw resumoError;
        }

        const resumo = resumoData as DashboardResumoData | null;

        const safeNumber = (value: number | string | null | undefined) =>
          value === null || value === undefined ? 0 : Number(value);

        const totalsRow = resumo?.totais;
        setTotals(
          totalsRow
            ? {
                ofertadas: safeNumber(totalsRow.corridas_ofertadas),
                aceitas: safeNumber(totalsRow.corridas_aceitas),
                rejeitadas: safeNumber(totalsRow.corridas_rejeitadas),
                completadas: safeNumber(totalsRow.corridas_completadas),
              }
            : { ofertadas: 0, aceitas: 0, rejeitadas: 0, completadas: 0 }
        );

        setAderenciaSemanal(resumo?.semanal ?? []);
        setAderenciaDia(resumo?.dia ?? []);
        setAderenciaTurno(resumo?.turno ?? []);
        setAderenciaSubPraca(resumo?.sub_praca ?? []);
        setAderenciaOrigem(resumo?.origem ?? []);

        const dimensoes = resumo?.dimensoes;
        setAnosDisponiveis(dimensoes?.anos ?? []);
        setSemanasDisponiveis(dimensoes?.semanas ?? []);
        setPracas((dimensoes?.pracas ?? []).map((p: string) => ({ value: p, label: p })));
        setSubPracas((dimensoes?.sub_pracas ?? []).map((sp: string) => ({ value: sp, label: sp })));
        setOrigens((dimensoes?.origens ?? []).map((origem: string) => ({ value: origem, label: origem })));

        setError(null);
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return;
        }
        console.error('Erro ao buscar dados do dashboard:', err);
        setError('Não foi possível carregar os dados. Verifique os filtros ou tente novamente.');
        setTotals(null);
        setAderenciaSemanal([]);
        setAderenciaDia([]);
        setAderenciaTurno([]);
        setAderenciaSubPraca([]);
        setAderenciaOrigem([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      abortRef.current?.abort();
    };
  }, [filters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="mx-auto max-w-[1600px] px-6 py-8">
        {loading && (
          <div className="flex h-[80vh] items-center justify-center">
            <div className="text-center">
              <div className="relative mx-auto h-16 w-16">
                <div className="absolute h-16 w-16 animate-ping rounded-full bg-blue-400 opacity-75"></div>
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
              <p className="mt-6 text-lg font-semibold text-blue-700 dark:text-blue-200">Carregando dashboard...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex h-[80vh] items-center justify-center">
            <div className="max-w-md rounded-2xl border-2 border-rose-200 bg-white p-8 text-center shadow-2xl dark:border-rose-900 dark:bg-slate-900">
              <div className="text-6xl">⚠️</div>
              <p className="mt-6 text-xl font-bold text-rose-900 dark:text-rose-100">Erro ao carregar dados</p>
              <p className="mt-3 text-rose-700 dark:text-rose-300">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {totals && !loading && !error && (
          <div className="space-y-6">
            {/* Header com filtros e tabs */}
            <div className="rounded-2xl border border-blue-200 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-blue-900 dark:bg-slate-900/80">
              <FiltroBar
                filters={filters}
                setFilters={setFilters}
                anos={anosDisponiveis}
                semanas={semanasDisponiveis}
                pracas={pracas}
                subPracas={subPracas}
                origens={origens}
              />
              <div className="mt-6 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent dark:via-blue-700"></div>
              <div className="mt-6 flex flex-wrap gap-3">
                <TabButton label="Dashboard" icon="📊" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <TabButton label="Análise Detalhada" icon="📈" active={activeTab === 'analise'} onClick={() => setActiveTab('analise')} />
              </div>
            </div>

            {/* Conteúdo */}
            <main>
              {activeTab === 'dashboard' && (
                <DashboardView
                  aderenciaGeral={aderenciaGeral}
                  aderenciaDia={aderenciaDia}
                  aderenciaTurno={aderenciaTurno}
                  aderenciaSubPraca={aderenciaSubPraca}
                  aderenciaOrigem={aderenciaOrigem}
                />
              )}
              {activeTab === 'analise' && <AnaliseView totals={totals} aderenciaGeral={aderenciaGeral} />}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}