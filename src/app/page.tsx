'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  semanas: string[];
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

interface ValoresEntregador {
  id_entregador: string;
  nome_entregador: string;
  total_taxas: number;
  numero_corridas_aceitas: number;
  taxa_media: number;
}

interface ValoresData {
  valores: ValoresEntregador[];
  total_geral: number;
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

interface EvolucaoMensal {
  ano: number;
  mes: number;
  mes_nome: string;
  total_corridas: number;
  total_segundos: number;
}

interface EvolucaoSemanal {
  ano: number;
  semana: number;
  semana_label: string;
  total_corridas: number;
  total_segundos: number;
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

const TabButton = React.memo(({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 relative flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap overflow-hidden ${
        active
          ? 'bg-white text-blue-700 shadow-lg dark:bg-slate-800 dark:text-blue-300 border-2 border-blue-400 dark:border-blue-600'
          : 'bg-white/50 text-slate-700 hover:bg-white hover:shadow-md dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800 border border-transparent'
      }`}
    >
      {active && (
        <div className="absolute -bottom-0.5 left-1/2 h-1 w-8 sm:w-12 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"></div>
      )}
      <span className="text-sm sm:text-base">{icon}</span>
      <span className="hidden xs:inline sm:inline truncate">{label}</span>
    </button>
  );
});

TabButton.displayName = 'TabButton';

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
    <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 lg:p-6 shadow-md transition-all duration-300 hover-lift hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div className={`absolute right-0 top-0 h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gradient-to-br ${colorClasses[color]} opacity-10 blur-3xl transition-opacity group-hover:opacity-20`}></div>
      
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 truncate">{title}</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 transition-transform group-hover:scale-105 dark:text-white">{value.toLocaleString('pt-BR')}</p>
          {percentage !== undefined && (
            <div className="mt-2 sm:mt-3 flex items-center gap-2 flex-wrap">
              <div className="rounded-lg bg-blue-50 px-2 py-1 dark:bg-blue-950/30">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {percentage.toFixed(1)}%
                </span>
              </div>
              {percentageLabel && (
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{percentageLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={`flex h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ${colorClasses[color]} text-xl sm:text-2xl lg:text-3xl text-white shadow-lg transition-transform group-hover:rotate-3 group-hover:scale-110`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

const AderenciaCard = React.memo(({ 
  title, 
  planejado, 
  entregue, 
  percentual 
}: { 
  title: string; 
  planejado: string; 
  entregue: string; 
  percentual: number;
}) => {
  const colorClass = getAderenciaColor(percentual);
  const bgClass = getAderenciaBgColor(percentual);

  return (
    <div className={`group rounded-xl sm:rounded-2xl border p-3 sm:p-4 lg:p-5 shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${bgClass} overflow-hidden`}>
      <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2">
        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 truncate flex-1 min-w-0" title={title}>{title}</h3>
        <span className={`shrink-0 rounded-full px-2 sm:px-3 py-1 text-sm sm:text-base lg:text-lg font-bold ${colorClass} bg-white/50 dark:bg-slate-900/50`}>
          {(percentual ?? 0).toFixed(1)}%
        </span>
      </div>
      <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
        <div className="flex items-center justify-between gap-2 rounded-lg bg-white/30 px-2 sm:px-3 py-1.5 sm:py-2 dark:bg-slate-900/30">
          <span className="font-medium text-slate-600 dark:text-slate-400 shrink-0">Planejado:</span>
          <span className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">{formatarHorasParaHMS(planejado)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-white/30 px-2 sm:px-3 py-1.5 sm:py-2 dark:bg-slate-900/30">
          <span className="font-medium text-slate-600 dark:text-slate-400 shrink-0">Entregue:</span>
          <span className="font-mono text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 truncate">{formatarHorasParaHMS(entregue)}</span>
        </div>
      </div>
      <div className="mt-3 sm:mt-4 h-2 sm:h-2.5 overflow-hidden rounded-full bg-white/50 dark:bg-slate-800/50">
        <div 
          className={`h-full rounded-full transition-all duration-700 ${percentual >= 90 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : percentual >= 70 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-rose-500 to-rose-600'}`}
          style={{ width: `${Math.min(percentual, 100)}%` }}
        ></div>
      </div>
    </div>
  );
});

AderenciaCard.displayName = 'AderenciaCard';

const FiltroSelect = React.memo(({ label, placeholder, options, value, onChange, disabled = false }: {
  label: string;
  placeholder: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}) => {
  return (
    <label className="flex flex-col gap-1 sm:gap-1.5">
      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300 truncate">{label}</span>
      <div className="relative">
        <select
          className="w-full appearance-none rounded-lg sm:rounded-xl border-2 border-blue-200 bg-white px-2.5 sm:px-3 py-2 sm:py-2.5 pr-8 sm:pr-10 text-xs sm:text-sm font-medium text-blue-900 shadow-sm transition-all hover:border-blue-400 hover:shadow-md focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-100 dark:hover:border-blue-600 dark:focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-blue-200"
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
        <div className="pointer-events-none absolute right-2 sm:right-3 top-1/2 -translate-y-1/2">
          <svg className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {value && !disabled && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onChange(null);
            }}
            className="absolute right-7 sm:right-9 top-1/2 -translate-y-1/2 rounded-full p-0.5 sm:p-1 text-slate-400 transition-all hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400"
            title="Limpar filtro"
          >
            <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </label>
  );
});

FiltroSelect.displayName = 'FiltroSelect';

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
  semanas: string[];
  pracas: FilterOption[];
  subPracas: FilterOption[];
  origens: FilterOption[];
  currentUser: { is_admin: boolean; assigned_pracas: string[] } | null;
}) {
  const handleChange = (key: keyof Filters, rawValue: string | null) => {
    setFilters((prev) => {
      let processedValue: any = null;
      
      if (rawValue && rawValue !== '') {
        if (key === 'ano') {
          processedValue = Number(rawValue);
        } else if (key === 'semana') {
          // Extrair número da semana do formato "2025-W43"
          const match = rawValue.match(/W(\d+)/);
          processedValue = match ? Number(match[1]) : Number(rawValue);
        } else {
          processedValue = rawValue;
        }
      }
      
      return {
        ...prev,
        [key]: processedValue,
      };
    });
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
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-5">
      <FiltroSelect
        label="Ano"
        value={filters.ano !== null ? String(filters.ano) : ''}
        options={anos.map((ano) => ({ value: String(ano), label: String(ano) }))}
        placeholder="Todos"
        onChange={(value) => handleChange('ano', value)}
      />
      <FiltroSelect
        label="Semana"
        value={
          filters.semana !== null 
            ? semanas.find(s => {
                const match = s.match(/W(\d+)/);
                return match && Number(match[1]) === filters.semana;
              }) || ''
            : ''
        }
        options={semanas.map((sem) => {
          const match = sem.match(/W(\d+)/);
          const semanaNum = match ? match[1] : sem;
          return { 
            value: sem, 
            label: `Semana ${semanaNum}` 
          };
        })}
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
        <div className="flex justify-center sm:justify-end animate-scale-in">
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 hover:from-rose-600 hover:to-pink-700 active:scale-95"
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden xs:inline">Limpar Todos os Filtros</span>
            <span className="xs:hidden">Limpar Filtros</span>
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
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-blue-200 bg-white p-4 sm:p-6 lg:p-8 shadow-xl dark:border-blue-800 dark:bg-slate-900 animate-slide-up">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/10"></div>
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1 w-full">
              <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shrink-0">
                  <span className="text-xl sm:text-2xl">📊</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Aderência Geral</h2>
                  <p className="mt-0.5 sm:mt-1 text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                    {(aderenciaGeral.aderencia_percentual ?? 0).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4 dark:border-slate-700 dark:bg-slate-800/80 hover-lift">
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">📅 Planejado</p>
                  <p className="mt-1 font-mono text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white truncate">
                    {formatarHorasParaHMS(aderenciaGeral.horas_a_entregar)}
                  </p>
                </div>
                <div className="rounded-lg sm:rounded-xl border border-blue-200 bg-blue-50/80 p-3 sm:p-4 dark:border-blue-800 dark:bg-blue-950/50 hover-lift">
                  <p className="text-[10px] sm:text-xs font-medium text-blue-600 dark:text-blue-400">⏱️ Entregue</p>
                  <p className="mt-1 font-mono text-sm sm:text-base lg:text-lg font-bold text-blue-900 dark:text-blue-100 truncate">
                    {formatarHorasParaHMS(aderenciaGeral.horas_entregues)}
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden lg:flex h-24 w-24 xl:h-32 xl:w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 shrink-0">
              <span className="text-5xl xl:text-6xl">🎯</span>
            </div>
          </div>
        </div>
      )}

      {/* Destaques da Operação */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <div className="group rounded-lg sm:rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-2.5 sm:p-3 lg:p-4 dark:border-emerald-800 dark:from-emerald-950/30 dark:to-teal-950/30 hover-lift">
          <div className="flex items-center gap-1 sm:gap-1.5 text-emerald-700 dark:text-emerald-300">
            <span className="text-sm sm:text-base lg:text-lg">📊</span>
            <p className="text-[10px] sm:text-xs font-semibold truncate">Melhor Dia</p>
          </div>
          <p className="mt-1 sm:mt-1.5 text-base sm:text-lg lg:text-xl font-bold text-emerald-900 dark:text-emerald-100 truncate">
            {aderenciaDia.length > 0 
              ? aderenciaDia.reduce((max, dia) => (dia.aderencia_percentual ?? 0) > (max.aderencia_percentual ?? 0) ? dia : max).dia_da_semana
              : '-'}
          </p>
          <p className="mt-0.5 text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {aderenciaDia.length > 0 
              ? `${aderenciaDia.reduce((max, dia) => (dia.aderencia_percentual ?? 0) > (max.aderencia_percentual ?? 0) ? dia : max).aderencia_percentual?.toFixed(1) || '0'}%`
              : 'N/D'}
          </p>
        </div>

        <div className="group rounded-lg sm:rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-2.5 sm:p-3 lg:p-4 dark:border-blue-800 dark:from-blue-950/30 dark:to-cyan-950/30 hover-lift">
          <div className="flex items-center gap-1 sm:gap-1.5 text-blue-700 dark:text-blue-300">
            <span className="text-sm sm:text-base lg:text-lg">⏰</span>
            <p className="text-[10px] sm:text-xs font-semibold truncate">Melhor Turno</p>
          </div>
          <p className="mt-1 sm:mt-1.5 text-base sm:text-lg lg:text-xl font-bold text-blue-900 dark:text-blue-100 truncate" title={aderenciaTurno.length > 0 ? aderenciaTurno.reduce((max, turno) => (turno.aderencia_percentual ?? 0) > (max.aderencia_percentual ?? 0) ? turno : max).periodo : '-'}>
            {aderenciaTurno.length > 0 
              ? aderenciaTurno.reduce((max, turno) => (turno.aderencia_percentual ?? 0) > (max.aderencia_percentual ?? 0) ? turno : max).periodo
              : '-'}
          </p>
          <p className="mt-0.5 text-[10px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400">
            {aderenciaTurno.length > 0 
              ? `${aderenciaTurno.reduce((max, turno) => (turno.aderencia_percentual ?? 0) > (max.aderencia_percentual ?? 0) ? turno : max).aderencia_percentual?.toFixed(1) || '0'}%`
              : 'N/D'}
          </p>
        </div>

        <div className="group rounded-lg sm:rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-2.5 sm:p-3 lg:p-4 dark:border-violet-800 dark:from-violet-950/30 dark:to-purple-950/30 hover-lift">
          <div className="flex items-center gap-1 sm:gap-1.5 text-violet-700 dark:text-violet-300">
            <span className="text-sm sm:text-base lg:text-lg">📍</span>
            <p className="text-[10px] sm:text-xs font-semibold truncate">Melhor Sub-Praça</p>
          </div>
          <p className="mt-1 sm:mt-1.5 text-base sm:text-lg lg:text-xl font-bold text-violet-900 dark:text-violet-100 truncate" title={aderenciaSubPraca.length > 0 ? aderenciaSubPraca.reduce((max, sp) => (sp.aderencia_percentual ?? 0) > (max.aderencia_percentual ?? 0) ? sp : max).sub_praca : '-'}>
            {aderenciaSubPraca.length > 0 
              ? aderenciaSubPraca.reduce((max, sp) => (sp.aderencia_percentual ?? 0) > (max.aderencia_percentual ?? 0) ? sp : max).sub_praca
              : '-'}
          </p>
          <p className="mt-0.5 text-[10px] sm:text-xs font-semibold text-violet-600 dark:text-violet-400">
            {aderenciaSubPraca.length > 0 
              ? `${aderenciaSubPraca.reduce((max, sp) => (sp.aderencia_percentual ?? 0) > (max.aderencia_percentual ?? 0) ? sp : max).aderencia_percentual?.toFixed(1) || '0'}%`
              : 'N/D'}
          </p>
        </div>

        <div className="group rounded-lg sm:rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-2.5 sm:p-3 lg:p-4 dark:border-amber-800 dark:from-amber-950/30 dark:to-orange-950/30 hover-lift">
          <div className="flex items-center gap-1 sm:gap-1.5 text-amber-700 dark:text-amber-300">
            <span className="text-sm sm:text-base lg:text-lg">🎯</span>
            <p className="text-[10px] sm:text-xs font-semibold truncate">Melhor Origem</p>
          </div>
          <p className="mt-1 sm:mt-1.5 text-base sm:text-lg lg:text-xl font-bold text-amber-900 dark:text-amber-100 truncate" title={aderenciaOrigem.length > 0 ? aderenciaOrigem.reduce((max, orig) => (orig.aderencia_percentual ?? 0) > (max.aderencia_percentual ?? 0) ? orig : max).origem : '-'}>
            {aderenciaOrigem.length > 0 
              ? aderenciaOrigem.reduce((max, orig) => (orig.aderencia_percentual ?? 0) > (max.aderencia_percentual ?? 0) ? orig : max).origem
              : '-'}
          </p>
          <p className="mt-0.5 text-[10px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400">
            {aderenciaOrigem.length > 0 
              ? `${aderenciaOrigem.reduce((max, orig) => (orig.aderencia_percentual ?? 0) > (max.aderencia_percentual ?? 0) ? orig : max).aderencia_percentual?.toFixed(1) || '0'}%`
              : 'N/D'}
          </p>
        </div>
      </div>

      {/* Aderência por Dia */}
      <div className="rounded-xl sm:rounded-2xl border border-blue-200 bg-white p-4 sm:p-6 shadow-lg dark:border-blue-800 dark:bg-slate-900">
        <div className="mb-4 sm:mb-6 flex items-center gap-2">
          <span className="text-lg sm:text-xl">📅</span>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Aderência por Dia da Semana</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-7">
          {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia) => {
            const data = aderenciaDia.find((d) => d.dia_da_semana === dia);
            if (!data) {
              return (
                <div key={dia} className="rounded-lg sm:rounded-xl bg-slate-50 p-2.5 sm:p-3 text-center dark:bg-slate-800/50 hover-lift">
                  <p className="text-xs sm:text-sm font-semibold text-slate-400">{dia.substring(0, 3)}</p>
                  <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-slate-400">Sem dados</p>
                </div>
              );
            }
            const colorClass = getAderenciaColor(data.aderencia_percentual);
            const bgClass = getAderenciaBgColor(data.aderencia_percentual);
            return (
              <div key={dia} className={`rounded-lg sm:rounded-xl border p-2.5 sm:p-3 ${bgClass} hover-lift`}>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate" title={dia}>{dia.substring(0, 3)}</p>
                <p className={`mt-1 sm:mt-2 text-lg sm:text-xl lg:text-2xl font-bold ${colorClass}`}>{data.aderencia_percentual?.toFixed(1) || '0.0'}%</p>
                <div className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs">
                  <div className="flex justify-between gap-1">
                    <span className="text-slate-500 dark:text-slate-400">Plan:</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 truncate">{formatarHorasParaHMS(data.horas_a_entregar)}</span>
                  </div>
                  <div className="flex justify-between gap-1">
                    <span className="text-slate-500 dark:text-slate-400">Ent:</span>
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 truncate">{formatarHorasParaHMS(data.horas_entregues)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Aderência por Turno/Sub-Praça/Origem */}
      <div className="rounded-xl sm:rounded-2xl border border-blue-200 bg-white p-4 sm:p-6 shadow-lg dark:border-blue-800 dark:bg-slate-900">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl">📊</span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Aderência Detalhada</h3>
          </div>
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            <button
              onClick={() => setViewMode('turno')}
              className={`shrink-0 whitespace-nowrap rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all ${
                viewMode === 'turno'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:shadow-md dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              ⏰ Turno
            </button>
            <button
              onClick={() => setViewMode('sub_praca')}
              className={`shrink-0 whitespace-nowrap rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all ${
                viewMode === 'sub_praca'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:shadow-md dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              📍 Sub-Praça
            </button>
            <button
              onClick={() => setViewMode('origem')}
              className={`shrink-0 whitespace-nowrap rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all ${
                viewMode === 'origem'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:shadow-md dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              🎯 Origem
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
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

  const ViewToggleButton = React.memo(({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-200 whitespace-nowrap overflow-hidden ${
        active
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-md dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  ));
  
  ViewToggleButton.displayName = 'ViewToggleButton';

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                  <th className="px-6 py-4 text-center text-sm font-bold text-emerald-900 dark:text-emerald-100">% Aceitas</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-blue-900 dark:text-blue-100">Rejeitadas</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-rose-900 dark:text-rose-100">% Rejeite</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-blue-900 dark:text-blue-100">Completadas</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-purple-900 dark:text-purple-100">% Completos</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-blue-900 dark:text-blue-100">Aderência</th>
                </tr>
              </thead>
              <tbody>
                {aderenciaDia.map((dia, index) => {
                  const ofertadas = dia.corridas_ofertadas ?? 0;
                  const aceitas = dia.corridas_aceitas ?? 0;
                  const rejeitadas = dia.corridas_rejeitadas ?? 0;
                  const completadas = dia.corridas_completadas ?? 0;
                  
                  const percAceitas = ofertadas > 0 ? (aceitas / ofertadas) * 100 : 0;
                  const percRejeitadas = ofertadas > 0 ? (rejeitadas / ofertadas) * 100 : 0;
                  const percCompletas = aceitas > 0 ? (completadas / aceitas) * 100 : 0;
                  
                  return (
                  <tr
                    key={dia.dia_iso}
                    className={`border-b border-blue-100 transition-colors hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/20 ${
                      index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-blue-50/30 dark:bg-slate-800/30'
                    }`}
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{dia.dia_da_semana}</td>
                    <td className="px-6 py-4 text-center text-slate-700 dark:text-slate-300">{ofertadas}</td>
                    <td className="px-6 py-4 text-center text-emerald-700 dark:text-emerald-400">{aceitas}</td>
                    <td className="px-6 py-4 text-center font-semibold text-emerald-700 dark:text-emerald-400">
                      {percAceitas.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-center text-rose-700 dark:text-rose-400">{rejeitadas}</td>
                    <td className="px-6 py-4 text-center font-semibold text-rose-700 dark:text-rose-400">
                      {percRejeitadas.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-center text-purple-700 dark:text-purple-400">{completadas}</td>
                    <td className="px-6 py-4 text-center font-semibold text-purple-700 dark:text-purple-400">
                      {percCompletas.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-blue-900 dark:text-blue-100">
                      {(dia.aderencia_percentual ?? 0).toFixed(1)}%
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          ) : (
            <div className="p-6">
              <Line data={barDataDia} options={{
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
          <Line data={{
            labels: aderenciaTurno.map(t => t.periodo),
            datasets: [
              {
                label: 'Ofertadas',
                data: aderenciaTurno.map(t => t.corridas_ofertadas ?? 0),
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                borderColor: 'rgb(139, 92, 246)',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
              },
              {
                label: 'Aceitas',
                data: aderenciaTurno.map(t => t.corridas_aceitas ?? 0),
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
              },
              {
                label: 'Completadas',
                data: aderenciaTurno.map(t => t.corridas_completadas ?? 0),
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: 'rgb(99, 102, 241)',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
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
                  <th className="px-6 py-4 text-center text-sm font-bold text-emerald-900 dark:text-emerald-100">% Aceitas</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-purple-900 dark:text-purple-100">Rejeitadas</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-rose-900 dark:text-rose-100">% Rejeite</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-purple-900 dark:text-purple-100">Completadas</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-indigo-900 dark:text-indigo-100">% Completos</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-purple-900 dark:text-purple-100">Aderência</th>
                </tr>
              </thead>
              <tbody>
                {aderenciaTurno.map((turno, index) => {
                  const ofertadas = turno.corridas_ofertadas ?? 0;
                  const aceitas = turno.corridas_aceitas ?? 0;
                  const rejeitadas = turno.corridas_rejeitadas ?? 0;
                  const completadas = turno.corridas_completadas ?? 0;
                  
                  const percAceitas = ofertadas > 0 ? (aceitas / ofertadas) * 100 : 0;
                  const percRejeitadas = ofertadas > 0 ? (rejeitadas / ofertadas) * 100 : 0;
                  const percCompletas = aceitas > 0 ? (completadas / aceitas) * 100 : 0;
                  
                  return (
                  <tr
                    key={turno.periodo}
                    className={`border-b border-purple-100 transition-colors hover:bg-purple-50 dark:border-purple-900 dark:hover:bg-purple-950/20 ${
                      index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-purple-50/30 dark:bg-slate-800/30'
                    }`}
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{turno.periodo}</td>
                    <td className="px-6 py-4 text-center text-slate-700 dark:text-slate-300">{ofertadas}</td>
                    <td className="px-6 py-4 text-center text-emerald-700 dark:text-emerald-400">{aceitas}</td>
                    <td className="px-6 py-4 text-center font-semibold text-emerald-700 dark:text-emerald-400">
                      {percAceitas.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-center text-rose-700 dark:text-rose-400">{rejeitadas}</td>
                    <td className="px-6 py-4 text-center font-semibold text-rose-700 dark:text-rose-400">
                      {percRejeitadas.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-center text-indigo-700 dark:text-indigo-400">{completadas}</td>
                    <td className="px-6 py-4 text-center font-semibold text-indigo-700 dark:text-indigo-400">
                      {percCompletas.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-purple-900 dark:text-purple-100">
                      {(turno.aderencia_percentual ?? 0).toFixed(1)}%
                    </td>
                  </tr>
                  );
                })}
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
                    <th className="px-6 py-4 text-center text-sm font-bold text-teal-900 dark:text-teal-100">% Aceitas</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-emerald-900 dark:text-emerald-100">Rejeitadas</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-rose-900 dark:text-rose-100">% Rejeite</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-emerald-900 dark:text-emerald-100">Completadas</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-cyan-900 dark:text-cyan-100">% Completos</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-emerald-900 dark:text-emerald-100">Aderência</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewModeLocal === 'subpraca' ? aderenciaSubPraca : aderenciaOrigem).map((item, index) => {
                    const nome = viewModeLocal === 'subpraca' ? (item as any).sub_praca : (item as any).origem;
                    const ofertadas = item.corridas_ofertadas ?? 0;
                    const aceitas = item.corridas_aceitas ?? 0;
                    const rejeitadas = item.corridas_rejeitadas ?? 0;
                    const completadas = item.corridas_completadas ?? 0;
                    
                    const percAceitas = ofertadas > 0 ? (aceitas / ofertadas) * 100 : 0;
                    const percRejeitadas = ofertadas > 0 ? (rejeitadas / ofertadas) * 100 : 0;
                    const percCompletas = aceitas > 0 ? (completadas / aceitas) * 100 : 0;
                    
                    return (
                      <tr
                        key={nome}
                        className={`border-b border-emerald-100 transition-colors hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-950/20 ${
                          index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-emerald-50/30 dark:bg-slate-800/30'
                        }`}
                      >
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{nome}</td>
                        <td className="px-6 py-4 text-center text-slate-700 dark:text-slate-300">{ofertadas}</td>
                        <td className="px-6 py-4 text-center text-emerald-700 dark:text-emerald-400">{aceitas}</td>
                        <td className="px-6 py-4 text-center font-semibold text-teal-700 dark:text-teal-400">
                          {percAceitas.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 text-center text-rose-700 dark:text-rose-400">{rejeitadas}</td>
                        <td className="px-6 py-4 text-center font-semibold text-rose-700 dark:text-rose-400">
                          {percRejeitadas.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 text-center text-cyan-700 dark:text-cyan-400">{completadas}</td>
                        <td className="px-6 py-4 text-center font-semibold text-cyan-700 dark:text-cyan-400">
                          {percCompletas.toFixed(1)}%
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
              <Line data={{
                labels: (viewModeLocal === 'subpraca' ? aderenciaSubPraca : aderenciaOrigem).map(item => 
                  viewModeLocal === 'subpraca' ? (item as any).sub_praca : (item as any).origem
                ),
                datasets: [
                  {
                    label: 'Ofertadas',
                    data: (viewModeLocal === 'subpraca' ? aderenciaSubPraca : aderenciaOrigem).map(item => item.corridas_ofertadas ?? 0),
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                  },
                  {
                    label: 'Aceitas',
                    data: (viewModeLocal === 'subpraca' ? aderenciaSubPraca : aderenciaOrigem).map(item => item.corridas_aceitas ?? 0),
                    backgroundColor: 'rgba(20, 184, 166, 0.2)',
                    borderColor: 'rgb(20, 184, 166)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                  },
                  {
                    label: 'Completadas',
                    data: (viewModeLocal === 'subpraca' ? aderenciaSubPraca : aderenciaOrigem).map(item => item.corridas_completadas ?? 0),
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
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
  const [usuarios, setUsuarios] = useState<UsuarioOnline[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [atividades, setAtividades] = useState<any[]>([]);

  const fetchMonitoramento = async () => {
    try {
      // Buscar usuários online
      const { data, error } = await supabase.rpc('listar_usuarios_online');
      
      if (error) throw error;
      
      // Buscar atividades recentes (últimas 50)
      const { data: atividadesData, error: atividadesError } = await supabase
        .from('user_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!atividadesError && atividadesData) {
        setAtividades(atividadesData);
      }
      
      // Mapear os dados da API para o formato esperado
      const usuariosMapeados = (data || []).map((u: any) => {
        // Segundos de inatividade já vem como número do backend
        const segundosInativo = u.seconds_inactive || 0;
        
        // Extrair praças dos filtros
        const filtros = u.filters_applied || {};
        const pracas = filtros.p_praca ? [filtros.p_praca] : (filtros.praca ? [filtros.praca] : []);
        
        // A descrição detalhada já vem do backend (action_details)
        const descricaoAcao = u.action_details || u.last_action_type || 'Atividade desconhecida';
        
        // Contar ações da última hora
        const umaHoraAtras = new Date();
        umaHoraAtras.setHours(umaHoraAtras.getHours() - 1);
        const acoesUltimaHora = atividadesData?.filter((a: any) => 
          a.user_id === u.user_id && new Date(a.created_at) > umaHoraAtras
        ).length || 0;
        
        return {
          user_id: u.user_id,
          nome: u.user_name || u.user_email?.split('@')[0] || 'Usuário',
          email: u.user_email,
          aba_atual: u.current_tab,
          pracas: pracas,
          ultima_acao: descricaoAcao,
          segundos_inativo: Math.floor(segundosInativo),
          acoes_ultima_hora: acoesUltimaHora,
          is_active: u.is_active
        };
      });
      
      setUsuarios(usuariosMapeados);
    } catch (err) {
      console.error('Erro ao buscar monitoramento:', err);
      setUsuarios([]);
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

  const formatarTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const agora = new Date();
    const diff = Math.floor((agora.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s atrás`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return date.toLocaleDateString('pt-BR');
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

  // Calcular estatísticas
  const usuariosAtivos = usuarios.filter(u => u.segundos_inativo < 60).length;
  const usuariosInativos = usuarios.length - usuariosAtivos;
  const totalAcoes = usuarios.reduce((sum, u) => sum + u.acoes_ultima_hora, 0);
  
  // Filtrar usuários
  const usuariosFiltrados = usuarios.filter(u => {
    if (filtroStatus === 'ativos') return u.segundos_inativo < 60;
    if (filtroStatus === 'inativos') return u.segundos_inativo >= 60;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl dark:border-indigo-900 dark:from-indigo-950/30 dark:to-purple-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl text-white shadow-md">
              👥
            </div>
            <div>
              <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Total Online</p>
              <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{usuarios.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl dark:border-emerald-900 dark:from-emerald-950/30 dark:to-teal-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl text-white shadow-md">
              ✅
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Ativos</p>
              <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{usuariosAtivos}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl dark:border-amber-900 dark:from-amber-950/30 dark:to-orange-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-2xl text-white shadow-md">
              ⏸️
            </div>
            <div>
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Inativos</p>
              <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">{usuariosInativos}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl dark:border-purple-900 dark:from-purple-950/30 dark:to-pink-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-2xl text-white shadow-md">
              ⚡
            </div>
            <div>
              <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Ações (1h)</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{totalAcoes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroStatus('todos')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                filtroStatus === 'todos'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              Todos ({usuarios.length})
            </button>
            <button
              onClick={() => setFiltroStatus('ativos')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                filtroStatus === 'ativos'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              Ativos ({usuariosAtivos})
            </button>
            <button
              onClick={() => setFiltroStatus('inativos')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                filtroStatus === 'inativos'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              Inativos ({usuariosInativos})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <span>Auto-atualizar (10s)</span>
            </label>
            <button
              onClick={fetchMonitoramento}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-700 hover:scale-105 active:scale-95"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Lista de Usuários Online */}
        <div className="lg:col-span-2">
          {usuariosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {usuariosFiltrados.map((usuario) => (
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
              <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                Nenhum usuário {filtroStatus !== 'todos' ? filtroStatus : 'online'}
              </p>
            </div>
          )}
        </div>

        {/* Timeline de Atividades Recentes */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 p-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                <span>📜</span>
                Atividades Recentes
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Últimas {atividades.length} ações
              </p>
            </div>
            
            <div className="max-h-[600px] space-y-2 overflow-auto p-4">
              {atividades.length > 0 ? (
                atividades.map((ativ, idx) => (
                  <div
                    key={`${ativ.user_id}-${ativ.created_at}-${idx}`}
                    className="group rounded-lg border border-slate-100 bg-slate-50 p-3 transition-all hover:border-indigo-200 hover:bg-indigo-50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30"
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500"></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                          {ativ.action_type === 'tab_change' && `Mudou para aba: ${ativ.filters_applied?.aba || 'desconhecida'}`}
                          {ativ.action_type === 'filter_change' && 'Alterou filtros'}
                          {ativ.action_type === 'login' && 'Fez login'}
                          {ativ.action_type === 'heartbeat' && 'Ativo no sistema'}
                          {ativ.action_type === 'page_visibility' && (ativ.details?.visible ? 'Voltou para a aba' : 'Saiu da aba')}
                          {!['tab_change', 'filter_change', 'login', 'heartbeat', 'page_visibility'].includes(ativ.action_type) && (ativ.action_details || ativ.action_type)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                          {formatarTimestamp(ativ.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Nenhuma atividade registrada
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
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
  semanas: string[];
  pracas: FilterOption[];
  subPracas: FilterOption[];
  origens: FilterOption[];
  currentUser: { is_admin: boolean; assigned_pracas: string[] } | null;
}) {
  const [semanasSelecionadas, setSemanasSelecionadas] = useState<string[]>([]);
  const [pracaSelecionada, setPracaSelecionada] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dadosComparacao, setDadosComparacao] = useState<DashboardResumoData[]>([]);
  const [utrComparacao, setUtrComparacao] = useState<any[]>([]);
  const [todasSemanas, setTodasSemanas] = useState<number[]>([]);
  
  // Estados para controlar visualização (tabela/gráfico)
  const [viewModeDetalhada, setViewModeDetalhada] = useState<'table' | 'chart'>('table');
  const [viewModeDia, setViewModeDia] = useState<'table' | 'chart'>('table');
  const [viewModeTurno, setViewModeTurno] = useState<'table' | 'chart'>('table');
  const [viewModeSubPraca, setViewModeSubPraca] = useState<'table' | 'chart'>('table');
  const [viewModeOrigem, setViewModeOrigem] = useState<'table' | 'chart'>('table');

  // Componente para alternar visualização
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
      const semanaStr = String(semana);
      if (prev.includes(semanaStr)) {
        return prev.filter(s => s !== semanaStr);
      } else {
        return [...prev, semanaStr].sort((a, b) => {
          const numA = typeof a === 'string' ? parseInt(a, 10) : a;
          const numB = typeof b === 'string' ? parseInt(b, 10) : b;
          return numA - numB;
        });
      }
    });
  };

  const compararSemanas = async () => {
    if (semanasSelecionadas.length < 2) return;

    setLoading(true);
    try {
      // Buscar dados para cada semana selecionada
      const promessasDados = semanasSelecionadas.map(async (semana) => {
        // Converter string para número
        const semanaNumero = typeof semana === 'string' 
          ? (semana.includes('W') 
              ? parseInt(semana.match(/W(\d+)/)?.[1] || '0', 10)
              : parseInt(semana, 10))
          : semana;
        const filtro: any = { p_semana: semanaNumero };
        
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
        // Converter string para número
        const semanaNumero = typeof semana === 'string' 
          ? (semana.includes('W') 
              ? parseInt(semana.match(/W(\d+)/)?.[1] || '0', 10)
              : parseInt(semana, 10))
          : semana;
        const filtro: any = { p_semana: semanaNumero };
        
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
      console.log('🎯 UTR Comparação RAW:', resultadosUtr);
      console.log('🎯 UTR Estrutura:', resultadosUtr.map(r => ({
        semana: r.semana,
        utr: r.utr,
        tipo: typeof r.utr,
        keys: r.utr ? Object.keys(r.utr) : []
      })));
      
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
                  semanasSelecionadas.includes(String(semana))
                    ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={semanasSelecionadas.includes(String(semana))}
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
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                  <span className="text-xl">📊</span>
                  Comparação Detalhada de Métricas
                </h3>
                <div className="flex gap-2">
                  <ViewToggleButton
                    active={viewModeDetalhada === 'table'}
                    onClick={() => setViewModeDetalhada('table')}
                    label="📋 Tabela"
                  />
                  <ViewToggleButton
                    active={viewModeDetalhada === 'chart'}
                    onClick={() => setViewModeDetalhada('chart')}
                    label="📊 Gráfico"
                  />
                </div>
              </div>
            </div>
            {viewModeDetalhada === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Métrica</th>
                    {semanasSelecionadas.map((semana, idx) => (
                      <React.Fragment key={semana}>
                        <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-l-2 border-slate-300 dark:border-slate-600">
                          Semana {semana}
                        </th>
                        {idx > 0 && (
                          <th className="px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30">
                            Δ% vs S{semanasSelecionadas[idx - 1]}
                          </th>
                        )}
                      </React.Fragment>
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
                    {dadosComparacao.map((dados, idx) => {
                      const aderencia = dados.semanal[0]?.aderencia_percentual ?? 0;
                      let variacao = null;
                      if (idx > 0) {
                        const aderenciaAnterior = dadosComparacao[idx - 1].semanal[0]?.aderencia_percentual ?? 0;
                        variacao = aderenciaAnterior > 0 ? ((aderencia - aderenciaAnterior) / aderenciaAnterior) * 100 : 0;
                      }
                      
                      return (
                        <React.Fragment key={idx}>
                          <td className="px-6 py-4 text-center border-l-2 border-slate-300 dark:border-slate-600">
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-lg font-bold text-blue-900 dark:bg-blue-900/30 dark:text-blue-100">
                              {aderencia.toFixed(1)}%
                            </span>
                          </td>
                          {idx > 0 && variacao !== null && (
                            <td className="px-4 py-4 text-center bg-blue-50/30 dark:bg-blue-950/20">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${
                                variacao >= 0 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                              }`}>
                                {variacao >= 0 ? '↗' : '↘'} {Math.abs(variacao).toFixed(1)}%
                              </span>
                            </td>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tr>
                  
                  {/* Corridas Ofertadas */}
                  <tr className="bg-white dark:bg-slate-900">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📢</span>
                        Corridas Ofertadas
                      </div>
                    </td>
                    {dadosComparacao.map((dados, idx) => {
                      const ofertadas = dados.totais?.corridas_ofertadas ?? 0;
                      let variacao = null;
                      if (idx > 0) {
                        const ofertadasAnterior = dadosComparacao[idx - 1].totais?.corridas_ofertadas ?? 0;
                        variacao = ofertadasAnterior > 0 ? ((ofertadas - ofertadasAnterior) / ofertadasAnterior) * 100 : 0;
                      }
                      
                      return (
                        <React.Fragment key={idx}>
                          <td className="px-6 py-4 text-center text-base font-semibold text-slate-700 dark:text-slate-300 border-l-2 border-slate-300 dark:border-slate-600">
                            {ofertadas.toLocaleString('pt-BR')}
                          </td>
                          {idx > 0 && variacao !== null && (
                            <td className="px-4 py-4 text-center bg-slate-50/30 dark:bg-slate-900/50">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${
                                variacao >= 0 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                              }`}>
                                {variacao >= 0 ? '↗' : '↘'} {Math.abs(variacao).toFixed(1)}%
                              </span>
                            </td>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tr>
                  
                  {/* Corridas Aceitas */}
                  <tr className="bg-emerald-50/50 dark:bg-emerald-950/20">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">✅</span>
                        Corridas Aceitas
                      </div>
                    </td>
                    {dadosComparacao.map((dados, idx) => {
                      const aceitas = dados.totais?.corridas_aceitas ?? 0;
                      let variacao = null;
                      if (idx > 0) {
                        const aceitasAnterior = dadosComparacao[idx - 1].totais?.corridas_aceitas ?? 0;
                        variacao = aceitasAnterior > 0 ? ((aceitas - aceitasAnterior) / aceitasAnterior) * 100 : 0;
                      }
                      
                      return (
                        <React.Fragment key={idx}>
                          <td className="px-6 py-4 text-center text-base font-semibold text-emerald-700 dark:text-emerald-400 border-l-2 border-slate-300 dark:border-slate-600">
                            {aceitas.toLocaleString('pt-BR')}
                          </td>
                          {idx > 0 && variacao !== null && (
                            <td className="px-4 py-4 text-center bg-emerald-50/30 dark:bg-emerald-950/20">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${
                                variacao >= 0 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                              }`}>
                                {variacao >= 0 ? '↗' : '↘'} {Math.abs(variacao).toFixed(1)}%
                              </span>
                            </td>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tr>
                  
                  {/* Corridas Rejeitadas */}
                  <tr className="bg-white dark:bg-slate-900">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">❌</span>
                        Corridas Rejeitadas
                      </div>
                    </td>
                    {dadosComparacao.map((dados, idx) => {
                      const rejeitadas = dados.totais?.corridas_rejeitadas ?? 0;
                      let variacao = null;
                      if (idx > 0) {
                        const rejeitadasAnterior = dadosComparacao[idx - 1].totais?.corridas_rejeitadas ?? 0;
                        variacao = rejeitadasAnterior > 0 ? ((rejeitadas - rejeitadasAnterior) / rejeitadasAnterior) * 100 : 0;
                      }
                      
                      return (
                        <React.Fragment key={idx}>
                          <td className="px-6 py-4 text-center text-base font-semibold text-rose-700 dark:text-rose-400 border-l-2 border-slate-300 dark:border-slate-600">
                            {rejeitadas.toLocaleString('pt-BR')}
                          </td>
                          {idx > 0 && variacao !== null && (
                            <td className="px-4 py-4 text-center bg-slate-50/30 dark:bg-slate-900/50">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${
                                variacao >= 0 
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                              }`}>
                                {variacao >= 0 ? '↗' : '↘'} {Math.abs(variacao).toFixed(1)}%
                              </span>
                            </td>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tr>
                  
                  {/* Corridas Completadas */}
                  <tr className="bg-purple-50/50 dark:bg-purple-950/20">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎯</span>
                        Corridas Completadas
                      </div>
                    </td>
                    {dadosComparacao.map((dados, idx) => {
                      const completadas = dados.totais?.corridas_completadas ?? 0;
                      let variacao = null;
                      if (idx > 0) {
                        const completadasAnterior = dadosComparacao[idx - 1].totais?.corridas_completadas ?? 0;
                        variacao = completadasAnterior > 0 ? ((completadas - completadasAnterior) / completadasAnterior) * 100 : 0;
                      }
                      
                      return (
                        <React.Fragment key={idx}>
                          <td className="px-6 py-4 text-center text-base font-semibold text-purple-700 dark:text-purple-400 border-l-2 border-slate-300 dark:border-slate-600">
                            {completadas.toLocaleString('pt-BR')}
                          </td>
                          {idx > 0 && variacao !== null && (
                            <td className="px-4 py-4 text-center bg-purple-50/30 dark:bg-purple-950/20">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${
                                variacao >= 0 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                              }`}>
                                {variacao >= 0 ? '↗' : '↘'} {Math.abs(variacao).toFixed(1)}%
                              </span>
                            </td>
                          )}
                        </React.Fragment>
                      );
                    })}
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
                        <React.Fragment key={idx}>
                          <td className="px-6 py-4 text-center text-base font-semibold text-slate-700 dark:text-slate-300 border-l-2 border-slate-300 dark:border-slate-600">
                            {taxaAceitacao.toFixed(1)}%
                          </td>
                          {idx > 0 && <td className="px-4 py-4 bg-slate-50/30 dark:bg-slate-900/50"></td>}
                        </React.Fragment>
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
                      <React.Fragment key={idx}>
                        <td className="px-6 py-4 text-center font-mono text-base font-semibold text-amber-700 dark:text-amber-400 border-l-2 border-slate-300 dark:border-slate-600">
                          {formatarHorasParaHMS(dados.semanal[0]?.horas_a_entregar ?? '0')}
                        </td>
                        {idx > 0 && <td className="px-4 py-4 bg-amber-50/30 dark:bg-amber-950/20"></td>}
                      </React.Fragment>
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
                      <React.Fragment key={idx}>
                        <td className="px-6 py-4 text-center font-mono text-base font-semibold text-blue-700 dark:text-blue-400 border-l-2 border-slate-300 dark:border-slate-600">
                          {formatarHorasParaHMS(dados.semanal[0]?.horas_entregues ?? '0')}
                        </td>
                        {idx > 0 && <td className="px-4 py-4 bg-slate-50/30 dark:bg-slate-900/50"></td>}
                      </React.Fragment>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            ) : (
              <div className="p-6">
                <Bar data={{
                  labels: semanasSelecionadas.map(s => `Semana ${s}`),
                  datasets: [
                    {
                      type: 'bar' as const,
                      label: 'Ofertadas',
                      data: dadosComparacao.map(d => d.totais?.corridas_ofertadas ?? 0),
                      backgroundColor: 'rgba(100, 116, 139, 0.7)',
                      borderColor: 'rgb(100, 116, 139)',
                      borderWidth: 1,
                      yAxisID: 'y-count',
                      order: 2,
                    },
                    {
                      type: 'bar' as const,
                      label: 'Aceitas',
                      data: dadosComparacao.map(d => d.totais?.corridas_aceitas ?? 0),
                      backgroundColor: 'rgba(16, 185, 129, 0.7)',
                      borderColor: 'rgb(16, 185, 129)',
                      borderWidth: 1,
                      yAxisID: 'y-count',
                      order: 2,
                    },
                    {
                      type: 'bar' as const,
                      label: 'Completadas',
                      data: dadosComparacao.map(d => d.totais?.corridas_completadas ?? 0),
                      backgroundColor: 'rgba(139, 92, 246, 0.7)',
                      borderColor: 'rgb(139, 92, 246)',
                      borderWidth: 1,
                      yAxisID: 'y-count',
                      order: 2,
                    },
                    {
                      type: 'line' as any,
                      label: 'Aderência (%)',
                      data: dadosComparacao.map(d => d.semanal[0]?.aderencia_percentual ?? 0),
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      borderColor: 'rgb(59, 130, 246)',
                      borderWidth: 3,
                      tension: 0.4,
                      pointRadius: 6,
                      pointHoverRadius: 8,
                      pointBackgroundColor: 'rgb(59, 130, 246)',
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2,
                      yAxisID: 'y-percent',
                      order: 1,
                    },
                  ] as any,
                }} options={{
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
                        font: { size: 13, weight: 'bold' as const },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      padding: 15,
                      titleFont: { size: 15, weight: 'bold' as const },
                      bodyFont: { size: 14 },
                      bodySpacing: 8,
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderWidth: 1,
                      callbacks: {
                        label: (context: any) => {
                          const label = context.dataset.label || '';
                          const value = context.parsed.y;
                          
                          if (label === 'Aderência (%)') {
                            return `  ${label}: ${value.toFixed(1)}%`;
                          }
                          return `  ${label}: ${value.toLocaleString('pt-BR')} corridas`;
                        }
                      }
                    }
                  },
                  scales: {
                    'y-count': {
                      type: 'linear' as const,
                      position: 'left' as const,
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Quantidade de Corridas',
                        font: { size: 13, weight: 'bold' as const },
                        color: 'rgb(100, 116, 139)',
                      },
                      ticks: {
                        callback: (value: any) => value.toLocaleString('pt-BR'),
                        font: { size: 12 },
                        color: 'rgb(100, 116, 139)',
                      },
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                      }
                    },
                    'y-percent': {
                      type: 'linear' as const,
                      position: 'right' as const,
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Aderência (%)',
                        font: { size: 13, weight: 'bold' as const },
                        color: 'rgb(59, 130, 246)',
                      },
                      ticks: {
                        callback: (value: any) => `${value}%`,
                        font: { size: 12 },
                        color: 'rgb(59, 130, 246)',
                      },
                      grid: {
                        display: false,
                      }
                    },
                    x: {
                      ticks: {
                        font: { size: 12, weight: 'bold' as const },
                      },
                      grid: {
                        display: false,
                      }
                    }
                  }
                }} />
              </div>
            )}
          </div>

          {/* Comparação de Corridas por Dia */}
          <div className="rounded-xl border border-blue-200 bg-white shadow-lg dark:border-blue-800 dark:bg-slate-900">
            <div className="border-b border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 dark:border-blue-800 dark:from-blue-950/30 dark:to-cyan-950/30">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                <span className="text-xl">📊</span>
                Comparação de Corridas por Dia da Semana
              </h3>
            </div>
            <div className="overflow-x-auto p-6">
              <table className="w-full">
                <thead className="bg-blue-50 dark:bg-blue-950/30">
                  <tr className="border-b border-blue-200 dark:border-blue-700">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-100">Dia</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-100">Métrica</th>
                    {semanasSelecionadas.map((semana, idx) => (
                      <th key={semana} colSpan={idx === 0 ? 1 : 2} className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-100">
                        Semana {semana} {idx > 0 && '(Δ%)'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100 dark:divide-blue-900">
                  {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia, diaIdx) => {
                    const metricas = [
                      { label: 'Ofertadas', key: 'corridas_ofertadas', color: 'text-slate-700 dark:text-slate-300' },
                      { label: 'Aceitas', key: 'corridas_aceitas', color: 'text-emerald-700 dark:text-emerald-400' },
                      { label: 'Rejeitadas', key: 'corridas_rejeitadas', color: 'text-rose-700 dark:text-rose-400' },
                      { label: 'Completadas', key: 'corridas_completadas', color: 'text-blue-700 dark:text-blue-400' },
                    ];
                    
                    return metricas.map((metrica, metricaIdx) => (
                      <tr key={`${dia}-${metrica.key}`} className={diaIdx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-blue-50/30 dark:bg-blue-950/20'}>
                        {metricaIdx === 0 && (
                          <td rowSpan={4} className="px-4 py-3 font-bold text-slate-900 dark:text-white border-r border-blue-200 dark:border-blue-800">
                            {dia}
                          </td>
                        )}
                        <td className={`px-4 py-2 text-sm font-semibold ${metrica.color}`}>{metrica.label}</td>
                        {dadosComparacao.map((dados, idx) => {
                          const diaData = dados.dia?.find(d => d.dia_da_semana === dia);
                          const valor = diaData?.[metrica.key as keyof typeof diaData] as number ?? 0;
                          
                          // Calcular variação se não for a primeira semana
                          let variacao = null;
                          if (idx > 0) {
                            const dadosAnterior = dadosComparacao[idx - 1];
                            const diaDataAnterior = dadosAnterior.dia?.find(d => d.dia_da_semana === dia);
                            const valorAnterior = diaDataAnterior?.[metrica.key as keyof typeof diaDataAnterior] as number ?? 0;
                            variacao = valorAnterior > 0 ? ((valor - valorAnterior) / valorAnterior) * 100 : 0;
                          }
                          
                          return (
                            <>
                              <td key={`${idx}-valor`} className={`px-4 py-2 text-center font-semibold ${metrica.color}`}>
                                {typeof valor === 'number' ? valor.toLocaleString('pt-BR') : '0'}
                              </td>
                              {idx > 0 && variacao !== null && (
                                <td key={`${idx}-var`} className="px-4 py-2 text-center text-xs font-bold">
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
                                    variacao >= 0 
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                                  }`}>
                                    {variacao >= 0 ? '↗' : '↘'} {Math.abs(variacao).toFixed(1)}%
                                  </span>
                                </td>
                              )}
                            </>
                          );
                        })}
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comparação de Aderência por Dia da Semana */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 px-6 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-indigo-950/30">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                  <span className="text-xl">📅</span>
                  Comparação de Aderência por Dia da Semana
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
            <div className="overflow-x-auto p-6">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Dia</th>
                    {semanasSelecionadas.map((semana, idx) => (
                      <th key={semana} colSpan={idx === 0 ? 1 : 2} className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Semana {semana} {idx > 0 && '(Δ%)'}
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
                        const aderencia = diaData?.aderencia_percentual ?? 0;
                        
                        // Calcular variação se não for a primeira semana
                        let variacao = null;
                        if (idx > 0) {
                          const dadosAnterior = dadosComparacao[idx - 1];
                          const diaDataAnterior = dadosAnterior.dia?.find(d => d.dia_da_semana === dia);
                          const aderenciaAnterior = diaDataAnterior?.aderencia_percentual ?? 0;
                          variacao = aderenciaAnterior > 0 ? ((aderencia - aderenciaAnterior) / aderenciaAnterior) * 100 : 0;
                        }
                        
                        return (
                          <>
                            <td key={`${idx}-valor`} className="px-6 py-4 text-center">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {aderencia.toFixed(1)}%
                              </span>
                            </td>
                            {idx > 0 && variacao !== null && (
                              <td key={`${idx}-var`} className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                                  variacao >= 0 
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                                }`}>
                                  {variacao >= 0 ? '↗' : '↘'} {Math.abs(variacao).toFixed(1)}%
                                </span>
                              </td>
                            )}
                          </>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            ) : (
              <div className="p-6">
                <Line data={{
                  labels: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'],
                  datasets: semanasSelecionadas.map((semana, idx) => {
                    const cores = [
                      { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgb(59, 130, 246)' },
                      { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgb(16, 185, 129)' },
                      { bg: 'rgba(139, 92, 246, 0.2)', border: 'rgb(139, 92, 246)' },
                      { bg: 'rgba(251, 146, 60, 0.2)', border: 'rgb(251, 146, 60)' },
                      { bg: 'rgba(236, 72, 153, 0.2)', border: 'rgb(236, 72, 153)' },
                    ];
                    const cor = cores[idx % cores.length];
                    
                    return {
                      label: `Semana ${semana}`,
                      data: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(dia => {
                        const dados = dadosComparacao[idx];
                        const diaData = dados?.dia?.find(d => d.dia_da_semana === dia);
                        return diaData?.aderencia_percentual ?? 0;
                      }),
                      backgroundColor: cor.bg,
                      borderColor: cor.border,
                      borderWidth: 2,
                      tension: 0.4,
                      pointRadius: 5,
                      pointHoverRadius: 7,
                    };
                  }),
                }} options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: { position: 'top' as const },
                    tooltip: {
                      callbacks: {
                        label: (context: any) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`
                      }
                    }
                  },
                  scales: {
                    y: { beginAtZero: true, ticks: { callback: (value: any) => `${value}%` } },
                    x: { ticks: { font: { size: 11 } } }
                  }
                }} />
              </div>
            )}
          </div>

          {/* Comparação por Turno */}
          {dadosComparacao.some(d => d.turno && d.turno.length > 0) && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-violet-50 px-6 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-violet-950/30">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                    <span className="text-xl">🕐</span>
                    Comparação por Turno
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
              {viewModeTurno === 'table' ? (
              <div className="overflow-x-auto p-6">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Turno</th>
                      {semanasSelecionadas.map((semana, idx) => (
                        <th key={semana} colSpan={idx === 0 ? 1 : 2} className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Semana {semana} {idx > 0 && '(Δ%)'}
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
                          const aderencia = turnoData?.aderencia_percentual ?? 0;
                          
                          // Calcular variação se não for a primeira semana
                          let variacao = null;
                          if (idx > 0) {
                            const dadosAnterior = dadosComparacao[idx - 1];
                            const turnoDataAnterior = dadosAnterior.turno?.find(t => t.periodo === turno);
                            const aderenciaAnterior = turnoDataAnterior?.aderencia_percentual ?? 0;
                            variacao = aderenciaAnterior > 0 ? ((aderencia - aderenciaAnterior) / aderenciaAnterior) * 100 : 0;
                          }
                          
                          return (
                            <>
                              <td key={`${idx}-valor`} className="px-6 py-4 text-center">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {aderencia.toFixed(1)}%
                                </span>
                              </td>
                              {idx > 0 && variacao !== null && (
                                <td key={`${idx}-var`} className="px-6 py-4 text-center">
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                                    variacao >= 0 
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                                  }`}>
                                    {variacao >= 0 ? '↗' : '↘'} {Math.abs(variacao).toFixed(1)}%
                                  </span>
                                </td>
                              )}
                            </>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              ) : (
                <div className="p-6">
                  <Line data={{
                    labels: Array.from(new Set(dadosComparacao.flatMap(d => d.turno?.map(t => t.periodo) ?? []))),
                    datasets: semanasSelecionadas.map((semana, idx) => {
                      const cores = [
                        { bg: 'rgba(139, 92, 246, 0.2)', border: 'rgb(139, 92, 246)' },
                        { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgb(16, 185, 129)' },
                        { bg: 'rgba(251, 146, 60, 0.2)', border: 'rgb(251, 146, 60)' },
                        { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgb(59, 130, 246)' },
                        { bg: 'rgba(236, 72, 153, 0.2)', border: 'rgb(236, 72, 153)' },
                      ];
                      const cor = cores[idx % cores.length];
                      const turnos = Array.from(new Set(dadosComparacao.flatMap(d => d.turno?.map(t => t.periodo) ?? [])));
                      
                      return {
                        label: `Semana ${semana}`,
                        data: turnos.map(turno => {
                          const dados = dadosComparacao[idx];
                          const turnoData = dados?.turno?.find(t => t.periodo === turno);
                          return turnoData?.aderencia_percentual ?? 0;
                        }),
                        backgroundColor: cor.bg,
                        borderColor: cor.border,
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                      };
                    }),
                  }} options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: { position: 'top' as const },
                      tooltip: {
                        callbacks: {
                          label: (context: any) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`
                        }
                      }
                    },
                    scales: {
                      y: { beginAtZero: true, ticks: { callback: (value: any) => `${value}%` } },
                      x: { ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 45 } }
                    }
                  }} />
                </div>
              )}
            </div>
          )}

          {/* Comparação Detalhada de Métricas por Sub-Praça */}
          {dadosComparacao.some(d => d.sub_praca && d.sub_praca.length > 0) && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-purple-50 px-6 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-purple-950/30">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                    <span className="text-xl">📍</span>
                    Comparação Detalhada de Métricas por Sub-Praça
                  </h3>
                  <div className="flex gap-2">
                    <ViewToggleButton
                      active={viewModeSubPraca === 'table'}
                      onClick={() => setViewModeSubPraca('table')}
                      label="📋 Tabela"
                    />
                    <ViewToggleButton
                      active={viewModeSubPraca === 'chart'}
                      onClick={() => setViewModeSubPraca('chart')}
                      label="📊 Gráfico"
                    />
                  </div>
                </div>
              </div>
              {viewModeSubPraca === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Sub-Praça / Métrica</th>
                      {semanasSelecionadas.map((semana, idx) => (
                        <React.Fragment key={semana}>
                          <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-l-2 border-slate-300 dark:border-slate-600">
                            Semana {semana}
                          </th>
                          {idx > 0 && (
                            <th className="px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30">
                              Δ% vs S{semanasSelecionadas[idx - 1]}
                            </th>
                          )}
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {Array.from(new Set(dadosComparacao.flatMap(d => d.sub_praca?.map(sp => sp.sub_praca) ?? []))).map((subPraca, subPracaIdx) => (
                      <React.Fragment key={subPraca}>
                        {/* Cabeçalho da Sub-Praça */}
                        <tr className="bg-purple-100 dark:bg-purple-950/40">
                          <td colSpan={semanasSelecionadas.length * 2} className="px-6 py-3 font-bold text-purple-900 dark:text-purple-100">
                            📍 {subPraca}
                          </td>
                        </tr>
                        
                        {/* Aderência */}
                        <tr className="bg-blue-50/50 dark:bg-blue-950/20">
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">📈</span>
                              Aderência
                            </div>
                          </td>
                          {dadosComparacao.map((dados, idx) => {
                            const subPracaData = dados.sub_praca?.find(sp => sp.sub_praca === subPraca);
                            const aderencia = subPracaData?.aderencia_percentual ?? 0;
                            let variacao = null;
                            if (idx > 0) {
                              const dadosAnterior = dadosComparacao[idx - 1];
                              const subPracaDataAnterior = dadosAnterior.sub_praca?.find(sp => sp.sub_praca === subPraca);
                              const aderenciaAnterior = subPracaDataAnterior?.aderencia_percentual ?? 0;
                              variacao = aderenciaAnterior > 0 ? ((aderencia - aderenciaAnterior) / aderenciaAnterior) * 100 : 0;
                            }
                            
                            return (
                              <React.Fragment key={idx}>
                                <td className="px-6 py-4 text-center border-l-2 border-slate-300 dark:border-slate-600">
                                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-lg font-bold text-blue-900 dark:bg-blue-900/30 dark:text-blue-100">
                                    {aderencia.toFixed(1)}%
                                  </span>
                                </td>
                                {idx > 0 && variacao !== null && (
                                  <td className="px-4 py-4 text-center bg-blue-50/30 dark:bg-blue-950/20">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${
                                      variacao >= 0 
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                                    }`}>
                                      {variacao >= 0 ? '↗' : '↘'} {Math.abs(variacao).toFixed(1)}%
                                    </span>
                                  </td>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tr>

                        {/* Corridas Ofertadas */}
                        <tr className="bg-white dark:bg-slate-900">
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">📢</span>
                              Corridas Ofertadas
                            </div>
                          </td>
                          {dadosComparacao.map((dados, idx) => {
                            const subPracaData = dados.sub_praca?.find(sp => sp.sub_praca === subPraca);
                            const ofertadas = subPracaData?.corridas_ofertadas ?? 0;
                            let variacao = null;
                            if (idx > 0) {
                              const dadosAnterior = dadosComparacao[idx - 1];
                              const subPracaDataAnterior = dadosAnterior.sub_praca?.find(sp => sp.sub_praca === subPraca);
                              const ofertadasAnterior = subPracaDataAnterior?.corridas_ofertadas ?? 0;
                              variacao = ofertadasAnterior > 0 ? ((ofertadas - ofertadasAnterior) / ofertadasAnterior) * 100 : 0;
                            }
                            
                            return (
                              <React.Fragment key={idx}>
                                <td className="px-6 py-4 text-center text-base font-semibold text-slate-700 dark:text-slate-300 border-l-2 border-slate-300 dark:border-slate-600">
                                  {ofertadas.toLocaleString('pt-BR')}
                                </td>
                                {idx > 0 && variacao !== null && (
                                  <td className="px-4 py-4 text-center bg-slate-50/30 dark:bg-slate-900/50">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${
                                      variacao >= 0 
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                                    }`}>
                                      {variacao >= 0 ? '↗' : '↘'} {Math.abs(variacao).toFixed(1)}%
                                    </span>
                                  </td>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tr>

                        {/* Corridas Aceitas */}
                        <tr className="bg-emerald-50/50 dark:bg-emerald-950/20">
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">✅</span>
                              Corridas Aceitas
                            </div>
                          </td>
                          {dadosComparacao.map((dados, idx) => {
                            const subPracaData = dados.sub_praca?.find(sp => sp.sub_praca === subPraca);
                            const aceitas = subPracaData?.corridas_aceitas ?? 0;
                            let variacao = null;
                            if (idx > 0) {
                              const dadosAnterior = dadosComparacao[idx - 1];
                              const subPracaDataAnterior = dadosAnterior.sub_praca?.find(sp => sp.sub_praca === subPraca);
                              const aceitasAnterior = subPracaDataAnterior?.corridas_aceitas ?? 0;
                              variacao = aceitasAnterior > 0 ? ((aceitas - aceitasAnterior) / aceitasAnterior) * 100 : 0;
                            }
                            
                            return (
                              <React.Fragment key={idx}>
                                <td className="px-6 py-4 text-center text-base font-semibold text-emerald-700 dark:text-emerald-400 border-l-2 border-slate-300 dark:border-slate-600">
                                  {aceitas.toLocaleString('pt-BR')}
                                </td>
                                {idx > 0 && variacao !== null && (
                                  <td className="px-4 py-4 text-center bg-emerald-50/30 dark:bg-emerald-950/20">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${
                                      variacao >= 0 
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                                    }`}>
                                      {variacao >= 0 ? '↗' : '↘'} {Math.abs(variacao).toFixed(1)}%
                                    </span>
                                  </td>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tr>

                        {/* Corridas Rejeitadas */}
                        <tr className="bg-white dark:bg-slate-900">
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">❌</span>
                              Corridas Rejeitadas
                            </div>
                          </td>
                          {dadosComparacao.map((dados, idx) => {
                            const subPracaData = dados.sub_praca?.find(sp => sp.sub_praca === subPraca);
                            const rejeitadas = subPracaData?.corridas_rejeitadas ?? 0;
                            let variacao = null;
                            if (idx > 0) {
                              const dadosAnterior = dadosComparacao[idx - 1];
                              const subPracaDataAnterior = dadosAnterior.sub_praca?.find(sp => sp.sub_praca === subPraca);
                              const rejeitadasAnterior = subPracaDataAnterior?.corridas_rejeitadas ?? 0;
                              variacao = rejeitadasAnterior > 0 ? ((rejeitadas - rejeitadasAnterior) / rejeitadasAnterior) * 100 : 0;
                            }
                            
                            return (
                              <React.Fragment key={idx}>
                                <td className="px-6 py-4 text-center text-base font-semibold text-rose-700 dark:text-rose-400 border-l-2 border-slate-300 dark:border-slate-600">
                                  {rejeitadas.toLocaleString('pt-BR')}
                                </td>
                                {idx > 0 && variacao !== null && (
                                  <td className="px-4 py-4 text-center bg-slate-50/30 dark:bg-slate-900/50">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${
                                      variacao >= 0 
                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                    }`}>
                                      {variacao >= 0 ? '↗' : '↘'} {Math.abs(variacao).toFixed(1)}%
                                    </span>
                                  </td>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tr>

                        {/* Corridas Completadas */}
                        <tr className="bg-purple-50/50 dark:bg-purple-950/20">
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🎯</span>
                              Corridas Completadas
                            </div>
                          </td>
                          {dadosComparacao.map((dados, idx) => {
                            const subPracaData = dados.sub_praca?.find(sp => sp.sub_praca === subPraca);
                            const completadas = subPracaData?.corridas_completadas ?? 0;
                            let variacao = null;
                            if (idx > 0) {
                              const dadosAnterior = dadosComparacao[idx - 1];
                              const subPracaDataAnterior = dadosAnterior.sub_praca?.find(sp => sp.sub_praca === subPraca);
                              const completadasAnterior = subPracaDataAnterior?.corridas_completadas ?? 0;
                              variacao = completadasAnterior > 0 ? ((completadas - completadasAnterior) / completadasAnterior) * 100 : 0;
                            }
                            
                            return (
                              <React.Fragment key={idx}>
                                <td className="px-6 py-4 text-center text-base font-semibold text-purple-700 dark:text-purple-400 border-l-2 border-slate-300 dark:border-slate-600">
                                  {completadas.toLocaleString('pt-BR')}
                                </td>
                                {idx > 0 && variacao !== null && (
                                  <td className="px-4 py-4 text-center bg-purple-50/30 dark:bg-purple-950/20">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${
                                      variacao >= 0 
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                                    }`}>
                                      {variacao >= 0 ? '↗' : '↘'} {Math.abs(variacao).toFixed(1)}%
                                    </span>
                                  </td>
                                )}
                              </React.Fragment>
                            );
                          })}
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
                            const subPracaData = dados.sub_praca?.find(sp => sp.sub_praca === subPraca);
                            const ofertadas = subPracaData?.corridas_ofertadas ?? 0;
                            const aceitas = subPracaData?.corridas_aceitas ?? 0;
                            const taxaAceitacao = ofertadas > 0 ? (aceitas / ofertadas) * 100 : 0;
                            
                            return (
                              <React.Fragment key={idx}>
                                <td className="px-6 py-4 text-center text-base font-semibold text-slate-700 dark:text-slate-300 border-l-2 border-slate-300 dark:border-slate-600">
                                  {taxaAceitacao.toFixed(1)}%
                                </td>
                                {idx > 0 && <td className="px-4 py-4 bg-slate-50/30 dark:bg-slate-900/50"></td>}
                              </React.Fragment>
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
                          {dadosComparacao.map((dados, idx) => {
                            const subPracaData = dados.sub_praca?.find(sp => sp.sub_praca === subPraca);
                            const horasPlanejadas = subPracaData?.horas_a_entregar ?? '0';
                            
                            return (
                              <React.Fragment key={idx}>
                                <td className="px-6 py-4 text-center font-mono text-base font-semibold text-amber-700 dark:text-amber-400 border-l-2 border-slate-300 dark:border-slate-600">
                                  {formatarHorasParaHMS(horasPlanejadas)}
                                </td>
                                {idx > 0 && <td className="px-4 py-4 bg-amber-50/30 dark:bg-amber-950/20"></td>}
                              </React.Fragment>
                            );
                          })}
                        </tr>

                        {/* Horas Entregues */}
                        <tr className="bg-white dark:bg-slate-900">
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">⏱️</span>
                              Horas Entregues
                            </div>
                          </td>
                          {dadosComparacao.map((dados, idx) => {
                            const subPracaData = dados.sub_praca?.find(sp => sp.sub_praca === subPraca);
                            const horasEntregues = subPracaData?.horas_entregues ?? '0';
                            
                            return (
                              <React.Fragment key={idx}>
                                <td className="px-6 py-4 text-center font-mono text-base font-semibold text-blue-700 dark:text-blue-400 border-l-2 border-slate-300 dark:border-slate-600">
                                  {formatarHorasParaHMS(horasEntregues)}
                                </td>
                                {idx > 0 && <td className="px-4 py-4 bg-slate-50/30 dark:bg-slate-900/50"></td>}
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              ) : (
                <div className="p-6">
                  <Line data={{
                    labels: Array.from(new Set(dadosComparacao.flatMap(d => d.sub_praca?.map(sp => sp.sub_praca) ?? []))),
                    datasets: semanasSelecionadas.map((semana, idx) => {
                      const cores = [
                        { bg: 'rgba(147, 51, 234, 0.2)', border: 'rgb(147, 51, 234)' },
                        { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgb(16, 185, 129)' },
                        { bg: 'rgba(251, 146, 60, 0.2)', border: 'rgb(251, 146, 60)' },
                        { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgb(59, 130, 246)' },
                        { bg: 'rgba(236, 72, 153, 0.2)', border: 'rgb(236, 72, 153)' },
                      ];
                      const cor = cores[idx % cores.length];
                      const subPracas = Array.from(new Set(dadosComparacao.flatMap(d => d.sub_praca?.map(sp => sp.sub_praca) ?? [])));
                      
                      return {
                        label: `Semana ${semana}`,
                        data: subPracas.map(subPraca => {
                          const dados = dadosComparacao[idx];
                          const subPracaData = dados?.sub_praca?.find(sp => sp.sub_praca === subPraca);
                          return subPracaData?.aderencia_percentual ?? 0;
                        }),
                        backgroundColor: cor.bg,
                        borderColor: cor.border,
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                      };
                    }),
                  }} options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: { position: 'top' as const },
                      tooltip: {
                        callbacks: {
                          label: (context: any) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`
                        }
                      }
                    },
                    scales: {
                      y: { beginAtZero: true, ticks: { callback: (value: any) => `${value}%` } },
                      x: { ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 45 } }
                    }
                  }} />
                </div>
              )}
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
                        // A estrutura retornada é { semana, utr: { geral: { utr: ... }, por_praca: [...], ... } }
                        let utrValue = 0;
                        
                        if (item.utr && typeof item.utr === 'object') {
                          // Tentar acessar utr.geral.utr (estrutura correta)
                          if (item.utr.geral && typeof item.utr.geral === 'object') {
                            utrValue = item.utr.geral.utr ?? 0;
                          }
                          // Fallback para outras estruturas possíveis
                          else if (item.utr.utr_geral !== undefined) {
                            utrValue = item.utr.utr_geral;
                          }
                          else if (item.utr.utr !== undefined) {
                            utrValue = item.utr.utr;
                          }
                        } else if (typeof item.utr === 'number') {
                          utrValue = item.utr;
                        }
                        
                        console.log(`📊 UTR Semana ${item.semana}:`, utrValue, 'Estrutura completa:', JSON.stringify(item.utr));
                        
                        return (
                          <td key={idx} className="px-6 py-4 text-center">
                            <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-lg font-bold text-purple-900 dark:bg-purple-900/30 dark:text-purple-100">
                              {typeof utrValue === 'number' ? utrValue.toFixed(2) : '0.00'}%
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
// View Evolução
// =================================================================================

function EvolucaoView({
  evolucaoMensal,
  evolucaoSemanal,
  loading,
  anoSelecionado,
  anosDisponiveis,
  onAnoChange,
}: {
  evolucaoMensal: EvolucaoMensal[];
  evolucaoSemanal: EvolucaoSemanal[];
  loading: boolean;
  anoSelecionado: number;
  anosDisponiveis: number[];
  onAnoChange: (ano: number) => void;
}) {
  const [viewMode, setViewMode] = useState<'mensal' | 'semanal'>('mensal');

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center animate-pulse-soft">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-lg font-semibold text-blue-700 dark:text-blue-200">Carregando evolução...</p>
        </div>
      </div>
    );
  }

  const dadosAtivos = viewMode === 'mensal' ? evolucaoMensal : evolucaoSemanal;

  // Função para converter segundos em horas decimais para o gráfico
  const segundosParaHoras = (segundos: number): number => {
    return segundos / 3600;
  };

  // Dados do gráfico
  const chartData = {
    labels: viewMode === 'mensal' 
      ? evolucaoMensal.map(d => d.mes_nome)
      : evolucaoSemanal.map(d => `S${d.semana}`),
    datasets: [
      {
        label: 'Corridas Completadas',
        data: dadosAtivos.map(d => d.total_corridas),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        yAxisID: 'y',
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 3,
        pointHoverBackgroundColor: 'rgb(37, 99, 235)',
        pointHoverBorderColor: '#fff',
        borderWidth: 3,
        fill: true,
      },
      {
        label: 'Horas Trabalhadas',
        data: dadosAtivos.map(d => segundosParaHoras(d.total_segundos)),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        yAxisID: 'y1',
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: '#fff',
        pointBorderWidth: 3,
        pointHoverBackgroundColor: 'rgb(22, 163, 74)',
        pointHoverBorderColor: '#fff',
        borderWidth: 3,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 15,
            weight: 'bold' as const,
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 10,
          boxHeight: 10,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 16,
        titleFont: {
          size: 15,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 14,
        },
        borderColor: 'rgba(148, 163, 184, 0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.dataset.label === 'Horas Trabalhadas') {
              // Converter horas decimais de volta para segundos e formatar
              const horasDecimais = context.parsed.y;
              const totalSegundos = Math.round(horasDecimais * 3600);
              label += formatarHorasParaHMS(totalSegundos / 3600);
            } else {
              label += context.parsed.y.toLocaleString('pt-BR');
            }
            return label;
          }
        }
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Corridas Completadas',
          font: {
            size: 14,
            weight: 'bold' as const,
          },
          color: 'rgb(59, 130, 246)',
        },
        grid: {
          color: 'rgba(59, 130, 246, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgb(59, 130, 246)',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
          callback: function(value: any) {
            return value.toLocaleString('pt-BR');
          }
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Horas Trabalhadas',
          font: {
            size: 14,
            weight: 'bold' as const,
          },
          color: 'rgb(34, 197, 94)',
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: 'rgb(34, 197, 94)',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
          callback: function(value: any) {
            return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'h';
          }
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 12,
            weight: '600' as any,
          },
          color: 'rgb(71, 85, 105)',
        },
      },
    },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header com controles */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-blue-950/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                <span className="text-xl">📉</span>
                Evolução {viewMode === 'mensal' ? 'Mensal' : 'Semanal'}
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Acompanhe a evolução de corridas e horas ao longo do tempo
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Seletor de Ano */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ano:</label>
                <select
                  value={anoSelecionado}
                  onChange={(e) => onAnoChange(Number(e.target.value))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {anosDisponiveis.map((ano) => (
                    <option key={ano} value={ano}>
                      {ano}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle Mensal/Semanal */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('mensal')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                    viewMode === 'mensal'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  📅 Mensal
                </button>
                <button
                  onClick={() => setViewMode('semanal')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                    viewMode === 'semanal'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  📊 Semanal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Evolução */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        {dadosAtivos.length > 0 ? (
          <div className="h-[500px]">
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-500 dark:text-slate-400">
                Nenhum dado disponível para {anoSelecionado}
              </p>
              <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                Tente selecionar outro ano
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cards com estatísticas */}
      {dadosAtivos.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total de Corridas */}
          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-5 shadow-md dark:border-blue-900 dark:from-blue-950/30 dark:to-blue-900/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Total de Corridas</p>
                <p className="mt-2 text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {dadosAtivos.reduce((sum, d) => sum + d.total_corridas, 0).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-200 text-2xl dark:bg-blue-900/50">
                🚗
              </div>
            </div>
          </div>

          {/* Total de Horas */}
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 shadow-md dark:border-emerald-900 dark:from-emerald-950/30 dark:to-emerald-900/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Total de Horas</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                  {formatarHorasParaHMS(dadosAtivos.reduce((sum, d) => sum + d.total_segundos, 0) / 3600)}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-200 text-2xl dark:bg-emerald-900/50">
                ⏱️
              </div>
            </div>
          </div>

          {/* Média de Corridas */}
          <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-5 shadow-md dark:border-purple-900 dark:from-purple-950/30 dark:to-purple-900/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  Média {viewMode === 'mensal' ? 'Mensal' : 'Semanal'}
                </p>
                <p className="mt-2 text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {(dadosAtivos.reduce((sum, d) => sum + d.total_corridas, 0) / dadosAtivos.length).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-200 text-2xl dark:bg-purple-900/50">
                📊
              </div>
            </div>
          </div>

          {/* Período */}
          <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-5 shadow-md dark:border-amber-900 dark:from-amber-950/30 dark:to-amber-900/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Período</p>
                <p className="mt-2 text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {anoSelecionado}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {dadosAtivos.length} {viewMode === 'mensal' ? 'meses' : 'semanas'}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-200 text-2xl dark:bg-amber-900/50">
                📅
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =================================================================================
// View Valores
// =================================================================================

function ValoresView({
  valoresData,
  loading,
}: {
  valoresData: ValoresEntregador[];
  loading: boolean;
}) {
  const [sortField, setSortField] = useState<keyof ValoresEntregador>('total_taxas');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ValoresEntregador[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função para formatar valores em Real
  const formatarReal = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  };

  // Pesquisa com debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc('pesquisar_valores_entregadores', {
          termo_busca: searchTerm.trim()
        });

        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        console.error('Erro ao pesquisar valores:', err);
        // Fallback para pesquisa local
        const filtered = valoresData.filter(e => 
          e.nome_entregador.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.id_entregador.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(filtered);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, valoresData]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 animate-spin rounded-full border-3 sm:border-4 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-400"></div>
          <p className="mt-4 text-sm sm:text-base lg:text-lg font-semibold text-blue-700 dark:text-blue-300">Carregando valores...</p>
        </div>
      </div>
    );
  }

  if (!valoresData || valoresData.length === 0) {
    return (
      <div className="rounded-xl sm:rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8 text-center shadow-lg dark:border-amber-900 dark:bg-amber-950/30 animate-fade-in">
        <div className="text-5xl sm:text-6xl mb-4">💰</div>
        <p className="text-lg sm:text-xl font-bold text-amber-900 dark:text-amber-100">Nenhum valor encontrado</p>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">Tente ajustar os filtros para ver os dados.</p>
      </div>
    );
  }

  const handleSort = (field: keyof ValoresEntregador) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Usar resultados da pesquisa se houver termo de busca, senão usar dados originais
  const dataToDisplay = searchTerm.trim() ? searchResults : valoresData;

  const sortedValores = [...dataToDisplay].sort((a, b) => {
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

  const SortIcon = ({ field }: { field: keyof ValoresEntregador }) => {
    if (sortField !== field) {
      return <span className="ml-1 text-slate-400">⇅</span>;
    }
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  // Calcular estatísticas gerais
  const totalGeral = dataToDisplay.reduce((sum, e) => sum + e.total_taxas, 0);
  const totalCorridas = dataToDisplay.reduce((sum, e) => sum + e.numero_corridas_aceitas, 0);
  const taxaMediaGeral = totalCorridas > 0 ? totalGeral / totalCorridas : 0;
  const totalEntregadores = dataToDisplay.length;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Barra de Pesquisa */}
      <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-lg dark:border-blue-800 dark:bg-slate-900">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Pesquisar entregador por nome ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pl-12 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
            {isSearching ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"></div>
            ) : (
              <span className="text-lg">🔍</span>
            )}
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            >
              <span className="text-lg">✕</span>
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            {isSearching ? (
              'Pesquisando...'
            ) : (
              `Encontrado${totalEntregadores === 1 ? '' : 's'} ${totalEntregadores} resultado${totalEntregadores === 1 ? '' : 's'}`
            )}
          </p>
        )}
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-xl sm:rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 sm:p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl dark:border-emerald-900 dark:from-emerald-950/30 dark:to-teal-950/30">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xl sm:text-2xl text-white shadow-md">
              💰
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-emerald-700 dark:text-emerald-300 truncate">Total Geral</p>
              <p className="text-base sm:text-xl lg:text-2xl font-bold text-emerald-900 dark:text-emerald-100 truncate">{formatarReal(totalGeral)}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl sm:rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl dark:border-blue-900 dark:from-blue-950/30 dark:to-indigo-950/30">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl sm:text-2xl text-white shadow-md">
              👥
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-blue-700 dark:text-blue-300 truncate">Entregadores</p>
              <p className="text-base sm:text-xl lg:text-2xl font-bold text-blue-900 dark:text-blue-100">{totalEntregadores}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl sm:rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl dark:border-purple-900 dark:from-purple-950/30 dark:to-pink-950/30">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-xl sm:text-2xl text-white shadow-md">
              🚗
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-purple-700 dark:text-purple-300 truncate">Total Corridas</p>
              <p className="text-base sm:text-xl lg:text-2xl font-bold text-purple-900 dark:text-purple-100">{totalCorridas.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl sm:rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl dark:border-amber-900 dark:from-amber-950/30 dark:to-orange-950/30">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-xl sm:text-2xl text-white shadow-md">
              📊
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-amber-700 dark:text-amber-300 truncate">Taxa Média</p>
              <p className="text-base sm:text-xl lg:text-2xl font-bold text-amber-900 dark:text-amber-100 truncate">{formatarReal(taxaMediaGeral)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Valores */}
      <div className="rounded-xl sm:rounded-2xl border border-blue-200 bg-white shadow-xl dark:border-blue-800 dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 dark:border-blue-800 dark:from-blue-950/30 dark:to-indigo-950/30">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl">💰</span>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">Valores por Entregador</h3>
          </div>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Clique nos cabeçalhos para ordenar • Total de {totalEntregadores} entregadores
          </p>
        </div>
        
        <div className="max-h-[600px] overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800">
              <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                <th 
                  className="cursor-pointer px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  onClick={() => handleSort('nome_entregador')}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-sm sm:text-base">👤</span>
                    <span className="truncate">Entregador</span>
                    <SortIcon field="nome_entregador" />
                  </div>
                </th>
                <th 
                  className="cursor-pointer px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  onClick={() => handleSort('total_taxas')}
                >
                  <div className="flex items-center justify-end gap-1 sm:gap-2">
                    <span className="text-sm sm:text-base">💵</span>
                    <span className="truncate">Total</span>
                    <SortIcon field="total_taxas" />
                  </div>
                </th>
                <th 
                  className="cursor-pointer px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  onClick={() => handleSort('numero_corridas_aceitas')}
                >
                  <div className="flex items-center justify-end gap-1 sm:gap-2">
                    <span className="text-sm sm:text-base">🚗</span>
                    <span className="truncate">Corridas</span>
                    <SortIcon field="numero_corridas_aceitas" />
                  </div>
                </th>
                <th 
                  className="cursor-pointer px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  onClick={() => handleSort('taxa_media')}
                >
                  <div className="flex items-center justify-end gap-1 sm:gap-2">
                    <span className="text-sm sm:text-base">📊</span>
                    <span className="truncate">Média</span>
                    <SortIcon field="taxa_media" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {sortedValores.map((entregador, index) => (
                <tr 
                  key={entregador.id_entregador}
                  className="group transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/20"
                >
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs sm:text-sm font-bold text-white shadow-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-none">{entregador.nome_entregador}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                    <span className="inline-flex items-center rounded-lg bg-emerald-100 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-bold text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
                      {formatarReal(entregador.total_taxas)}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                      {entregador.numero_corridas_aceitas.toLocaleString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                    <span className="inline-flex items-center rounded-lg bg-blue-100 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-blue-900 dark:bg-blue-950/50 dark:text-blue-100">
                      {formatarReal(entregador.taxa_media)}
                    </span>
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
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Entregador[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pesquisa com debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc('pesquisar_entregadores', {
          termo_busca: searchTerm.trim()
        });

        if (error) throw error;
        setSearchResults(data?.entregadores || []);
      } catch (err) {
        console.error('Erro ao pesquisar entregadores:', err);
        // Fallback para pesquisa local
        const filtered = (entregadoresData?.entregadores || []).filter(e => 
          e.nome_entregador.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.id_entregador.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(filtered);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, entregadoresData]);

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

  // Usar resultados da pesquisa se houver termo de busca, senão usar dados originais
  const dataToDisplay = searchTerm.trim() ? searchResults : entregadoresData.entregadores;

  const sortedEntregadores = [...dataToDisplay].sort((a, b) => {
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
  const totalOfertadas = dataToDisplay.reduce((sum, e) => sum + e.corridas_ofertadas, 0);
  const totalAceitas = dataToDisplay.reduce((sum, e) => sum + e.corridas_aceitas, 0);
  const totalRejeitadas = dataToDisplay.reduce((sum, e) => sum + e.corridas_rejeitadas, 0);
  const totalCompletadas = dataToDisplay.reduce((sum, e) => sum + e.corridas_completadas, 0);
  const totalEntregadores = dataToDisplay.length;
  const aderenciaMedia = totalEntregadores > 0 ? dataToDisplay.reduce((sum, e) => sum + e.aderencia_percentual, 0) / totalEntregadores : 0;
  const rejeicaoMedia = totalEntregadores > 0 ? dataToDisplay.reduce((sum, e) => sum + e.rejeicao_percentual, 0) / totalEntregadores : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Barra de Pesquisa */}
      <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-lg dark:border-blue-800 dark:bg-slate-900">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Pesquisar entregador por nome ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pl-12 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
            {isSearching ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"></div>
            ) : (
              <span className="text-lg">🔍</span>
            )}
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            >
              <span className="text-lg">✕</span>
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            {isSearching ? (
              'Pesquisando...'
            ) : (
              `Encontrado${totalEntregadores === 1 ? '' : 's'} ${totalEntregadores} resultado${totalEntregadores === 1 ? '' : 's'}`
            )}
          </p>
        )}
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl text-white shadow-md">
              👥
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalEntregadores}</p>
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analise' | 'comparacao' | 'utr' | 'entregadores' | 'valores' | 'evolucao' | 'monitoramento'>('dashboard');
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [aderenciaSemanal, setAderenciaSemanal] = useState<AderenciaSemanal[]>([]);
  const [aderenciaDia, setAderenciaDia] = useState<AderenciaDia[]>([]);
  const [aderenciaTurno, setAderenciaTurno] = useState<AderenciaTurno[]>([]);
  const [aderenciaSubPraca, setAderenciaSubPraca] = useState<AderenciaSubPraca[]>([]);
  const [aderenciaOrigem, setAderenciaOrigem] = useState<AderenciaOrigem[]>([]);
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [semanasDisponiveis, setSemanasDisponiveis] = useState<string[]>([]);
  const [pracas, setPracas] = useState<FilterOption[]>([]);
  const [subPracas, setSubPracas] = useState<FilterOption[]>([]);
  const [origens, setOrigens] = useState<FilterOption[]>([]);
  const [filters, setFilters] = useState<Filters>({ ano: null, semana: null, praca: null, subPraca: null, origem: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [currentUser, setCurrentUser] = useState<{ is_admin: boolean; assigned_pracas: string[] } | null>(null);
  const [utrData, setUtrData] = useState<UtrData | null>(null);
  const [loadingUtr, setLoadingUtr] = useState(false);
  const [entregadoresData, setEntregadoresData] = useState<EntregadoresData | null>(null);
  const [loadingEntregadores, setLoadingEntregadores] = useState(false);
  const [valoresData, setValoresData] = useState<ValoresEntregador[]>([]);
  const [loadingValores, setLoadingValores] = useState(false);
  const [evolucaoMensal, setEvolucaoMensal] = useState<EvolucaoMensal[]>([]);
  const [evolucaoSemanal, setEvolucaoSemanal] = useState<EvolucaoSemanal[]>([]);
  const [loadingEvolucao, setLoadingEvolucao] = useState(false);
  const [anoEvolucao, setAnoEvolucao] = useState<number>(new Date().getFullYear());

  const aderenciaGeral = useMemo(() => aderenciaSemanal[0], [aderenciaSemanal]);

  // Hook para registrar atividades
  const registrarAtividade = async (actionType: string, actionDetails: any = {}, tabName: string | null = null, filtersApplied: any = {}) => {
    try {
      // Gerar descrição detalhada da ação
      let descricaoDetalhada = '';
      
      const tabNames: Record<string, string> = {
        dashboard: 'Dashboard',
        analise: 'Análise Detalhada',
        comparacao: 'Comparação',
        utr: 'UTR',
        entregadores: 'Entregadores',
        monitoramento: 'Monitoramento'
      };
      
      const nomeAba = tabNames[tabName || activeTab] || tabName || activeTab;
      
      switch (actionType) {
        case 'filter_change':
          const filtros: string[] = [];
          if (filtersApplied.semana) filtros.push(`Semana ${filtersApplied.semana}`);
          if (filtersApplied.praca) filtros.push(`Praça: ${filtersApplied.praca}`);
          if (filtersApplied.sub_praca) filtros.push(`Sub-Praça: ${filtersApplied.sub_praca}`);
          if (filtersApplied.origem) filtros.push(`Origem: ${filtersApplied.origem}`);
          
          if (filtros.length > 0) {
            descricaoDetalhada = `Filtrou: ${filtros.join(', ')} na aba ${nomeAba}`;
          } else {
            descricaoDetalhada = `Limpou filtros na aba ${nomeAba}`;
          }
          break;
        case 'tab_change':
          descricaoDetalhada = `Acessou a aba ${nomeAba}`;
          break;
        case 'login':
          descricaoDetalhada = 'Fez login no sistema';
          break;
        case 'heartbeat':
          descricaoDetalhada = `Navegando na aba ${nomeAba}`;
          break;
        case 'page_visible':
          descricaoDetalhada = `Voltou para a aba ${nomeAba}`;
          break;
        case 'page_hidden':
          descricaoDetalhada = `Saiu da aba ${nomeAba}`;
          break;
        default:
          descricaoDetalhada = typeof actionDetails === 'string' ? actionDetails : `${actionType} na aba ${nomeAba}`;
      }
      
      await supabase.rpc('registrar_atividade', {
        p_action_type: actionType,
        p_action_details: descricaoDetalhada,
        p_tab_name: tabName || activeTab,
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

  // Monitorar visibilidade da página (para contar inatividade corretamente)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);
      
      if (currentUser) {
        if (visible) {
          // Página ficou visível - registrar volta
          registrarAtividade('page_visible', {}, activeTab, filters);
        } else {
          // Página ficou invisível - registrar saída
          registrarAtividade('page_hidden', {}, activeTab, filters);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, activeTab]);

  // Heartbeat - registrar atividade periódica (APENAS quando a página está visível)
  useEffect(() => {
    if (currentUser) {
      registrarAtividade('login', { dispositivo: 'web' }, activeTab, filters);
      
      const heartbeatInterval = setInterval(() => {
        if (currentUser && isPageVisible) {
          // Só registra heartbeat se a página estiver visível
          registrarAtividade('heartbeat', {}, activeTab, filters);
        }
      }, 60000); // A cada 1 minuto

      return () => clearInterval(heartbeatInterval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isPageVisible]);

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
          
          // Marcar loading como false após obter usuário
          setLoading(false);
        }
      } catch (err) {
        console.error('Erro ao buscar perfil do usuário:', err);
        setLoading(false);
      }
    }

    checkUserAndFetchData();
  }, []);

  useEffect(() => {
    async function fetchData() {
      // Só carregar dados se estiver nas abas que precisam
      if (!['dashboard', 'analise'].includes(activeTab)) {
        return;
      }
      
      setLoading(true);
      setError(null);

      const params = buildFilterPayload(filters);
      console.log('🔍 Filtros aplicados:', filters);
      console.log('📤 Parâmetros enviados ao backend:', params);

      try {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        console.log('🚀 Chamando dashboard_resumo...');
        const { data: resumoData, error: resumoError } = await supabase.rpc('dashboard_resumo', params);
        console.log('✅ Resposta recebida:', { data: resumoData, error: resumoError });

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
  }, [filters, currentUser, activeTab]);

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

  // Buscar dados de Valores quando a aba estiver ativa
  useEffect(() => {
    if (activeTab === 'valores') {
      async function fetchValores() {
        setLoadingValores(true);
        try {
          const params = buildFilterPayload(filters);
          const { data: valoresResult, error: valoresError } = await supabase.rpc('listar_valores_entregadores', params);
          
          if (valoresError) throw valoresError;
          
          setValoresData(valoresResult || []);
        } catch (err: any) {
          console.error('Erro ao buscar Valores:', err);
          setValoresData([]);
        } finally {
          setLoadingValores(false);
        }
      }
      
      fetchValores();
    }
  }, [activeTab, filters]);

  // Buscar anos disponíveis ao carregar
  useEffect(() => {
    async function fetchAnosDisponiveis() {
      try {
        const { data, error } = await supabase.rpc('listar_anos_disponiveis');
        if (error) throw error;
        setAnosDisponiveis(data || []);
      } catch (err: any) {
        console.error('Erro ao buscar anos disponíveis:', err);
        setAnosDisponiveis([new Date().getFullYear()]);
      }
    }
    fetchAnosDisponiveis();
  }, []);

  // Buscar dados de Evolução quando a aba estiver ativa
  useEffect(() => {
    if (activeTab === 'evolucao') {
      async function fetchEvolucao() {
        setLoadingEvolucao(true);
        try {
          const pracaSelecionada = filters.praca || null;

          // Buscar dados mensais e semanais em paralelo
          const [mensalResult, semanalResult] = await Promise.all([
            supabase.rpc('listar_evolucao_mensal', {
              p_praca: pracaSelecionada,
              p_ano: anoEvolucao
            }),
            supabase.rpc('listar_evolucao_semanal', {
              p_praca: pracaSelecionada,
              p_ano: anoEvolucao,
              p_limite_semanas: 52
            })
          ]);

          if (mensalResult.error) throw mensalResult.error;
          if (semanalResult.error) throw semanalResult.error;

          setEvolucaoMensal(mensalResult.data || []);
          setEvolucaoSemanal(semanalResult.data || []);
        } catch (err: any) {
          console.error('Erro ao buscar Evolução:', err);
          setEvolucaoMensal([]);
          setEvolucaoSemanal([]);
        } finally {
          setLoadingEvolucao(false);
        }
      }

      fetchEvolucao();
    }
  }, [activeTab, filters.praca, anoEvolucao]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1920px] px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header Principal Redesenhado */}
        <header className="mb-4 sm:mb-6 lg:mb-8 animate-fade-in">
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-blue-100 bg-white shadow-xl dark:border-blue-900/30 dark:bg-slate-900">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-1">
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
                  <span className="text-2xl sm:text-2xl lg:text-3xl">📊</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent dark:from-white dark:to-blue-200 truncate">
                    Dashboard Operacional
                  </h1>
                  <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs lg:text-sm font-medium text-slate-600 dark:text-slate-400 truncate">
                    Sistema de Análise e Monitoramento em Tempo Real
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-3 lg:gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">Última atualização</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0">
                  <span className="text-lg sm:text-xl">🟢</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {loading && (
          <div className="flex h-[60vh] sm:h-[70vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 animate-spin rounded-full border-3 sm:border-4 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-400"></div>
              <p className="mt-4 text-sm sm:text-base lg:text-lg font-semibold text-blue-700 dark:text-blue-300">Carregando dashboard...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex h-[60vh] sm:h-[70vh] items-center justify-center animate-fade-in">
            <div className="max-w-sm sm:max-w-md mx-auto rounded-xl sm:rounded-2xl border border-rose-200 bg-white p-6 sm:p-8 text-center shadow-xl dark:border-rose-900 dark:bg-slate-900">
              <div className="text-4xl sm:text-5xl">⚠️</div>
              <p className="mt-4 text-lg sm:text-xl font-bold text-rose-900 dark:text-rose-100">Erro ao carregar dados</p>
              <p className="mt-2 text-sm sm:text-base text-rose-700 dark:text-rose-300">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {totals && !loading && !error && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            {/* Header com filtros e tabs */}
            <div className="glass-strong rounded-2xl border border-blue-200 p-3 sm:p-4 lg:p-6 shadow-xl transition-all hover:shadow-2xl dark:border-blue-900 animate-slide-down">
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
                  <div className="my-3 sm:my-4 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent dark:via-blue-700"></div>
                </>
              )}
              {/* Tabs com scroll horizontal em mobile */}
              <div className="relative">
                <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-transparent">
                  <TabButton label="Dashboard" icon="📊" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                  <TabButton label="Análise" icon="📈" active={activeTab === 'analise'} onClick={() => setActiveTab('analise')} />
                  <TabButton label="Comparação" icon="⚖️" active={activeTab === 'comparacao'} onClick={() => setActiveTab('comparacao')} />
                  <TabButton label="UTR" icon="📏" active={activeTab === 'utr'} onClick={() => setActiveTab('utr')} />
                  <TabButton label="Entregadores" icon="👥" active={activeTab === 'entregadores'} onClick={() => setActiveTab('entregadores')} />
                  <TabButton label="Valores" icon="💰" active={activeTab === 'valores'} onClick={() => setActiveTab('valores')} />
                  <TabButton label="Evolução" icon="📉" active={activeTab === 'evolucao'} onClick={() => setActiveTab('evolucao')} />
                  {currentUser?.is_admin && (
                    <TabButton label="Monitor" icon="🔍" active={activeTab === 'monitoramento'} onClick={() => setActiveTab('monitoramento')} />
                  )}
                </div>
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
              
              {activeTab === 'valores' && (
                <ValoresView
                  valoresData={valoresData}
                  loading={loadingValores}
                />
              )}
              
              {activeTab === 'evolucao' && (
                <EvolucaoView
                  evolucaoMensal={evolucaoMensal}
                  evolucaoSemanal={evolucaoSemanal}
                  loading={loadingEvolucao}
                  anoSelecionado={anoEvolucao}
                  anosDisponiveis={anosDisponiveis}
                  onAnoChange={setAnoEvolucao}
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