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

interface UtrGeral {
  tempo_horas: number;
  corridas: number;
  utr: number;
}

interface UtrPorPraca {
  praca: string;
  tempo_horas: number;
  corridas: number;
  utr: number;
}

interface UtrPorSubPraca {
  sub_praca: string;
  tempo_horas: number;
  corridas: number;
  utr: number;
}

interface UtrPorOrigem {
  origem: string;
  tempo_horas: number;
  corridas: number;
  utr: number;
}

interface UtrPorTurno {
  periodo: string;
  tempo_horas: number;
  corridas: number;
  utr: number;
}

interface UtrData {
  geral: UtrGeral;
  por_praca: UtrPorPraca[];
  por_sub_praca: UtrPorSubPraca[];
  por_origem: UtrPorOrigem[];
  por_turno: UtrPorTurno[];
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
  percentage,
  percentageLabel,
  color = 'blue'
}: { 
  title: string; 
  value: number; 
  icon: string; 
  percentage?: number;
  percentageLabel?: string;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-emerald-500 to-teal-500',
    red: 'from-rose-500 to-pink-500',
    purple: 'from-violet-500 to-purple-500',
  };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-md transition-all duration-300 hover:shadow-xl dark:bg-slate-900">
      <div className={`absolute right-0 top-0 h-32 w-32 rounded-full opacity-10 blur-3xl ${colorClasses[color]}`}></div>
      
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
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${colorClasses[color]} text-2xl text-white shadow-lg`}>
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
    <div className={`rounded-xl border p-4 ${bgClass}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        <span className={`text-xl font-bold ${colorClass}`}>{(percentual ?? 0).toFixed(1)}%</span>
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

function FiltroSelect({ label, placeholder, options, value, onChange, disabled = false }: {
  label: string;
  placeholder: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">{label}</span>
      <select
        className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-900 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        value={value}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
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
  currentUser,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  anos: number[];
  semanas: number[];
  pracas: FilterOption[];
  subPracas: FilterOption[];
  origens: FilterOption[];
  currentUser: { is_admin: boolean; assigned_pracas: string[] } | null;
}) {
  const handleChange = (key: keyof Filters, rawValue: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: rawValue === '' || rawValue === null ? null : key === 'ano' || key === 'semana' ? Number(rawValue) : rawValue,
    }));
  };

  // Verificar se deve desabilitar o filtro de praça
  const shouldDisablePracaFilter = Boolean(currentUser && !currentUser.is_admin && currentUser.assigned_pracas.length === 1);

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
        disabled={shouldDisablePracaFilter}
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
              <p className="mt-2 text-4xl font-bold text-white">{(aderenciaGeral.aderencia_percentual ?? 0).toFixed(1)}%</p>
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

      {/* Destaques da Operação */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-3 dark:border-emerald-800 dark:from-emerald-950/30 dark:to-teal-950/30">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
            <span className="text-base">📊</span>
            <p className="text-xs font-semibold">Melhor Dia</p>
          </div>
          <p className="mt-1.5 text-lg font-bold text-emerald-900 dark:text-emerald-100">
            {aderenciaDia.length > 0 
              ? aderenciaDia.reduce((max, dia) => (dia.aderencia_percentual ?? 0) > (max.aderencia_percentual ?? 0) ? dia : max).dia_da_semana
              : '-'}
          </p>
          <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
            {aderenciaDia.length > 0 
              ? `${aderenciaDia.reduce((max, dia) => (dia.aderencia_percentual ?? 0) > (max.aderencia_percentual ?? 0) ? dia : max).aderencia_percentual?.toFixed(1) || '0'}%`
              : 'N/D'}
          </p>
        </div>

        <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-3 dark:border-blue-800 dark:from-blue-950/30 dark:to-cyan-950/30">
          <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
            <span className="text-base">⏰</span>
            <p className="text-xs font-semibold">Melhor Turno</p>
          </div>
          <p className="mt-1.5 text-lg font-bold text-blue-900 dark:text-blue-100 truncate">
            {aderenciaTurno.length > 0 
              ? aderenciaTurno.reduce((max, turno) => (turno.aderencia_percentual ?? 0) > (max.aderencia_percentual ?? 0) ? turno : max).periodo
              : '-'}
          </p>
          <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">
            {aderenciaTurno.length > 0 
              ? `${aderenciaTurno.reduce((max, turno) => (turno.aderencia_percentual ?? 0) > (max.aderencia_percentual ?? 0) ? turno : max).aderencia_percentual?.toFixed(1) || '0'}%`
              : 'N/D'}
          </p>
        </div>

        <div className="rounded-lg border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-3 dark:border-violet-800 dark:from-violet-950/30 dark:to-purple-950/30">
          <div className="flex items-center gap-1.5 text-violet-700 dark:text-violet-300">
            <span className="text-base">📍</span>
            <p className="text-xs font-semibold">Melhor Sub-Praça</p>
          </div>
          <p className="mt-1.5 text-lg font-bold text-violet-900 dark:text-violet-100 truncate">
            {aderenciaSubPraca.length > 0 
              ? aderenciaSubPraca.reduce((max, sp) => (sp.aderencia_percentual ?? 0) > (max.aderencia_percentual ?? 0) ? sp : max).sub_praca
              : '-'}
          </p>
          <p className="mt-0.5 text-xs text-violet-600 dark:text-violet-400">
            {aderenciaSubPraca.length > 0 
              ? `${aderenciaSubPraca.reduce((max, sp) => (sp.aderencia_percentual ?? 0) > (max.aderencia_percentual ?? 0) ? sp : max).aderencia_percentual?.toFixed(1) || '0'}%`
              : 'N/D'}
          </p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-3 dark:border-amber-800 dark:from-amber-950/30 dark:to-orange-950/30">
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
            <span className="text-base">🎯</span>
            <p className="text-xs font-semibold">Melhor Origem</p>
          </div>
          <p className="mt-1.5 text-lg font-bold text-amber-900 dark:text-amber-100 truncate">
            {aderenciaOrigem.length > 0 
              ? aderenciaOrigem.reduce((max, orig) => (orig.aderencia_percentual ?? 0) > (max.aderencia_percentual ?? 0) ? orig : max).origem
              : '-'}
          </p>
          <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
            {aderenciaOrigem.length > 0 
              ? `${aderenciaOrigem.reduce((max, orig) => (orig.aderencia_percentual ?? 0) > (max.aderencia_percentual ?? 0) ? orig : max).aderencia_percentual?.toFixed(1) || '0'}%`
              : 'N/D'}
          </p>
        </div>
      </div>

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
  const taxaRejeicao = totals.ofertadas > 0 ? (totals.rejeitadas / totals.ofertadas) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Corridas Ofertadas"
          value={totals.ofertadas}
          icon="📢"
          color="blue"
        />
        <MetricCard
          title="Corridas Aceitas"
          value={totals.aceitas}
          icon="✅"
          percentage={taxaAceitacao}
          percentageLabel="taxa de aceitação"
          color="green"
        />
        <MetricCard
          title="Corridas Rejeitadas"
          value={totals.rejeitadas}
          icon="❌"
          percentage={taxaRejeicao}
          percentageLabel="taxa de rejeição"
          color="red"
        />
        <MetricCard
          title="Corridas Completadas"
          value={totals.completadas}
          icon="🏁"
          percentage={taxaCompletude}
          percentageLabel="taxa de completude"
          color="purple"
        />
      </div>

      {/* Resumo Operacional */}
      {aderenciaGeral && (
        <div className="rounded-xl bg-white p-6 shadow-md dark:bg-slate-900">
          <h3 className="mb-6 text-lg font-bold text-slate-900 dark:text-white">Resumo Operacional</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 dark:from-blue-950/30 dark:to-indigo-950/30">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Aderência Geral</p>
              <p className="mt-2 text-3xl font-bold text-blue-900 dark:text-blue-100">{(aderenciaGeral.aderencia_percentual ?? 0).toFixed(1)}%</p>
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

function ComparacaoView({
  semanas,
  pracas,
  subPracas,
  origens,
  currentUser,
}: {
  semanas: number[];
  pracas: FilterOption[];
  subPracas: FilterOption[];
  origens: FilterOption[];
  currentUser: { is_admin: boolean; assigned_pracas: string[] } | null;
}) {
  const [semana1, setSemana1] = useState<number | null>(null);
  const [semana2, setSemana2] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [dados1, setDados1] = useState<DashboardResumoData | null>(null);
  const [dados2, setDados2] = useState<DashboardResumoData | null>(null);
  const [todasSemanas, setTodasSemanas] = useState<number[]>([]);

  // Buscar TODAS as semanas disponíveis (sem filtro)
  useEffect(() => {
    async function fetchTodasSemanas() {
      try {
        const { data, error } = await supabase.rpc('listar_todas_semanas');
        if (!error && data) {
          setTodasSemanas(data);
        }
      } catch (err) {
        console.error('Erro ao buscar semanas:', err);
      }
    }
    fetchTodasSemanas();
  }, []);

  const compararSemanas = async () => {
    if (!semana1 || !semana2) return;

    setLoading(true);
    try {
      // Construir filtro com praça do usuário se não for admin
      const filtro: any = { p_semana: semana1 };
      const filtro2: any = { p_semana: semana2 };
      
      // Se não for admin e tiver praças atribuídas, filtrar por elas
      if (currentUser && !currentUser.is_admin && currentUser.assigned_pracas.length > 0) {
        // Se tiver apenas 1 praça, usar como filtro
        if (currentUser.assigned_pracas.length === 1) {
          filtro.p_praca = currentUser.assigned_pracas[0];
          filtro2.p_praca = currentUser.assigned_pracas[0];
        }
        // Se tiver múltiplas praças, não filtramos (mostra tudo que ele tem acesso)
      }
      
      const [res1, res2] = await Promise.all([
        supabase.rpc('dashboard_resumo', filtro),
        supabase.rpc('dashboard_resumo', filtro2),
      ]);

      // Filtrar dados se não for admin
      let dados1Filtrados = res1.data as DashboardResumoData;
      let dados2Filtrados = res2.data as DashboardResumoData;

      if (currentUser && !currentUser.is_admin && currentUser.assigned_pracas.length > 0) {
        const pracasPermitidas = currentUser.assigned_pracas;
        
        // Filtrar sub_praca, origem baseado nas praças permitidas
        // Precisamos manter apenas os dados das praças que o usuário tem acesso
        dados1Filtrados = {
          ...dados1Filtrados,
          sub_praca: (dados1Filtrados.sub_praca || []).filter((item: any) => {
            // Sub-praças normalmente contêm o nome da praça
            return pracasPermitidas.some(praca => item.sub_praca?.toUpperCase().includes(praca.toUpperCase()));
          }),
          origem: (dados1Filtrados.origem || []).filter((item: any) => {
            // Se não conseguimos determinar, mantemos (pode ser global)
            return true;
          })
        };

        dados2Filtrados = {
          ...dados2Filtrados,
          sub_praca: (dados2Filtrados.sub_praca || []).filter((item: any) => {
            return pracasPermitidas.some(praca => item.sub_praca?.toUpperCase().includes(praca.toUpperCase()));
          }),
          origem: (dados2Filtrados.origem || []).filter((item: any) => {
            return true;
          })
        };
      }

      setDados1(dados1Filtrados);
      setDados2(dados2Filtrados);
    } catch (error) {
      console.error('Erro ao comparar semanas:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularVariacao = (valor1: number | null | undefined, valor2: number | null | undefined): string => {
    const v1 = valor1 ?? 0;
    const v2 = valor2 ?? 0;
    if (v1 === 0) return '0.0';
    const variacao = ((v2 - v1) / v1) * 100;
    return variacao.toFixed(1);
  };

  const VariacaoBadge = ({ variacao }: { variacao: string }) => {
    const valor = parseFloat(variacao);
    const isPositive = valor >= 0;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${
          isPositive
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
        }`}
      >
        {isPositive ? '↗' : '↘'} {Math.abs(valor).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Seletores */}
      <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-lg dark:border-blue-800 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Selecione as Semanas para Comparar</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FiltroSelect
            label="Semana 1"
            value={semana1 !== null ? String(semana1) : ''}
            options={todasSemanas.map((sem) => ({ value: String(sem), label: `Semana ${sem}` }))}
            placeholder="Selecione..."
            onChange={(value) => setSemana1(value ? Number(value) : null)}
          />
          <FiltroSelect
            label="Semana 2"
            value={semana2 !== null ? String(semana2) : ''}
            options={todasSemanas.map((sem) => ({ value: String(sem), label: `Semana ${sem}` }))}
            placeholder="Selecione..."
            onChange={(value) => setSemana2(value ? Number(value) : null)}
          />
          <div className="flex items-end">
            <button
              onClick={compararSemanas}
              disabled={!semana1 || !semana2 || loading}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? 'Comparando...' : 'Comparar'}
            </button>
          </div>
        </div>
      </div>

      {/* Comparação */}
      {dados1 && dados2 && (
        <div className="space-y-6">
          {/* Aderência Geral */}
          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-white to-blue-50 p-6 shadow-lg dark:border-blue-800 dark:from-slate-900 dark:to-blue-950/30">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <span className="text-xl">📊</span>
              Comparação de Aderência Geral
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-blue-200 bg-white p-4 dark:border-blue-700 dark:bg-slate-800">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Semana {semana1}</p>
                <p className="mt-2 text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {(dados1.semanal[0]?.aderencia_percentual ?? 0).toFixed(1)}%
                </p>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Variação</p>
                  <div className="mt-2">
                    <VariacaoBadge
                      variacao={calcularVariacao(
                        dados1.semanal[0]?.aderencia_percentual,
                        dados2.semanal[0]?.aderencia_percentual
                      )}
                    />
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-indigo-200 bg-white p-4 dark:border-indigo-700 dark:bg-slate-800">
                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Semana {semana2}</p>
                <p className="mt-2 text-3xl font-bold text-indigo-900 dark:text-indigo-100">
                  {(dados2.semanal[0]?.aderencia_percentual ?? 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Totais de Corridas */}
          <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-lg dark:border-blue-800 dark:bg-slate-900">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <span className="text-xl">🚗</span>
              Comparação de Corridas
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { key: 'corridas_ofertadas' as const, label: 'Ofertadas', color: 'slate' },
                { key: 'corridas_aceitas' as const, label: 'Aceitas', color: 'emerald' },
                { key: 'corridas_rejeitadas' as const, label: 'Rejeitadas', color: 'rose' },
                { key: 'corridas_completadas' as const, label: 'Completadas', color: 'purple' },
              ].map(({ key, label, color }) => (
                <div
                  key={key}
                  className={`rounded-lg border border-${color}-200 bg-${color}-50/50 p-4 dark:border-${color}-800 dark:bg-${color}-950/30`}
                >
                  <p className={`text-sm font-semibold text-${color}-700 dark:text-${color}-300`}>{label}</p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className={`text-xl font-bold text-${color}-900 dark:text-${color}-100`}>
                      {dados1.totais[key].toLocaleString('pt-BR')}
                    </span>
                    <span className="text-xs text-slate-500">S{semana1}</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className={`text-xl font-bold text-${color}-900 dark:text-${color}-100`}>
                      {dados2.totais[key].toLocaleString('pt-BR')}
                    </span>
                    <span className="text-xs text-slate-500">S{semana2}</span>
                  </div>
                  <div className="mt-2">
                    <VariacaoBadge variacao={calcularVariacao(dados1.totais[key], dados2.totais[key])} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Aderência por Dia */}
          <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-lg dark:border-blue-800 dark:bg-slate-900">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <span className="text-xl">📅</span>
              Comparação de Aderência por Dia
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
              {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia) => {
                const data1 = dados1.dia?.find((d) => d.dia_da_semana === dia);
                const data2 = dados2.dia?.find((d) => d.dia_da_semana === dia);
                return (
                  <div key={dia} className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{dia}</p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-bold text-blue-900 dark:text-blue-100">
                          {(data1?.aderencia_percentual ?? 0).toFixed(0)}%
                        </span>
                        <span className="text-xs text-slate-500">S{semana1}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
                          {(data2?.aderencia_percentual ?? 0).toFixed(0)}%
                        </span>
                        <span className="text-xs text-slate-500">S{semana2}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <VariacaoBadge
                        variacao={calcularVariacao(data1?.aderencia_percentual, data2?.aderencia_percentual)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Aderência por Sub-Praça */}
          {dados1.sub_praca && dados1.sub_praca.length > 0 && (
            <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-lg dark:border-blue-800 dark:bg-slate-900">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                <span className="text-xl">📍</span>
                Comparação de Aderência por Sub-Praça
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from(
                  new Set([
                    ...(dados1.sub_praca?.map((sp) => sp.sub_praca) ?? []),
                    ...(dados2.sub_praca?.map((sp) => sp.sub_praca) ?? []),
                  ])
                ).map((subPraca) => {
                  const data1 = dados1.sub_praca?.find((sp) => sp.sub_praca === subPraca);
                  const data2 = dados2.sub_praca?.find((sp) => sp.sub_praca === subPraca);
                  return (
                    <div key={subPraca} className="rounded-lg border border-violet-100 bg-violet-50/50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{subPraca}</p>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-lg font-bold text-violet-900 dark:text-violet-100">
                            {(data1?.aderencia_percentual ?? 0).toFixed(1)}%
                          </span>
                          <span className="text-xs text-slate-500">S{semana1}</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-lg font-bold text-purple-900 dark:text-purple-100">
                            {(data2?.aderencia_percentual ?? 0).toFixed(1)}%
                          </span>
                          <span className="text-xs text-slate-500">S{semana2}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <VariacaoBadge
                          variacao={calcularVariacao(data1?.aderencia_percentual, data2?.aderencia_percentual)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Aderência por Origem */}
          {dados1.origem && dados1.origem.length > 0 && (
            <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-lg dark:border-blue-800 dark:bg-slate-900">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                <span className="text-xl">🎯</span>
                Comparação de Aderência por Origem
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from(
                  new Set([
                    ...(dados1.origem?.map((o) => o.origem) ?? []),
                    ...(dados2.origem?.map((o) => o.origem) ?? []),
                  ])
                ).map((origem) => {
                  const data1 = dados1.origem?.find((o) => o.origem === origem);
                  const data2 = dados2.origem?.find((o) => o.origem === origem);
                  return (
                    <div key={origem} className="rounded-lg border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{origem}</p>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-lg font-bold text-amber-900 dark:text-amber-100">
                            {(data1?.aderencia_percentual ?? 0).toFixed(1)}%
                          </span>
                          <span className="text-xs text-slate-500">S{semana1}</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-lg font-bold text-orange-900 dark:text-orange-100">
                            {(data2?.aderencia_percentual ?? 0).toFixed(1)}%
                          </span>
                          <span className="text-xs text-slate-500">S{semana2}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <VariacaoBadge
                          variacao={calcularVariacao(data1?.aderencia_percentual, data2?.aderencia_percentual)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =================================================================================
// View UTR
// =================================================================================

function UtrView({
  utrData,
  loading,
}: {
  utrData: UtrData | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-lg font-semibold text-blue-700 dark:text-blue-200">Calculando UTR...</p>
        </div>
      </div>
    );
  }

  if (!utrData) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* UTR Geral */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-600 to-indigo-600 p-6 shadow-lg dark:border-blue-900">
        <h2 className="mb-4 text-sm font-semibold text-blue-100">📏 UTR Geral</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-blue-100">Tempo Total (horas)</p>
            <p className="text-3xl font-bold text-white">{utrData.geral.tempo_horas.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-blue-100">Corridas Completadas</p>
            <p className="text-3xl font-bold text-white">{utrData.geral.corridas.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-blue-100">UTR (Corridas/Hora)</p>
            <p className="text-3xl font-bold text-white">{utrData.geral.utr.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* UTR por Praça */}
      {utrData.por_praca && utrData.por_praca.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-lg dark:border-blue-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <span className="text-xl">🏢</span>
            UTR por Praça
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {utrData.por_praca.map((item) => (
              <div key={item.praca} className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <p className="mb-2 text-sm font-bold text-slate-900 dark:text-white">{item.praca}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Tempo:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.tempo_horas.toFixed(2)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Corridas:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.corridas}</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-emerald-200 pt-2 dark:border-emerald-800">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">UTR:</span>
                    <span className="text-lg font-bold text-emerald-900 dark:text-emerald-100">{item.utr.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UTR por Sub-Praça */}
      {utrData.por_sub_praca && utrData.por_sub_praca.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-lg dark:border-blue-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <span className="text-xl">📍</span>
            UTR por Sub-Praça
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {utrData.por_sub_praca.map((item) => (
              <div key={item.sub_praca} className="rounded-lg border border-violet-100 bg-violet-50/50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
                <p className="mb-2 text-sm font-bold text-slate-900 dark:text-white">{item.sub_praca}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Tempo:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.tempo_horas.toFixed(2)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Corridas:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.corridas}</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-violet-200 pt-2 dark:border-violet-800">
                    <span className="font-bold text-violet-700 dark:text-violet-300">UTR:</span>
                    <span className="text-lg font-bold text-violet-900 dark:text-violet-100">{item.utr.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UTR por Origem */}
      {utrData.por_origem && utrData.por_origem.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-lg dark:border-blue-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <span className="text-xl">🎯</span>
            UTR por Origem
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {utrData.por_origem.map((item) => (
              <div key={item.origem} className="rounded-lg border border-orange-100 bg-orange-50/50 p-4 dark:border-orange-900 dark:bg-orange-950/30">
                <p className="mb-2 text-sm font-bold text-slate-900 dark:text-white">{item.origem}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Tempo:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.tempo_horas.toFixed(2)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Corridas:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.corridas}</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-orange-200 pt-2 dark:border-orange-800">
                    <span className="font-bold text-orange-700 dark:text-orange-300">UTR:</span>
                    <span className="text-lg font-bold text-orange-900 dark:text-orange-100">{item.utr.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UTR por Turno */}
      {utrData.por_turno && utrData.por_turno.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-lg dark:border-blue-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <span className="text-xl">⏰</span>
            UTR por Turno
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {utrData.por_turno.map((item) => (
              <div key={item.periodo} className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                <p className="mb-2 text-sm font-bold text-slate-900 dark:text-white">{item.periodo}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Tempo:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.tempo_horas.toFixed(2)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Corridas:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.corridas}</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-blue-200 pt-2 dark:border-blue-800">
                    <span className="font-bold text-blue-700 dark:text-blue-300">UTR:</span>
                    <span className="text-lg font-bold text-blue-900 dark:text-blue-100">{item.utr.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analise' | 'comparacao' | 'utr'>('dashboard');
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
  const [currentUser, setCurrentUser] = useState<{ is_admin: boolean; assigned_pracas: string[] } | null>(null);
  const [utrData, setUtrData] = useState<UtrData | null>(null);
  const [loadingUtr, setLoadingUtr] = useState(false);

  const aderenciaGeral = useMemo(() => aderenciaSemanal[0], [aderenciaSemanal]);

  useEffect(() => {
    async function checkUserAndFetchData() {
      // Primeiro, buscar informações do usuário
      try {
        const { data: userProfile } = await supabase.rpc('get_current_user_profile') as { data: any; error: any };
        if (userProfile) {
          setCurrentUser({
            is_admin: userProfile.is_admin,
            assigned_pracas: userProfile.assigned_pracas || []
          });
          
          // Se não for admin e tiver praças atribuídas, aplicar filtro automático
          if (!userProfile.is_admin && userProfile.assigned_pracas && userProfile.assigned_pracas.length > 0) {
            // Se tiver apenas 1 praça, setar automaticamente
            if (userProfile.assigned_pracas.length === 1) {
              setFilters(prev => ({ ...prev, praca: userProfile.assigned_pracas[0] }));
            }
          }
        }
      } catch (err) {
        console.error('Erro ao buscar perfil do usuário:', err);
      }
    }

    checkUserAndFetchData();
  }, []);

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
        // Garantir que anos e semanas sempre sejam arrays
        setAnosDisponiveis(Array.isArray(dimensoes?.anos) ? dimensoes.anos : []);
        setSemanasDisponiveis(Array.isArray(dimensoes?.semanas) ? dimensoes.semanas : []);
        
        // Filtrar praças, sub-praças e origens baseado nas permissões do usuário
        // Garantir que sempre sejam arrays
        let pracasDisponiveis = Array.isArray(dimensoes?.pracas) ? dimensoes.pracas : [];
        let subPracasDisponiveis = Array.isArray(dimensoes?.sub_pracas) ? dimensoes.sub_pracas : [];
        let origensDisponiveis = Array.isArray(dimensoes?.origens) ? dimensoes.origens : [];
        
        // Se não for admin, filtrar apenas praças atribuídas
        if (currentUser && !currentUser.is_admin && currentUser.assigned_pracas.length > 0) {
          pracasDisponiveis = pracasDisponiveis.filter((p: string) => 
            currentUser.assigned_pracas.includes(p)
          );
        }
        
        setPracas(pracasDisponiveis.map((p: string) => ({ value: p, label: p })));
        setSubPracas(subPracasDisponiveis.map((sp: string) => ({ value: sp, label: sp })));
        setOrigens(origensDisponiveis.map((origem: string) => ({ value: origem, label: origem })));

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
  }, [filters, currentUser]);

  // Buscar dados da UTR quando a aba estiver ativa
  useEffect(() => {
    if (activeTab === 'utr') {
      async function fetchUtr() {
        setLoadingUtr(true);
        try {
          const params = buildFilterPayload(filters);
          const { data: utrResult, error: utrError } = await supabase.rpc('calcular_utr', params);
          
          if (utrError) throw utrError;
          
          setUtrData(utrResult as UtrData);
        } catch (err: any) {
          console.error('Erro ao buscar UTR:', err);
          setUtrData(null);
        } finally {
          setLoadingUtr(false);
        }
      }
      
      fetchUtr();
    }
  }, [activeTab, filters]);

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
              {activeTab !== 'comparacao' && (
                <>
                  <FiltroBar
                    filters={filters}
                    setFilters={setFilters}
                    anos={anosDisponiveis}
                    semanas={semanasDisponiveis}
                    pracas={pracas}
                    subPracas={subPracas}
                    origens={origens}
                    currentUser={currentUser}
                  />
                  <div className="my-4 h-px bg-blue-200 dark:bg-blue-800"></div>
                </>
              )}
              <div className="flex flex-wrap gap-2">
                <TabButton label="Dashboard" icon="📊" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <TabButton label="Análise Detalhada" icon="📈" active={activeTab === 'analise'} onClick={() => setActiveTab('analise')} />
                <TabButton label="Comparação" icon="⚖️" active={activeTab === 'comparacao'} onClick={() => setActiveTab('comparacao')} />
                <TabButton label="UTR" icon="📏" active={activeTab === 'utr'} onClick={() => setActiveTab('utr')} />
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
              {activeTab === 'comparacao' && (
                <ComparacaoView
                  semanas={semanasDisponiveis}
                  pracas={pracas}
                  subPracas={subPracas}
                  origens={origens}
                  currentUser={currentUser}
                />
              )}
              {activeTab === 'utr' && (
                <UtrView
                  utrData={utrData}
                  loading={loadingUtr}
                />
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}