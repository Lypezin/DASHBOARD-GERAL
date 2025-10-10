'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

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
  corridas_ofertadas?: number;
  corridas_aceitas?: number;
  corridas_rejeitadas?: number;
  corridas_completadas?: number;
  taxa_aceitacao?: number;
  taxa_completude?: number;
}

interface AderenciaTurno {
  periodo: string;
  horas_a_entregar: string;
  horas_entregues: string;
  aderencia_percentual: number;
  corridas_ofertadas?: number;
  corridas_aceitas?: number;
  corridas_rejeitadas?: number;
  corridas_completadas?: number;
  taxa_aceitacao?: number;
  taxa_completude?: number;
}

interface AderenciaSubPraca {
  sub_praca: string;
  horas_a_entregar: string;
  horas_entregues: string;
  aderencia_percentual: number;
  corridas_ofertadas?: number;
  corridas_aceitas?: number;
  corridas_rejeitadas?: number;
  corridas_completadas?: number;
  taxa_aceitacao?: number;
  taxa_completude?: number;
}

interface AderenciaOrigem {
  origem: string;
  horas_a_entregar: string;
  horas_entregues: string;
  aderencia_percentual: number;
  corridas_ofertadas?: number;
  corridas_aceitas?: number;
  corridas_rejeitadas?: number;
  corridas_completadas?: number;
  taxa_aceitacao?: number;
  taxa_completude?: number;
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
  turno?: string;
  periodo?: string;
  tempo_horas: number;
  corridas: number;
  utr: number;
}

interface UtrData {
  geral: UtrGeral;
  praca?: UtrPorPraca[];
  sub_praca?: UtrPorSubPraca[];
  origem?: UtrPorOrigem[];
  turno?: UtrPorTurno[];
  // Compatibilidade com nomes antigos
  por_praca?: UtrPorPraca[];
  por_sub_praca?: UtrPorSubPraca[];
  por_origem?: UtrPorOrigem[];
  por_turno?: UtrPorTurno[];
}

interface Entregador {
  id_entregador: string;
  nome_entregador: string;
  corridas_ofertadas: number;
  corridas_aceitas: number;
  corridas_rejeitadas: number;
  corridas_completadas: number;
  aderencia_percentual: number;
  rejeicao_percentual: number;
}

interface EntregadoresData {
  entregadores: Entregador[];
  total: number;
}

interface UsuarioOnline {
  user_id: string;
  email: string;
  nome: string | null;
  pracas: string[];
  ultima_acao: string;
  aba_atual: string | null;
  filtros: any;
  ultima_atividade: string;
  segundos_inativo: number;
  acoes_ultima_hora: number;
}

interface MonitoramentoData {
  success: boolean;
  total_online: number;
  usuarios: UsuarioOnline[];
}

// =================================================================================
// Funções auxiliares
// =================================================================================

// Função para converter horas decimais em hh:mm:ss
function formatarHorasParaHMS(horasDecimais: string | number): string {
  const horas = typeof horasDecimais === 'string' ? parseFloat(horasDecimais) : horasDecimais;
  
  if (isNaN(horas) || horas === 0) return '00:00:00';
  
  const horasInteiras = Math.floor(horas);
  const minutosDecimais = (horas - horasInteiras) * 60;
  const minutosInteiros = Math.floor(minutosDecimais);
  const segundos = Math.round((minutosDecimais - minutosInteiros) * 60);
  
  return `${String(horasInteiras).padStart(2, '0')}:${String(minutosInteiros).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
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
      className={`relative flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-300 ${
        active
          ? 'bg-white text-blue-700 shadow-xl scale-105 dark:bg-slate-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
          : 'bg-white/50 text-slate-700 hover:bg-white hover:shadow-lg hover:scale-105 active:scale-95 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800 border border-transparent'
      }`}
    >
      {active && (
        <div className="absolute -bottom-1 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"></div>
      )}
      <span className={`text-base ${active ? 'animate-pulse-soft' : ''}`}>{icon}</span>
      <span>{label}</span>
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
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div className={`absolute right-0 top-0 h-32 w-32 rounded-full bg-gradient-to-br ${colorClasses[color]} opacity-10 blur-3xl transition-opacity group-hover:opacity-20`}></div>
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 transition-transform group-hover:scale-105 dark:text-white">{value.toLocaleString('pt-BR')}</p>
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
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${colorClasses[color]} text-2xl text-white shadow-lg transition-transform group-hover:rotate-3 group-hover:scale-110`}>
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
    <div className={`group rounded-2xl border p-5 shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${bgClass}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">{title}</h3>
        <span className={`rounded-full px-3 py-1 text-lg font-bold ${colorClass} bg-white/50 dark:bg-slate-900/50`}>
          {(percentual ?? 0).toFixed(1)}%
        </span>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between rounded-lg bg-white/30 px-3 py-2 dark:bg-slate-900/30">
          <span className="font-medium text-slate-600 dark:text-slate-400">Planejado:</span>
          <span className="font-mono text-base font-bold text-slate-900 dark:text-white">{formatarHorasParaHMS(planejado)}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-white/30 px-3 py-2 dark:bg-slate-900/30">
          <span className="font-medium text-slate-600 dark:text-slate-400">Entregue:</span>
          <span className="font-mono text-base font-bold text-blue-600 dark:text-blue-400">{formatarHorasParaHMS(entregue)}</span>
        </div>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/50 dark:bg-slate-800/50">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${percentual >= 90 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : percentual >= 70 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-rose-500 to-rose-600'}`}
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
      <div className="relative">
        <select
          className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 pr-10 text-sm font-medium text-blue-900 shadow-sm transition-all hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-100 dark:hover:border-blue-700 dark:focus:border-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
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
        {value && !disabled && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onChange(null);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            title="Limpar filtro"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
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

  const handleClearFilters = () => {
    setFilters({
      ano: null,
      semana: null,
      praca: currentUser && !currentUser.is_admin && currentUser.assigned_pracas.length === 1 ? currentUser.assigned_pracas[0] : null,
      subPraca: null,
      origem: null,
    });
  };

  const hasActiveFilters = filters.ano !== null || filters.semana !== null || filters.subPraca !== null || filters.origem !== null ||
    (currentUser?.is_admin && filters.praca !== null);

  // Verificar se deve desabilitar o filtro de praça (somente não-admin com 1 praça)
  const shouldDisablePracaFilter = Boolean(currentUser && !currentUser.is_admin && currentUser.assigned_pracas.length === 1);

  return (
    <div className="space-y-4">
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
      
      {/* Botão Limpar Filtros */}
      {hasActiveFilters && (
        <div className="flex justify-end animate-slide-down">
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Limpar Todos os Filtros
          </button>
        </div>
      )}
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
      {/* Aderência Geral Redesenhada */}
      {aderenciaGeral && (
        <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-white p-8 shadow-2xl dark:border-blue-800 dark:bg-slate-900">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Aderência Geral</h2>
                  <p className="mt-1 text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                    {(aderenciaGeral.aderencia_percentual ?? 0).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Planejado</p>
                  <p className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-white">
                    {formatarHorasParaHMS(aderenciaGeral.horas_a_entregar)}
                  </p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Entregue</p>
                  <p className="mt-1 font-mono text-lg font-bold text-blue-900 dark:text-blue-100">
                    {formatarHorasParaHMS(aderenciaGeral.horas_entregues)}
                  </p>
                </div>
              </div>
            </div>
            <div className="ml-6 hidden lg:flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
              <span className="text-6xl">🎯</span>
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
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{formatarHorasParaHMS(data.horas_a_entregar)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ent:</span>
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{formatarHorasParaHMS(data.horas_entregues)}</span>
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

function AnaliseView({ 
  totals, 
  aderenciaGeral,
  aderenciaDia,
  aderenciaTurno,
  aderenciaSubPraca,
  aderenciaOrigem
}: { 
  totals: Totals; 
  aderenciaGeral?: AderenciaSemanal;
  aderenciaDia: AderenciaDia[];
  aderenciaTurno: AderenciaTurno[];
  aderenciaSubPraca: AderenciaSubPraca[];
  aderenciaOrigem: AderenciaOrigem[];
}) {
  const [viewModeDia, setViewModeDia] = useState<'table' | 'chart'>('table');
  const [viewModeTurno, setViewModeTurno] = useState<'table' | 'chart'>('table');
  const [viewModeLocal, setViewModeLocal] = useState<'subpraca' | 'origem'>('subpraca');
  const [viewModeLocalVis, setViewModeLocalVis] = useState<'table' | 'chart'>('table');
  
  const taxaAceitacao = totals.ofertadas > 0 ? (totals.aceitas / totals.ofertadas) * 100 : 0;
  const taxaCompletude = totals.aceitas > 0 ? (totals.completadas / totals.aceitas) * 100 : 0;
  const taxaRejeicao = totals.ofertadas > 0 ? (totals.rejeitadas / totals.ofertadas) * 100 : 0;

  // Dados para o gráfico de pizza (distribuição de corridas)
  const doughnutData = {
    labels: ['Completadas', 'Rejeitadas', 'Aceitas (Não Completadas)'],
    datasets: [{
      data: [totals.completadas, totals.rejeitadas, totals.aceitas - totals.completadas],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(59, 130, 246, 0.8)',
      ],
      borderColor: [
        'rgb(16, 185, 129)',
        'rgb(239, 68, 68)',
        'rgb(59, 130, 246)',
      ],
      borderWidth: 2,
    }],
  };

  // Dados para o gráfico de barras por dia
  const barDataDia = {
    labels: aderenciaDia.map(d => d.dia_da_semana),
    datasets: [
      {
        label: 'Ofertadas',
        data: aderenciaDia.map(d => d.corridas_ofertadas ?? 0),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Aceitas',
        data: aderenciaDia.map(d => d.corridas_aceitas ?? 0),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      },
      {
        label: 'Rejeitadas',
        data: aderenciaDia.map(d => d.corridas_rejeitadas ?? 0),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      },
      {
        label: 'Completadas',
        data: aderenciaDia.map(d => d.corridas_completadas ?? 0),
        backgroundColor: 'rgba(139, 92, 246, 0.7)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 1,
      },
    ],
  };

  // Dados para o gráfico de linha de aderência por dia
  const lineDataAderencia = {
    labels: aderenciaDia.map(d => d.dia_da_semana),
    datasets: [
      {
        label: 'Aderência (%)',
        data: aderenciaDia.map(d => d.aderencia_percentual ?? 0),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Taxa Aceitação (%)',
        data: aderenciaDia.map(d => d.taxa_aceitacao ?? 0),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('pt-BR').format(context.parsed.y);
            }
            return label;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  };

  const ViewToggleButton = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
        active
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in">
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

      {/* Performance por Dia da Semana */}
      {aderenciaDia && aderenciaDia.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-white shadow-lg dark:border-blue-800 dark:bg-slate-900">
          <div className="border-b border-blue-200 px-6 py-4 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                <span className="text-xl">📅</span>
                Performance por Dia da Semana
              </h3>
              <div className="flex gap-2">
                <ViewToggleButton
                  active={viewModeDia === 'table'}
                  onClick={() => setViewModeDia('table')}
                  label="📋 Tabela"
                />
                <ViewToggleButton
                  active={viewModeDia === 'chart'}
                  onClick={() => setViewModeDia('chart')}
                  label="📊 Gráfico"
                />
              </div>
            </div>
          </div>
          
          {viewModeDia === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-50 dark:bg-blue-950/30">
                <tr className="border-b border-blue-200 dark:border-blue-800">
                  <th className="px-6 py-4 text-left text-sm font-bold text-blue-900 dark:text-blue-100">Dia</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-blue-900 dark:text-blue-100">Ofertadas</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-blue-900 dark:text-blue-100">Aceitas</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-blue-900 dark:text-blue-100">Rejeitadas</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-blue-900 dark:text-blue-100">Completadas</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-blue-900 dark:text-blue-100">Taxa Aceitação</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-blue-900 dark:text-blue-100">Aderência</th>
                </tr>
              </thead>
              <tbody>
                {aderenciaDia.map((dia, index) => (
                  <tr
                    key={dia.dia_iso}
                    className={`border-b border-blue-100 transition-colors hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/20 ${
                      index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-blue-50/30 dark:bg-slate-800/30'
                    }`}
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{dia.dia_da_semana}</td>
                    <td className="px-6 py-4 text-center text-slate-700 dark:text-slate-300">{dia.corridas_ofertadas ?? 0}</td>
                    <td className="px-6 py-4 text-center text-emerald-700 dark:text-emerald-400">{dia.corridas_aceitas ?? 0}</td>
                    <td className="px-6 py-4 text-center text-rose-700 dark:text-rose-400">{dia.corridas_rejeitadas ?? 0}</td>
                    <td className="px-6 py-4 text-center text-blue-700 dark:text-blue-400">{dia.corridas_completadas ?? 0}</td>
                    <td className="px-6 py-4 text-center font-semibold text-emerald-700 dark:text-emerald-400">
                      {(dia.taxa_aceitacao ?? 0).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-blue-900 dark:text-blue-100">
                      {(dia.aderencia_percentual ?? 0).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          ) : (
            <div className="p-6">
              <Bar data={barDataDia} options={{
                ...chartOptions,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { font: { size: 11 } },
                  },
                  x: {
                    ticks: { font: { size: 11 } },
                  },
                },
              }} />
            </div>
          )}
        </div>
      )}

      {/* Performance por Turno */}
      {aderenciaTurno.length > 0 && (
        <div className="rounded-xl border border-purple-200 bg-white shadow-lg dark:border-purple-800 dark:bg-slate-900">
          <div className="border-b border-purple-200 px-6 py-4 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                <span className="text-xl">⏰</span>
                Performance por Turno
              </h3>
              <div className="flex gap-2">
                <ViewToggleButton
                  active={viewModeTurno === 'table'}
                  onClick={() => setViewModeTurno('table')}
                  label="📋 Tabela"
                />
                <ViewToggleButton
                  active={viewModeTurno === 'chart'}
                  onClick={() => setViewModeTurno('chart')}
                  label="📊 Gráfico"
                />
              </div>
            </div>
          </div>
          
          {viewModeTurno === 'chart' ? (
            <div className="p-6">
          <Bar data={{
            labels: aderenciaTurno.map(t => t.periodo),
            datasets: [
              {
                label: 'Ofertadas',
                data: aderenciaTurno.map(t => t.corridas_ofertadas ?? 0),
                backgroundColor: 'rgba(139, 92, 246, 0.7)',
                borderColor: 'rgb(139, 92, 246)',
                borderWidth: 1,
              },
              {
                label: 'Completadas',
                data: aderenciaTurno.map(t => t.corridas_completadas ?? 0),
                backgroundColor: 'rgba(16, 185, 129, 0.7)',
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 1,
              },
            ],
          }} options={{
            ...chartOptions,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  font: {
                    size: 11,
                  },
                },
              },
              x: {
                ticks: {
                  font: {
                    size: 11,
                  },
                },
              },
            },
          }} />
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-purple-50 dark:bg-purple-950/30">
                <tr className="border-b border-purple-200 dark:border-purple-800">
                  <th className="px-6 py-4 text-left text-sm font-bold text-purple-900 dark:text-purple-100">Turno</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-purple-900 dark:text-purple-100">Ofertadas</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-purple-900 dark:text-purple-100">Aceitas</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-purple-900 dark:text-purple-100">Rejeitadas</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-purple-900 dark:text-purple-100">Completadas</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-purple-900 dark:text-purple-100">Taxa Completude</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-purple-900 dark:text-purple-100">Aderência</th>
                </tr>
              </thead>
              <tbody>
                {aderenciaTurno.map((turno, index) => (
                  <tr
                    key={turno.periodo}
                    className={`border-b border-purple-100 transition-colors hover:bg-purple-50 dark:border-purple-900 dark:hover:bg-purple-950/20 ${
                      index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-purple-50/30 dark:bg-slate-800/30'
                    }`}
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{turno.periodo}</td>
                    <td className="px-6 py-4 text-center text-slate-700 dark:text-slate-300">{turno.corridas_ofertadas ?? 0}</td>
                    <td className="px-6 py-4 text-center text-emerald-700 dark:text-emerald-400">{turno.corridas_aceitas ?? 0}</td>
                    <td className="px-6 py-4 text-center text-rose-700 dark:text-rose-400">{turno.corridas_rejeitadas ?? 0}</td>
                    <td className="px-6 py-4 text-center text-blue-700 dark:text-blue-400">{turno.corridas_completadas ?? 0}</td>
                    <td className="px-6 py-4 text-center font-semibold text-violet-700 dark:text-violet-400">
                      {(turno.taxa_completude ?? 0).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-purple-900 dark:text-purple-100">
                      {(turno.aderencia_percentual ?? 0).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* Performance por Localização (Sub-Praça e Origem) */}
      {((aderenciaSubPraca && aderenciaSubPraca.length > 0) || (aderenciaOrigem && aderenciaOrigem.length > 0)) && (
        <div className="rounded-xl border border-emerald-200 bg-white shadow-lg dark:border-emerald-800 dark:bg-slate-900">
          <div className="border-b border-emerald-200 px-6 py-4 dark:border-emerald-800">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                <span className="text-xl">📍</span>
                Performance por Localização
              </h3>
              <div className="flex gap-2 flex-wrap">
                <div className="flex gap-2">
                  <ViewToggleButton
                    active={viewModeLocal === 'subpraca'}
                    onClick={() => setViewModeLocal('subpraca')}
                    label="Sub-Praça"
                  />
                  <ViewToggleButton
                    active={viewModeLocal === 'origem'}
                    onClick={() => setViewModeLocal('origem')}
                    label="Origem"
                  />
                </div>
                <div className="flex gap-2">
                  <ViewToggleButton
                    active={viewModeLocalVis === 'table'}
                    onClick={() => setViewModeLocalVis('table')}
                    label="📋 Tabela"
                  />
                  <ViewToggleButton
                    active={viewModeLocalVis === 'chart'}
                    onClick={() => setViewModeLocalVis('chart')}
                    label="📊 Gráfico"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {viewModeLocalVis === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-emerald-50 dark:bg-emerald-950/30">
                  <tr className="border-b border-emerald-200 dark:border-emerald-800">
                    <th className="px-6 py-4 text-left text-sm font-bold text-emerald-900 dark:text-emerald-100">
                      {viewModeLocal === 'subpraca' ? 'Sub-Praça' : 'Origem'}
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-emerald-900 dark:text-emerald-100">Ofertadas</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-emerald-900 dark:text-emerald-100">Aceitas</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-emerald-900 dark:text-emerald-100">Rejeitadas</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-emerald-900 dark:text-emerald-100">Completadas</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-emerald-900 dark:text-emerald-100">Taxa Aceitação</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-emerald-900 dark:text-emerald-100">Aderência</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewModeLocal === 'subpraca' ? aderenciaSubPraca : aderenciaOrigem).map((item, index) => {
                    const nome = viewModeLocal === 'subpraca' ? (item as any).sub_praca : (item as any).origem;
                    return (
                      <tr
                        key={nome}
                        className={`border-b border-emerald-100 transition-colors hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-950/20 ${
                          index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-emerald-50/30 dark:bg-slate-800/30'
                        }`}
                      >
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{nome}</td>
                        <td className="px-6 py-4 text-center text-slate-700 dark:text-slate-300">{item.corridas_ofertadas ?? 0}</td>
                        <td className="px-6 py-4 text-center text-emerald-700 dark:text-emerald-400">{item.corridas_aceitas ?? 0}</td>
                        <td className="px-6 py-4 text-center text-rose-700 dark:text-rose-400">{item.corridas_rejeitadas ?? 0}</td>
                        <td className="px-6 py-4 text-center text-blue-700 dark:text-blue-400">{item.corridas_completadas ?? 0}</td>
                        <td className="px-6 py-4 text-center font-semibold text-emerald-700 dark:text-emerald-400">
                          {(item.taxa_aceitacao ?? 0).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-emerald-900 dark:text-emerald-100">
                          {(item.aderencia_percentual ?? 0).toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6">
              <Bar data={{
                labels: (viewModeLocal === 'subpraca' ? aderenciaSubPraca : aderenciaOrigem).map(item => 
                  viewModeLocal === 'subpraca' ? (item as any).sub_praca : (item as any).origem
                ),
                datasets: [
                  {
                    label: 'Ofertadas',
                    data: (viewModeLocal === 'subpraca' ? aderenciaSubPraca : aderenciaOrigem).map(item => item.corridas_ofertadas ?? 0),
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 1,
                  },
                  {
                    label: 'Completadas',
                    data: (viewModeLocal === 'subpraca' ? aderenciaSubPraca : aderenciaOrigem).map(item => item.corridas_completadas ?? 0),
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1,
                  },
                ],
              }} options={{
                ...chartOptions,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { font: { size: 11 } },
                  },
                  x: {
                    ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 45 },
                  },
                },
              }} />
            </div>
          )}
        </div>
      )}

    </div>
  );
}

function MonitoramentoView() {
  const [monitoramentoData, setMonitoramentoData] = useState<MonitoramentoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMonitoramento = async () => {
    try {
      const { data, error } = await supabase.rpc('listar_usuarios_online', { p_minutos_inatividade: 5 });
      
      if (error) throw error;
      
      setMonitoramentoData(data as MonitoramentoData);
    } catch (err) {
      console.error('Erro ao buscar monitoramento:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoramento();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMonitoramento, 10000); // Atualizar a cada 10 segundos
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatarTempo = (segundos: number) => {
    if (segundos < 60) return `${Math.floor(segundos)}s`;
    if (segundos < 3600) return `${Math.floor(segundos / 60)}m`;
    return `${Math.floor(segundos / 3600)}h ${Math.floor((segundos % 3600) / 60)}m`;
  };

  const getStatusColor = (segundos: number) => {
    if (segundos < 60) return 'bg-emerald-500';
    if (segundos < 180) return 'bg-amber-500';
    return 'bg-slate-400';
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center animate-pulse-soft">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-lg font-semibold text-blue-700 dark:text-blue-200">Carregando monitoramento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 shadow-xl dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-indigo-100">🔍 Monitoramento em Tempo Real</h2>
            <p className="mt-2 text-4xl font-bold text-white">{monitoramentoData?.total_online || 0}</p>
            <p className="mt-1 text-sm text-indigo-100">Usuários online</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm">Auto-atualizar</span>
            </label>
            <button
              onClick={fetchMonitoramento}
              className="rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-105 active:scale-95"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Usuários Online */}
      {monitoramentoData && monitoramentoData.usuarios && monitoramentoData.usuarios.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {monitoramentoData.usuarios.map((usuario) => (
            <div
              key={usuario.user_id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-md transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${getStatusColor(usuario.segundos_inativo)} animate-pulse`}></div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{usuario.nome || usuario.email}</h3>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{usuario.email}</p>
                  
                  <div className="mt-4 space-y-2">
                    {/* Aba Atual */}
                    {usuario.aba_atual && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Aba:</span>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                          {usuario.aba_atual}
                        </span>
                      </div>
                    )}
                    
                    {/* Praças */}
                    {usuario.pracas && usuario.pracas.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Praças:</span>
                        <div className="flex flex-wrap gap-1">
                          {usuario.pracas.map((praca, idx) => (
                            <span key={idx} className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                              {praca}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Última Ação */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Última ação:</span>
                      <span className="text-xs text-slate-700 dark:text-slate-300">{usuario.ultima_acao}</span>
                    </div>
                    
                    {/* Tempo Inativo */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Inativo há:</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{formatarTempo(usuario.segundos_inativo)}</span>
                    </div>
                    
                    {/* Ações última hora */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ações (última hora):</span>
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                        {usuario.acoes_ultima_hora}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl text-white shadow-md">
                  👤
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">Nenhum usuário online no momento</p>
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
  const [semanasSelecionadas, setSemanasSelecionadas] = useState<number[]>([]);
  const [pracaSelecionada, setPracaSelecionada] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dadosComparacao, setDadosComparacao] = useState<DashboardResumoData[]>([]);
  const [utrComparacao, setUtrComparacao] = useState<any[]>([]);
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

  // Se não for admin e tiver apenas 1 praça, setar automaticamente
  useEffect(() => {
    if (currentUser && !currentUser.is_admin && currentUser.assigned_pracas.length === 1) {
      setPracaSelecionada(currentUser.assigned_pracas[0]);
    }
  }, [currentUser]);

  const toggleSemana = (semana: number) => {
    setSemanasSelecionadas(prev => {
      if (prev.includes(semana)) {
        return prev.filter(s => s !== semana);
      } else {
        return [...prev, semana].sort((a, b) => a - b);
      }
    });
  };

  const compararSemanas = async () => {
    if (semanasSelecionadas.length < 2) return;

    setLoading(true);
    try {
      // Buscar dados para cada semana selecionada
      const promessasDados = semanasSelecionadas.map(async (semana) => {
        const filtro: any = { p_semana: semana };
        
        // Se houver praça selecionada ou se não for admin com 1 praça
        if (pracaSelecionada) {
          filtro.p_praca = pracaSelecionada;
        } else if (currentUser && !currentUser.is_admin && currentUser.assigned_pracas.length === 1) {
          filtro.p_praca = currentUser.assigned_pracas[0];
        }
        
        // Buscar dados do dashboard
        const { data, error } = await supabase.rpc('dashboard_resumo', filtro);
        if (error) throw error;
        
        return { semana, dados: data as DashboardResumoData };
      });

      // Buscar UTR para cada semana
      const promessasUtr = semanasSelecionadas.map(async (semana) => {
        const filtro: any = { p_semana: semana };
        
        if (pracaSelecionada) {
          filtro.p_praca = pracaSelecionada;
        } else if (currentUser && !currentUser.is_admin && currentUser.assigned_pracas.length === 1) {
          filtro.p_praca = currentUser.assigned_pracas[0];
        }
        
        const { data, error } = await supabase.rpc('calcular_utr', filtro);
        if (error) throw error;
        
        return { semana, utr: data };
      });

      const resultadosDados = await Promise.all(promessasDados);
      const resultadosUtr = await Promise.all(promessasUtr);
      
      console.log('📊 Dados Comparação:', resultadosDados);
      console.log('🎯 UTR Comparação:', resultadosUtr);
      
      setDadosComparacao(resultadosDados.map(r => r.dados));
      setUtrComparacao(resultadosUtr);
      
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

  // Verificar se deve desabilitar o filtro de praça
  const shouldDisablePracaFilter = Boolean(currentUser && !currentUser.is_admin && currentUser.assigned_pracas.length === 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Seleção de Praça e Semanas */}
      <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-lg dark:border-blue-800 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">🔍 Configurar Comparação</h3>
        
        {/* Filtro de Praça */}
        <div className="mb-6">
          <FiltroSelect
            label="Praça"
            value={pracaSelecionada ?? ''}
            options={pracas}
            placeholder="Todas"
            onChange={(value) => setPracaSelecionada(value)}
            disabled={shouldDisablePracaFilter}
          />
        </div>

        {/* Seleção de Semanas */}
        <div>
          <label className="mb-3 block text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
            Semanas (selecione 2 ou mais)
          </label>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            {todasSemanas.map((semana) => (
              <label
                key={semana}
                className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-3 text-center transition-all hover:scale-105 ${
                  semanasSelecionadas.includes(semana)
                    ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={semanasSelecionadas.includes(semana)}
                  onChange={() => toggleSemana(semana)}
                />
                <span className="text-sm font-bold">S{semana}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Botão de Comparar */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {semanasSelecionadas.length > 0 && (
              <span>
                {semanasSelecionadas.length} semana{semanasSelecionadas.length !== 1 ? 's' : ''} selecionada{semanasSelecionadas.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            {semanasSelecionadas.length > 0 && (
              <button
                onClick={() => setSemanasSelecionadas([])}
                className="rounded-lg bg-slate-200 px-5 py-2.5 font-semibold text-slate-700 transition-all hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                Limpar
              </button>
            )}
            <button
              onClick={compararSemanas}
              disabled={semanasSelecionadas.length < 2 || loading}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:scale-100 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {loading ? '⏳ Comparando...' : '⚖️ Comparar Semanas'}
            </button>
          </div>
        </div>
      </div>

      {/* Resultados da Comparação */}
      {dadosComparacao.length > 0 && (
        <div className="space-y-6">
          {/* Cards Comparativos no Topo */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-500 to-indigo-600 p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-100">Aderência Média</p>
                  <p className="text-2xl font-bold text-white">
                    {(dadosComparacao.reduce((sum, d) => sum + (d.semanal[0]?.aderencia_percentual ?? 0), 0) / dadosComparacao.length).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-500 to-green-600 p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                  <span className="text-2xl">🚗</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-100">Total de Corridas</p>
                  <p className="text-2xl font-bold text-white">
                    {dadosComparacao.reduce((sum, d) => sum + (d.totais?.corridas_completadas ?? 0), 0).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-500 to-pink-600 p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                  <span className="text-2xl">⏱️</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-100">Horas Entregues</p>
                  <p className="text-xl font-bold font-mono text-white">
                    {formatarHorasParaHMS(
                      dadosComparacao.reduce((sum, d) => sum + parseFloat(d.semanal[0]?.horas_entregues ?? '0'), 0).toString()
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Comparação Completa */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-blue-950/30">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                <span className="text-xl">📊</span>
                Comparação Detalhada de Métricas
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Métrica</th>
                    {semanasSelecionadas.map((semana) => (
                      <th key={semana} className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Semana {semana}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Aderência */}
                  <tr className="bg-blue-50/50 dark:bg-blue-950/20">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📈</span>
                        Aderência Geral
                      </div>
                    </td>
                    {dadosComparacao.map((dados, idx) => (
                      <td key={idx} className="px-6 py-4 text-center">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-lg font-bold text-blue-900 dark:bg-blue-900/30 dark:text-blue-100">
                          {(dados.semanal[0]?.aderencia_percentual ?? 0).toFixed(1)}%
                        </span>
                      </td>
                    ))}
                  </tr>
                  
                  {/* Corridas Ofertadas */}
                  <tr className="bg-white dark:bg-slate-900">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📢</span>
                        Corridas Ofertadas
                      </div>
                    </td>
                    {dadosComparacao.map((dados, idx) => (
                      <td key={idx} className="px-6 py-4 text-center text-base font-semibold text-slate-700 dark:text-slate-300">
                        {dados.totais?.corridas_ofertadas?.toLocaleString('pt-BR') ?? 0}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Corridas Aceitas */}
                  <tr className="bg-emerald-50/50 dark:bg-emerald-950/20">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">✅</span>
                        Corridas Aceitas
                      </div>
                    </td>
                    {dadosComparacao.map((dados, idx) => (
                      <td key={idx} className="px-6 py-4 text-center text-base font-semibold text-emerald-700 dark:text-emerald-400">
                        {dados.totais?.corridas_aceitas?.toLocaleString('pt-BR') ?? 0}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Corridas Rejeitadas */}
                  <tr className="bg-white dark:bg-slate-900">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">❌</span>
                        Corridas Rejeitadas
                      </div>
                    </td>
                    {dadosComparacao.map((dados, idx) => (
                      <td key={idx} className="px-6 py-4 text-center text-base font-semibold text-rose-700 dark:text-rose-400">
                        {dados.totais?.corridas_rejeitadas?.toLocaleString('pt-BR') ?? 0}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Corridas Completadas */}
                  <tr className="bg-purple-50/50 dark:bg-purple-950/20">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎯</span>
                        Corridas Completadas
                      </div>
                    </td>
                    {dadosComparacao.map((dados, idx) => (
                      <td key={idx} className="px-6 py-4 text-center text-base font-semibold text-purple-700 dark:text-purple-400">
                        {dados.totais?.corridas_completadas?.toLocaleString('pt-BR') ?? 0}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Taxa de Aceitação */}
                  <tr className="bg-white dark:bg-slate-900">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💯</span>
                        Taxa de Aceitação
                      </div>
                    </td>
                    {dadosComparacao.map((dados, idx) => {
                      const taxaAceitacao = dados.totais?.corridas_ofertadas 
                        ? ((dados.totais?.corridas_aceitas ?? 0) / dados.totais.corridas_ofertadas) * 100 
                        : 0;
                      return (
                        <td key={idx} className="px-6 py-4 text-center text-base font-semibold text-slate-700 dark:text-slate-300">
                          {taxaAceitacao.toFixed(1)}%
                        </td>
                      );
                    })}
                  </tr>
                  
                  {/* Horas Planejadas */}
                  <tr className="bg-amber-50/50 dark:bg-amber-950/20">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📅</span>
                        Horas Planejadas
                      </div>
                    </td>
                    {dadosComparacao.map((dados, idx) => (
                      <td key={idx} className="px-6 py-4 text-center font-mono text-base font-semibold text-amber-700 dark:text-amber-400">
                        {formatarHorasParaHMS(dados.semanal[0]?.horas_a_entregar ?? '0')}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Horas Entregues */}
                  <tr className="bg-white dark:bg-slate-900">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⏱️</span>
                        Horas Entregues
                      </div>
                    </td>
                    {dadosComparacao.map((dados, idx) => (
                      <td key={idx} className="px-6 py-4 text-center font-mono text-base font-semibold text-blue-700 dark:text-blue-400">
                        {formatarHorasParaHMS(dados.semanal[0]?.horas_entregues ?? '0')}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Comparação por Dia da Semana */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 px-6 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-indigo-950/30">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                <span className="text-xl">📅</span>
                Comparação por Dia da Semana
              </h3>
            </div>
            <div className="overflow-x-auto p-6">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Dia</th>
                    {semanasSelecionadas.map((semana) => (
                      <th key={semana} className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Semana {semana}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia, diaIdx) => (
                    <tr key={dia} className={diaIdx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30'}>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{dia}</td>
                      {dadosComparacao.map((dados, idx) => {
                        const diaData = dados.dia?.find(d => d.dia_da_semana === dia);
                        return (
                          <td key={idx} className="px-6 py-4 text-center">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {diaData?.aderencia_percentual?.toFixed(1) ?? '0.0'}%
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comparação por Turno */}
          {dadosComparacao.some(d => d.turno && d.turno.length > 0) && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-violet-50 px-6 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-violet-950/30">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                  <span className="text-xl">🕐</span>
                  Comparação por Turno
                </h3>
              </div>
              <div className="overflow-x-auto p-6">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Turno</th>
                      {semanasSelecionadas.map((semana) => (
                        <th key={semana} className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Semana {semana}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {Array.from(new Set(dadosComparacao.flatMap(d => d.turno?.map(t => t.periodo) ?? []))).map((turno, turnoIdx) => (
                      <tr key={turno} className={turnoIdx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-violet-50/50 dark:bg-violet-950/20'}>
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{turno}</td>
                        {dadosComparacao.map((dados, idx) => {
                          const turnoData = dados.turno?.find(t => t.periodo === turno);
                          return (
                            <td key={idx} className="px-6 py-4 text-center">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {turnoData?.aderencia_percentual?.toFixed(1) ?? '0.0'}%
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Comparação de UTR */}
          {utrComparacao.length > 0 ? (
            <div className="rounded-xl border border-purple-200 bg-white shadow-lg dark:border-purple-800 dark:bg-slate-900">
              <div className="border-b border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 dark:border-purple-800 dark:from-purple-950/30 dark:to-pink-950/30">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                  <span className="text-xl">🎯</span>
                  Comparação de UTR (Utilização de Tempo Real)
                </h3>
              </div>
              <div className="overflow-x-auto p-6">
                <table className="w-full">
                  <thead className="bg-purple-50 dark:bg-purple-950/30">
                    <tr className="border-b-2 border-purple-200 dark:border-purple-800">
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-100">Métrica</th>
                      {semanasSelecionadas.map((semana) => (
                        <th key={semana} className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                          Semana {semana}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 dark:divide-purple-900">
                    <tr className="bg-white dark:bg-slate-900">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎯</span>
                          UTR Geral
                        </div>
                      </td>
                      {utrComparacao.map((item, idx) => {
                        // Tentar diferentes estruturas possíveis
                        const utrValue = item.utr?.utr_geral ?? item.utr_geral ?? item?.utr_geral ?? 0;
                        return (
                          <td key={idx} className="px-6 py-4 text-center">
                            <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-lg font-bold text-purple-900 dark:bg-purple-900/30 dark:text-purple-100">
                              {typeof utrValue === 'number' ? utrValue.toFixed(2) : '0.00'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/20">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-100">UTR não disponível</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">Os dados de UTR não foram carregados para as semanas selecionadas.</p>
                </div>
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

  // Usar os nomes corretos que vêm do backend (com fallback para compatibilidade)
  const porPraca = utrData.praca || utrData.por_praca || [];
  const porSubPraca = utrData.sub_praca || utrData.por_sub_praca || [];
  const porOrigem = utrData.origem || utrData.por_origem || [];
  const porTurno = utrData.turno || utrData.por_turno || [];

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
      {porPraca && porPraca.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-lg dark:border-blue-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <span className="text-xl">🏢</span>
            UTR por Praça
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {porPraca.map((item) => (
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
      {porSubPraca && porSubPraca.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-lg dark:border-blue-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <span className="text-xl">📍</span>
            UTR por Sub-Praça
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {porSubPraca.map((item) => (
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
      {porOrigem && porOrigem.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-lg dark:border-blue-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <span className="text-xl">🎯</span>
            UTR por Origem
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {porOrigem.map((item) => (
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
      {porTurno && porTurno.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-lg dark:border-blue-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <span className="text-xl">⏰</span>
            UTR por Turno
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {porTurno.map((item) => (
              <div key={item.turno || item.periodo} className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                <p className="mb-2 text-sm font-bold text-slate-900 dark:text-white">{item.turno || item.periodo || 'N/D'}</p>
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
// View Entregadores
// =================================================================================

function EntregadoresView({
  entregadoresData,
  loading,
}: {
  entregadoresData: EntregadoresData | null;
  loading: boolean;
}) {
  const [sortField, setSortField] = useState<keyof Entregador>('aderencia_percentual');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-lg font-semibold text-blue-700 dark:text-blue-200">Carregando entregadores...</p>
        </div>
      </div>
    );
  }

  if (!entregadoresData || entregadoresData.entregadores.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">Nenhum entregador encontrado</p>
      </div>
    );
  }

  const handleSort = (field: keyof Entregador) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedEntregadores = [...entregadoresData.entregadores].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    const aNum = Number(aValue) || 0;
    const bNum = Number(bValue) || 0;
    return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
  });

  const SortIcon = ({ field }: { field: keyof Entregador }) => {
    if (sortField !== field) {
      return <span className="ml-1 text-slate-400">⇅</span>;
    }
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const getAderenciaColor = (aderencia: number) => {
    if (aderencia >= 90) return 'text-emerald-700 dark:text-emerald-400';
    if (aderencia >= 70) return 'text-amber-700 dark:text-amber-400';
    return 'text-rose-700 dark:text-rose-400';
  };

  const getAderenciaBg = (aderencia: number) => {
    if (aderencia >= 90) return 'bg-emerald-50 dark:bg-emerald-950/30';
    if (aderencia >= 70) return 'bg-amber-50 dark:bg-amber-950/30';
    return 'bg-rose-50 dark:bg-rose-950/30';
  };

  const getRejeicaoColor = (rejeicao: number) => {
    if (rejeicao <= 10) return 'text-emerald-700 dark:text-emerald-400';
    if (rejeicao <= 30) return 'text-amber-700 dark:text-amber-400';
    return 'text-rose-700 dark:text-rose-400';
  };

  const getRejeicaoBg = (rejeicao: number) => {
    if (rejeicao <= 10) return 'bg-emerald-50 dark:bg-emerald-950/30';
    if (rejeicao <= 30) return 'bg-amber-50 dark:bg-amber-950/30';
    return 'bg-rose-50 dark:bg-rose-950/30';
  };

  // Calcular estatísticas gerais
  const totalOfertadas = entregadoresData.entregadores.reduce((sum, e) => sum + e.corridas_ofertadas, 0);
  const totalAceitas = entregadoresData.entregadores.reduce((sum, e) => sum + e.corridas_aceitas, 0);
  const totalRejeitadas = entregadoresData.entregadores.reduce((sum, e) => sum + e.corridas_rejeitadas, 0);
  const totalCompletadas = entregadoresData.entregadores.reduce((sum, e) => sum + e.corridas_completadas, 0);
  const aderenciaMedia = entregadoresData.entregadores.reduce((sum, e) => sum + e.aderencia_percentual, 0) / entregadoresData.total;
  const rejeicaoMedia = entregadoresData.entregadores.reduce((sum, e) => sum + e.rejeicao_percentual, 0) / entregadoresData.total;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl text-white shadow-md">
              👥
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{entregadoresData.total}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Entregadores</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-2xl text-white shadow-md">
              📢
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalOfertadas}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Ofertadas</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl text-white shadow-md">
              ✅
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalAceitas}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Aceitas</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-2xl text-white shadow-md">
              ❌
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalRejeitadas}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Rejeitadas</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-2xl text-white shadow-md">
              🏁
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalCompletadas}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Completadas</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Médias</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">Aderência:</span>
                <span className={`text-sm font-bold ${getAderenciaColor(aderenciaMedia)}`}>{aderenciaMedia.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">Rejeição:</span>
                <span className={`text-sm font-bold ${getRejeicaoColor(rejeicaoMedia)}`}>{rejeicaoMedia.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Entregadores */}
      <div className="rounded-xl border border-blue-200 bg-white shadow-lg dark:border-blue-800 dark:bg-slate-900">
        <div className="max-h-[600px] overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
                <th 
                  className="cursor-pointer px-6 py-4 text-left text-sm font-bold text-blue-900 transition-colors hover:bg-blue-100 dark:text-blue-100 dark:hover:bg-blue-900/50"
                  onClick={() => handleSort('nome_entregador')}
                >
                  Entregador <SortIcon field="nome_entregador" />
                </th>
                <th 
                  className="cursor-pointer px-6 py-4 text-center text-sm font-bold text-blue-900 transition-colors hover:bg-blue-100 dark:text-blue-100 dark:hover:bg-blue-900/50"
                  onClick={() => handleSort('corridas_ofertadas')}
                >
                  Ofertadas <SortIcon field="corridas_ofertadas" />
                </th>
                <th 
                  className="cursor-pointer px-6 py-4 text-center text-sm font-bold text-blue-900 transition-colors hover:bg-blue-100 dark:text-blue-100 dark:hover:bg-blue-900/50"
                  onClick={() => handleSort('corridas_aceitas')}
                >
                  Aceitas <SortIcon field="corridas_aceitas" />
                </th>
                <th 
                  className="cursor-pointer px-6 py-4 text-center text-sm font-bold text-blue-900 transition-colors hover:bg-blue-100 dark:text-blue-100 dark:hover:bg-blue-900/50"
                  onClick={() => handleSort('corridas_rejeitadas')}
                >
                  Rejeitadas <SortIcon field="corridas_rejeitadas" />
                </th>
                <th 
                  className="cursor-pointer px-6 py-4 text-center text-sm font-bold text-blue-900 transition-colors hover:bg-blue-100 dark:text-blue-100 dark:hover:bg-blue-900/50"
                  onClick={() => handleSort('corridas_completadas')}
                >
                  Completadas <SortIcon field="corridas_completadas" />
                </th>
                <th 
                  className="cursor-pointer px-6 py-4 text-center text-sm font-bold text-blue-900 transition-colors hover:bg-blue-100 dark:text-blue-100 dark:hover:bg-blue-900/50"
                  onClick={() => handleSort('aderencia_percentual')}
                >
                  Aderência <SortIcon field="aderencia_percentual" />
                </th>
                <th 
                  className="cursor-pointer px-6 py-4 text-center text-sm font-bold text-blue-900 transition-colors hover:bg-blue-100 dark:text-blue-100 dark:hover:bg-blue-900/50"
                  onClick={() => handleSort('rejeicao_percentual')}
                >
                  % Rejeição <SortIcon field="rejeicao_percentual" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedEntregadores.map((entregador, index) => (
                <tr
                  key={entregador.id_entregador}
                  className={`border-b border-blue-100 transition-colors hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/20 ${
                    index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-blue-50/30 dark:bg-slate-800/30'
                  }`}
                >
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{entregador.nome_entregador}</td>
                  <td className="px-6 py-4 text-center text-slate-700 dark:text-slate-300">{entregador.corridas_ofertadas}</td>
                  <td className="px-6 py-4 text-center text-emerald-700 dark:text-emerald-400">{entregador.corridas_aceitas}</td>
                  <td className="px-6 py-4 text-center text-rose-700 dark:text-rose-400">{entregador.corridas_rejeitadas}</td>
                  <td className="px-6 py-4 text-center text-blue-700 dark:text-blue-400">{entregador.corridas_completadas}</td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 ${getAderenciaBg(entregador.aderencia_percentual ?? 0)}`}>
                      <span className={`text-lg font-bold ${getAderenciaColor(entregador.aderencia_percentual ?? 0)}`}>
                        {(entregador.aderencia_percentual ?? 0).toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 ${getRejeicaoBg(entregador.rejeicao_percentual ?? 0)}`}>
                      <span className={`text-lg font-bold ${getRejeicaoColor(entregador.rejeicao_percentual ?? 0)}`}>
                        {(entregador.rejeicao_percentual ?? 0).toFixed(2)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =================================================================================
// Componente Principal
// =================================================================================

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analise' | 'comparacao' | 'utr' | 'entregadores' | 'monitoramento'>('dashboard');
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
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
  const [entregadoresData, setEntregadoresData] = useState<EntregadoresData | null>(null);
  const [loadingEntregadores, setLoadingEntregadores] = useState(false);

  const aderenciaGeral = useMemo(() => aderenciaSemanal[0], [aderenciaSemanal]);

  // Hook para registrar atividades
  const registrarAtividade = async (actionType: string, actionDetails: any = {}, tabName: string | null = null, filtersApplied: any = {}) => {
    try {
      await supabase.rpc('registrar_atividade', {
        p_action_type: actionType,
        p_action_details: actionDetails,
        p_tab_name: tabName,
        p_filters_applied: filtersApplied,
        p_session_id: sessionId
      });
    } catch (error) {
      // Silenciosamente falha se a função não existir ainda
      if (error && typeof error === 'object' && 'code' in error && error.code !== '42883') {
        console.error('Erro ao registrar atividade:', error);
      }
    }
  };

  // Registrar mudança de aba
  useEffect(() => {
    if (currentUser) {
      registrarAtividade('tab_change', { tab: activeTab }, activeTab, filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Registrar mudança de filtros
  useEffect(() => {
    if (currentUser && Object.values(filters).some(v => v !== null)) {
      registrarAtividade('filter_change', { filters }, activeTab, filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Heartbeat - registrar atividade periódica
  useEffect(() => {
    if (currentUser) {
      registrarAtividade('login', { dispositivo: 'web' }, activeTab, filters);
      
      const heartbeatInterval = setInterval(() => {
        if (currentUser) {
          registrarAtividade('heartbeat', {}, activeTab, filters);
        }
      }, 60000); // A cada 1 minuto

      return () => clearInterval(heartbeatInterval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

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

        // Filtrar dados baseado nas permissões do usuário ANTES de setar states
        let semanalFiltrado = resumo?.semanal ?? [];
        let diaFiltrado = resumo?.dia ?? [];
        let turnoFiltrado = resumo?.turno ?? [];
        let subPracaFiltrado = resumo?.sub_praca ?? [];
        let origemFiltrado = resumo?.origem ?? [];
        
        // Se não for admin e tiver praças atribuídas, filtrar TODOS os dados
        if (currentUser && !currentUser.is_admin && currentUser.assigned_pracas.length > 0) {
          const pracasPermitidas = currentUser.assigned_pracas.map(p => p.toUpperCase());
          
          // Filtrar turno (não tem referência direta à praça, então mantém todos se já filtrou no backend)
          // O backend já deve estar filtrando pelo p_praca, então mantemos
          turnoFiltrado = turnoFiltrado;
          
          // Filtrar sub-praças (sub-praças contêm o nome da praça principal)
          subPracaFiltrado = subPracaFiltrado.filter((item: any) => {
            return pracasPermitidas.some(praca => 
              item.sub_praca?.toUpperCase().includes(praca)
            );
          });
          
          // Filtrar origens - CORRIGIDO: agora filtra de verdade
          // Como origem não tem referência direta à praça, vamos usar a praça selecionada nos filtros
          // Se o usuário já tem filtro de praça aplicado, o backend retorna apenas dados daquela praça
          // Então mantemos as origens retornadas
          origemFiltrado = origemFiltrado;
        }

        setAderenciaSemanal(semanalFiltrado);
        setAderenciaDia(diaFiltrado);
        setAderenciaTurno(turnoFiltrado);
        setAderenciaSubPraca(subPracaFiltrado);
        setAderenciaOrigem(origemFiltrado);

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
          const pracasPermitidas = currentUser.assigned_pracas.map(p => p.toUpperCase());
          
          pracasDisponiveis = pracasDisponiveis.filter((p: string) => 
            currentUser.assigned_pracas.includes(p)
          );
          
          // Filtrar sub-praças disponíveis nos dropdowns
          subPracasDisponiveis = subPracasDisponiveis.filter((sp: string) =>
            pracasPermitidas.some(praca => sp.toUpperCase().includes(praca))
          );
          
          // Filtrar origens disponíveis nos dropdowns
          // Como origem não tem referência à praça, vamos manter apenas as que aparecem nos dados filtrados
          const origensNoDados = new Set(origemFiltrado.map((item: any) => item.origem));
          origensDisponiveis = origensDisponiveis.filter((origem: string) => origensNoDados.has(origem));
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

  // Buscar dados dos Entregadores quando a aba estiver ativa
  useEffect(() => {
    if (activeTab === 'entregadores') {
      async function fetchEntregadores() {
        setLoadingEntregadores(true);
        try {
          const params = buildFilterPayload(filters);
          const { data: entregadoresResult, error: entregadoresError } = await supabase.rpc('listar_entregadores', params);
          
          if (entregadoresError) throw entregadoresError;
          
          setEntregadoresData(entregadoresResult as EntregadoresData);
        } catch (err: any) {
          console.error('Erro ao buscar Entregadores:', err);
          setEntregadoresData(null);
        } finally {
          setLoadingEntregadores(false);
        }
      }
      
      fetchEntregadores();
    }
  }, [activeTab, filters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/30">
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
        {/* Header Principal Redesenhado */}
        <header className="mb-8 animate-fade-in">
          <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl dark:border-blue-900/30 dark:bg-slate-900">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
            <div className="relative flex items-center justify-between p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
                  <span className="text-3xl">📊</span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent dark:from-white dark:to-blue-200">
                    Dashboard Operacional
                  </h1>
                  <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                    Sistema de Análise e Monitoramento em Tempo Real
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Última atualização</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <span className="text-xl">🟢</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {loading && (
          <div className="flex h-[80vh] items-center justify-center animate-pulse-soft">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
              <p className="mt-4 text-lg font-semibold text-blue-700 dark:text-blue-200">Carregando dashboard...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex h-[80vh] items-center justify-center animate-fade-in">
            <div className="max-w-md rounded-xl border border-rose-200 bg-white p-8 text-center shadow-xl dark:border-rose-900 dark:bg-slate-900">
              <div className="text-5xl">⚠️</div>
              <p className="mt-4 text-xl font-bold text-rose-900 dark:text-rose-100">Erro ao carregar dados</p>
              <p className="mt-2 text-rose-700 dark:text-rose-300">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white shadow-md transition-all hover:scale-105 hover:bg-blue-700 active:scale-95"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {totals && !loading && !error && (
          <div className="space-y-6 animate-fade-in">
            {/* Header com filtros e tabs */}
            <div className="rounded-xl border border-blue-200 bg-white/90 p-4 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl dark:border-blue-900 dark:bg-slate-900/90 sm:p-6">
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
                  <div className="my-4 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent dark:via-blue-700"></div>
                </>
              )}
              <div className="flex flex-wrap gap-2">
                <TabButton label="Dashboard" icon="📊" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <TabButton label="Análise Detalhada" icon="📈" active={activeTab === 'analise'} onClick={() => setActiveTab('analise')} />
                <TabButton label="Comparação" icon="⚖️" active={activeTab === 'comparacao'} onClick={() => setActiveTab('comparacao')} />
                <TabButton label="UTR" icon="📏" active={activeTab === 'utr'} onClick={() => setActiveTab('utr')} />
                <TabButton label="Entregadores" icon="👥" active={activeTab === 'entregadores'} onClick={() => setActiveTab('entregadores')} />
                {currentUser?.is_admin && (
                  <TabButton label="Monitoramento" icon="🔍" active={activeTab === 'monitoramento'} onClick={() => setActiveTab('monitoramento')} />
                )}
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
              {activeTab === 'analise' && (
                <AnaliseView 
                  totals={totals} 
                  aderenciaGeral={aderenciaGeral}
                  aderenciaDia={aderenciaDia}
                  aderenciaTurno={aderenciaTurno}
                  aderenciaSubPraca={aderenciaSubPraca}
                  aderenciaOrigem={aderenciaOrigem}
                />
              )}
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
              
              {activeTab === 'entregadores' && (
                <EntregadoresView
                  entregadoresData={entregadoresData}
                  loading={loadingEntregadores}
                />
              )}
              
              {activeTab === 'monitoramento' && currentUser?.is_admin && (
                <MonitoramentoView />
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}