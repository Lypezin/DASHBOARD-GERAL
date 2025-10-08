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
  if (value >= 90) return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
  if (value >= 70) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
  return 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800';
}

// =================================================================================
// Componentes UI
// =================================================================================

function TabButton({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
        active
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50'
      }`}
    >
      {icon} {label}
    </button>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  color = 'blue'
}: { 
  title: string; 
  value: number; 
  icon: string; 
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    red: 'from-rose-500 to-rose-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-md transition-all hover:shadow-lg dark:border-blue-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value.toLocaleString('pt-BR')}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${colorClasses[color]} text-2xl text-white shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function GaugeCard({ 
  title, 
  value, 
  percentage 
}: { 
  title: string; 
  value: number; 
  percentage: number;
}) {
  const colorClass = percentage >= 90 ? 'from-emerald-500 to-emerald-600' : percentage >= 70 ? 'from-amber-500 to-amber-600' : 'from-rose-500 to-rose-600';

  return (
    <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-md dark:border-blue-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      <div className="mt-4 flex items-center justify-center">
        <div className="relative h-32 w-32">
          <svg className="h-32 w-32 -rotate-90 transform">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-slate-200 dark:text-slate-700"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${(percentage / 100) * 351.86} 351.86`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className={colorClass.split(' ')[0].replace('from-', 'stop-')} />
                <stop offset="100%" className={colorClass.split(' ')[1].replace('to-', 'stop-')} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{percentage.toFixed(1)}%</span>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
        {value.toLocaleString('pt-BR')} corridas
      </p>
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
    <div className={`rounded-xl border p-4 ${bgClass}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        <span className={`text-xl font-bold ${colorClass}`}>{percentual.toFixed(1)}%</span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Planejado:</span>
          <span className="font-semibold text-slate-900 dark:text-white">{planejado}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Entregue:</span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">{entregue}</span>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/50 dark:bg-slate-800/50">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${percentual >= 90 ? 'bg-emerald-500' : percentual >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
          style={{ width: `${Math.min(percentual, 100)}%` }}
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
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">{label}</span>
      <select
        className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-900 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-100"
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
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
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

  return (
    <div className="space-y-6">
      {/* Aderência Geral */}
      {aderenciaGeral && (
        <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-600 to-indigo-600 p-6 shadow-lg dark:border-blue-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-blue-100">Aderência Geral</h2>
              <p className="mt-2 text-4xl font-bold text-white">{aderenciaGeral.aderencia_percentual?.toFixed(1) || '0.0'}%</p>
              <div className="mt-4 flex gap-6 text-sm">
                <div>
                  <span className="text-blue-100">Planejado:</span>
                  <span className="ml-2 font-bold text-white">{aderenciaGeral.horas_a_entregar}</span>
                </div>
                <div>
                  <span className="text-blue-100">Entregue:</span>
                  <span className="ml-2 font-bold text-white">{aderenciaGeral.horas_entregues}</span>
                </div>
              </div>
            </div>
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <span className="text-4xl">📊</span>
            </div>
          </div>
        </div>
      )}

      {/* Aderência por Dia */}
      <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-md dark:border-blue-800 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Aderência por Dia da Semana</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia) => {
            const data = aderenciaDia.find((d) => d.dia_da_semana === dia);
            if (!data) {
              return (
                <div key={dia} className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800">
                  <p className="text-sm font-semibold text-slate-400">{dia}</p>
                  <p className="mt-2 text-xs text-slate-400">Sem dados</p>
                </div>
              );
            }
            const colorClass = getAderenciaColor(data.aderencia_percentual);
            return (
              <div key={dia} className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{dia}</p>
                <p className={`mt-2 text-xl font-bold ${colorClass}`}>{data.aderencia_percentual?.toFixed(0) || '0'}%</p>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plan:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{data.horas_a_entregar}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ent:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{data.horas_entregues}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Aderência por Turno/Sub-Praça/Origem */}
      <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-md dark:border-blue-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Aderência Detalhada</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('turno')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                viewMode === 'turno'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              Por Turno
            </button>
            <button
              onClick={() => setViewMode('sub_praca')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                viewMode === 'sub_praca'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              Por Sub-Praça
            </button>
            <button
              onClick={() => setViewMode('origem')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                viewMode === 'origem'
                  ? 'bg-blue-600 text-white'
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

  return (
    <div className="space-y-6">
      {/* Métricas de Corridas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Corridas Ofertadas" value={totals.ofertadas} icon="📢" color="blue" />
        <MetricCard title="Corridas Aceitas" value={totals.aceitas} icon="✅" color="green" />
        <MetricCard title="Corridas Rejeitadas" value={totals.rejeitadas} icon="❌" color="red" />
        <MetricCard title="Corridas Completadas" value={totals.completadas} icon="🏁" color="purple" />
      </div>

      {/* Taxas e Aderência */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GaugeCard title="Taxa de Aceitação" value={totals.aceitas} percentage={taxaAceitacao} />
        <GaugeCard title="Taxa de Completude" value={totals.completadas} percentage={taxaCompletude} />
        {aderenciaGeral && (
          <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-md dark:border-blue-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Aderência Geral</h3>
            <p className="mt-4 text-center text-4xl font-bold text-blue-600 dark:text-blue-400">
              {aderenciaGeral.aderencia_percentual?.toFixed(1) || '0.0'}%
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Planejado:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{aderenciaGeral.horas_a_entregar}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Entregue:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{aderenciaGeral.horas_entregues}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resumo Operacional */}
      <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-md dark:border-blue-800 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Resumo Operacional</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Taxa de Aceitação</p>
            <p className="mt-2 text-2xl font-bold text-emerald-900 dark:text-emerald-100">{taxaAceitacao.toFixed(1)}%</p>
            <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
              {totals.aceitas.toLocaleString('pt-BR')} de {totals.ofertadas.toLocaleString('pt-BR')} corridas
            </p>
          </div>
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950/30">
            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Taxa de Completude</p>
            <p className="mt-2 text-2xl font-bold text-purple-900 dark:text-purple-100">{taxaCompletude.toFixed(1)}%</p>
            <p className="mt-2 text-sm text-purple-600 dark:text-purple-400">
              {totals.completadas.toLocaleString('pt-BR')} de {totals.aceitas.toLocaleString('pt-BR')} aceitas
            </p>
          </div>
        </div>
      </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        {loading && (
          <div className="flex h-[80vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
              <p className="mt-4 text-lg font-semibold text-blue-700 dark:text-blue-200">Carregando dashboard...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex h-[80vh] items-center justify-center">
            <div className="max-w-md rounded-xl border border-rose-200 bg-white p-8 text-center shadow-xl dark:border-rose-900 dark:bg-slate-900">
              <div className="text-5xl">⚠️</div>
              <p className="mt-4 text-xl font-bold text-rose-900 dark:text-rose-100">Erro ao carregar dados</p>
              <p className="mt-2 text-rose-700 dark:text-rose-300">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white shadow-md transition hover:bg-blue-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {totals && !loading && !error && (
          <div className="space-y-6">
            {/* Header com filtros e tabs */}
            <div className="rounded-xl border border-blue-200 bg-white/90 p-4 shadow-lg backdrop-blur-sm dark:border-blue-900 dark:bg-slate-900/90 sm:p-6">
              <FiltroBar
                filters={filters}
                setFilters={setFilters}
                anos={anosDisponiveis}
                semanas={semanasDisponiveis}
                pracas={pracas}
                subPracas={subPracas}
                origens={origens}
              />
              <div className="my-4 h-px bg-blue-200 dark:bg-blue-800"></div>
              <div className="flex flex-wrap gap-2">
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