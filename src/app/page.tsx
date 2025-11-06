'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getSafeErrorMessage, safeLog } from '@/lib/errorHandler';
import { sanitizeText } from '@/lib/sanitize';
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
import FiltroSelect from '@/components/FiltroSelect';
import FiltroMultiSelect from '@/components/FiltroMultiSelect';
import TabButton from '@/components/TabButton';
import MetricCard from '@/components/MetricCard';
import AderenciaCard from '@/components/AderenciaCard';
import DashboardView from '@/components/views/DashboardView';
import AnaliseView from '@/components/views/AnaliseView';

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
  turno: string | null;
  subPracas: string[];
  origens: string[];
  turnos: string[];
  semanas: number[];
}

interface DimensoesDashboard {
  anos: number[];
  semanas: string[];
  pracas: string[];
  sub_pracas: string[];
  origens: string[];
  turnos?: string[];
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
  is_active?: boolean;
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
  total_corridas?: number;
  corridas_completadas?: number;
  corridas_ofertadas?: number;
  corridas_aceitas?: number;
  corridas_rejeitadas?: number;
  total_segundos: number;
}

interface EvolucaoSemanal {
  ano: number;
  semana: number;
  semana_label: string;
  total_corridas?: number;
  corridas_completadas?: number;
  corridas_ofertadas?: number;
  corridas_aceitas?: number;
  corridas_rejeitadas?: number;
  total_segundos: number;
}

interface UtrSemanal {
  ano: number;
  semana: number;
  semana_label: string;
  tempo_horas: number;
  total_corridas: number;
  utr: number;
}

// =================================================================================
// Funções auxiliares
// =================================================================================

// Variável para controlar logs em desenvolvimento
const IS_DEV = process.env.NODE_ENV === 'development';

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

// Função utilitária para converter valores para número de forma segura
function safeNumber(value: number | string | null | undefined): number {
  return value === null || value === undefined ? 0 : Number(value);
}

// Função para comparar arrays de forma eficiente (melhor que JSON.stringify)
function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function buildFilterPayload(filters: Filters) {
  // Limitar tamanho de arrays para prevenir ataques de DoS
  const MAX_ARRAY_SIZE = 50;
  
  // Validar e limitar sub-praças
  let subPraca: string | null = null;
  if (filters.subPracas && filters.subPracas.length > 0) {
    const limited = filters.subPracas.slice(0, MAX_ARRAY_SIZE);
    subPraca = limited.length === 1 ? limited[0] : limited.join(',');
  } else if (filters.subPraca) {
    subPraca = filters.subPraca.length > 100 ? filters.subPraca.substring(0, 100) : filters.subPraca;
  }
    
  // Validar e limitar origens
  let origem: string | null = null;
  if (filters.origens && filters.origens.length > 0) {
    const limited = filters.origens.slice(0, MAX_ARRAY_SIZE);
    origem = limited.length === 1 ? limited[0] : limited.join(',');
  } else if (filters.origem) {
    origem = filters.origem.length > 100 ? filters.origem.substring(0, 100) : filters.origem;
  }

  // Validar e limitar turnos
  let turno: string | null = null;
  if (filters.turnos && filters.turnos.length > 0) {
    const limited = filters.turnos.slice(0, MAX_ARRAY_SIZE);
    turno = limited.length === 1 ? limited[0] : limited.join(',');
  } else if (filters.turno) {
    turno = filters.turno.length > 100 ? filters.turno.substring(0, 100) : filters.turno;
  }

  // Validar e limitar semanas
  let semana: string | null = null;
  if (filters.semanas && filters.semanas.length > 0) {
    const limited = filters.semanas.slice(0, MAX_ARRAY_SIZE);
    semana = limited.length === 1 ? String(limited[0]) : limited.map(s => String(s)).join(',');
  } else if (filters.semana !== null) {
    semana = String(filters.semana);
  }

  // Validar ano
  let ano: number | null = filters.ano;
  if (ano !== null && (isNaN(ano) || ano < 2000 || ano > 2100)) {
    ano = null;
  }

  // Validar e limitar praça
  let praca: string | null = filters.praca;
  if (praca && praca.length > 100) {
    praca = praca.substring(0, 100);
  }

  return {
    p_ano: ano,
    p_semana: semana,
    p_praca: praca,
    p_sub_praca: subPraca,
    p_origem: origem,
    p_turno: turno,
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
// Views Principais
// =================================================================================

function AnaliseView({ totals }: { totals: Totals }) {
  const [viewMode, setViewMode] = useState<'turno' | 'sub_praca' | 'origem'>('turno');

  return (
    <div className="space-y-6">
      {/* Aderência Geral Redesenhada */}
      {aderenciaGeral && (
        <div className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/90 backdrop-blur-sm p-5 sm:p-6 lg:p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-white/30 dark:border-white/10 dark:bg-slate-900/90 animate-slide-up">
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 opacity-0 blur-xl transition-opacity group-hover:opacity-100"></div>
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
      <div className="rounded-2xl border border-white/20 bg-white/90 backdrop-blur-sm p-5 sm:p-6 shadow-xl transition-all duration-300 hover:shadow-2xl dark:border-white/10 dark:bg-slate-900/90">
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
      <div className="rounded-2xl border border-white/20 bg-white/90 backdrop-blur-sm p-5 sm:p-6 shadow-xl transition-all duration-300 hover:shadow-2xl dark:border-white/10 dark:bg-slate-900/90">
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
  
  // Detectar tema atual para ajustar cores do gráfico
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const checkTheme = () => {
      if (typeof window !== 'undefined') {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
      }
    };
    
    checkTheme();
    
    const observer = new MutationObserver(() => {
      checkTheme();
    });
    
    if (typeof window !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
    }
    
    return () => observer.disconnect();
  }, []);
  
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

  // Gradientes para gráficos da Análise
  const createGradient = (ctx: any, color: string) => {
    const chart = ctx.chart;
    const {ctx: canvasCtx, chartArea} = chart;
    if (!chartArea) return color;
    const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    
    if (color.includes('59, 130, 246')) { // Blue
      gradient.addColorStop(0, 'rgba(96, 165, 250, 0.4)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
    } else if (color.includes('16, 185, 129')) { // Green
      gradient.addColorStop(0, 'rgba(74, 222, 128, 0.4)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)');
    } else if (color.includes('239, 68, 68')) { // Red
      gradient.addColorStop(0, 'rgba(248, 113, 113, 0.4)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0.05)');
    } else if (color.includes('139, 92, 246')) { // Purple
      gradient.addColorStop(0, 'rgba(167, 139, 250, 0.4)');
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0.05)');
    } else if (color.includes('99, 102, 241')) { // Indigo
      gradient.addColorStop(0, 'rgba(129, 140, 248, 0.4)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.05)');
    }
    
    return gradient;
  };

  // Dados para o gráfico de barras por dia (melhorado)
  const barDataDia = {
    labels: aderenciaDia.map(d => d.dia_da_semana),
    datasets: [
      {
        label: '📢 Ofertadas',
        data: aderenciaDia.map(d => d.corridas_ofertadas ?? 0),
        backgroundColor: (ctx: any) => createGradient(ctx, 'rgba(59, 130, 246, 0.7)'),
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        fill: true,
      },
      {
        label: '✅ Aceitas',
        data: aderenciaDia.map(d => d.corridas_aceitas ?? 0),
        backgroundColor: (ctx: any) => createGradient(ctx, 'rgba(16, 185, 129, 0.7)'),
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        fill: true,
      },
      {
        label: '❌ Rejeitadas',
        data: aderenciaDia.map(d => d.corridas_rejeitadas ?? 0),
        backgroundColor: (ctx: any) => createGradient(ctx, 'rgba(239, 68, 68, 0.7)'),
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        fill: true,
      },
      {
        label: '🏁 Completadas',
        data: aderenciaDia.map(d => d.corridas_completadas ?? 0),
        backgroundColor: (ctx: any) => createGradient(ctx, 'rgba(139, 92, 246, 0.7)'),
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(139, 92, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        fill: true,
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
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: true,
    layout: {
      padding: {
        top: 10,
        right: 10,
        bottom: 5,
        left: 5,
      },
    },
    animation: {
      duration: 300, // Reduzido de 1000ms para melhor performance
      easing: 'easeOutCubic' as const, // Corrigido: easeOut não é válido, usando easeOutCubic
      delay: 0, // Removido delay para melhor performance
      // Desabilitar animação em dispositivos lentos
      ...(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? { duration: 0 } : {}),
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
      axis: 'x' as const,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'center' as const,
        labels: {
          font: {
            size: 13,
            weight: 'bold' as const,
            family: "'Inter', 'system-ui', sans-serif",
          },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 12,
          boxHeight: 12,
          color: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)',
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(15, 23, 42, 0.96)',
        titleColor: 'rgba(255, 255, 255, 1)',
        bodyColor: 'rgba(226, 232, 240, 1)',
        padding: 16,
        titleFont: {
          size: 15,
          weight: 'bold' as const,
          family: "'Inter', 'system-ui', sans-serif",
        },
        bodyFont: {
          size: 14,
          weight: '600' as any,
          family: "'Inter', 'system-ui', sans-serif",
        },
        borderColor: 'rgba(148, 163, 184, 0.5)',
        borderWidth: 2,
        cornerRadius: 10,
        displayColors: true,
        boxWidth: 12,
        boxHeight: 12,
        boxPadding: 5,
        usePointStyle: true,
        callbacks: {
          title: function(context: any) {
            const label = context[0]?.label || '';
            return `📅 ${label}`;
          },
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('pt-BR').format(context.parsed.y) + ' corridas';
            }
            return label;
          },
          afterLabel: function(context: any) {
            const dataIndex = context.dataIndex;
            if (dataIndex > 0) {
              const currentValue = context.parsed.y;
              const previousValue = context.dataset.data[dataIndex - 1];
              if (previousValue && previousValue !== 0) {
                const variation = ((currentValue - previousValue) / previousValue * 100);
                if (Math.abs(variation) > 0.1) {
                  const arrow = variation > 0 ? '📈' : '📉';
                  const sign = variation > 0 ? '+' : '';
                  return `${arrow} ${sign}${variation.toFixed(1)}% vs anterior`;
                }
              }
            }
            return '';
          },
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.12)',
          lineWidth: 1,
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
            weight: 'bold' as const,
            family: "'Inter', 'system-ui', sans-serif",
          },
          color: isDarkMode ? 'rgb(203, 213, 225)' : 'rgb(71, 85, 105)',
          padding: 8,
          callback: function(value: any) {
            return new Intl.NumberFormat('pt-BR').format(value);
          }
        },
      },
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
            weight: '700' as any,
            family: "'Inter', 'system-ui', sans-serif",
          },
          color: isDarkMode ? 'rgb(203, 213, 225)' : 'rgb(71, 85, 105)',
          padding: 8,
        },
      },
    },
    elements: {
      line: {
        borderCapStyle: 'round' as const,
        borderJoinStyle: 'round' as const,
      },
      point: {
        hoverBorderWidth: 3,
      },
    },
  }), [isDarkMode]);

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
            <div className="relative p-8 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/20 dark:from-blue-950/10 dark:via-slate-900 dark:to-indigo-950/10">
              {/* Elementos decorativos */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
              </div>
              
              <div className="relative z-10 rounded-xl bg-white/60 dark:bg-slate-900/60 p-6 backdrop-blur-sm shadow-inner">
                <Line data={barDataDia} options={{}} redraw={false} updateMode="none" />
              </div>
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
            <div className="relative p-8 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/20 dark:from-purple-950/10 dark:via-slate-900 dark:to-pink-950/10">
              {/* Elementos decorativos */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl"></div>
              </div>
              
              <div className="relative z-10 rounded-xl bg-white/60 dark:bg-slate-900/60 p-6 backdrop-blur-sm shadow-inner">
                <Line data={{
                  labels: aderenciaTurno.map(t => t.periodo),
                  datasets: [
                    {
                      label: '📢 Ofertadas',
                      data: aderenciaTurno.map(t => t.corridas_ofertadas ?? 0),
                      backgroundColor: (ctx: any) => createGradient(ctx, 'rgba(139, 92, 246, 0.2)'),
                      borderColor: 'rgb(139, 92, 246)',
                      borderWidth: 3,
                      tension: 0.4,
                      pointRadius: 5,
                      pointHoverRadius: 8,
                      pointBackgroundColor: 'rgb(139, 92, 246)',
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2,
                      pointHoverBorderWidth: 3,
                      fill: true,
                    },
                    {
                      label: '✅ Aceitas',
                      data: aderenciaTurno.map(t => t.corridas_aceitas ?? 0),
                      backgroundColor: (ctx: any) => createGradient(ctx, 'rgba(16, 185, 129, 0.2)'),
                      borderColor: 'rgb(16, 185, 129)',
                      borderWidth: 3,
                      tension: 0.4,
                      pointRadius: 5,
                      pointHoverRadius: 8,
                      pointBackgroundColor: 'rgb(16, 185, 129)',
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2,
                      pointHoverBorderWidth: 3,
                      fill: true,
                    },
                    {
                      label: '🏁 Completadas',
                      data: aderenciaTurno.map(t => t.corridas_completadas ?? 0),
                      backgroundColor: (ctx: any) => createGradient(ctx, 'rgba(99, 102, 241, 0.2)'),
                      borderColor: 'rgb(99, 102, 241)',
                      borderWidth: 3,
                      tension: 0.4,
                      pointRadius: 5,
                      pointHoverRadius: 8,
                      pointBackgroundColor: 'rgb(99, 102, 241)',
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2,
                      pointHoverBorderWidth: 3,
                      fill: true,
                    },
                  ],
                }} options={{}} redraw={false} updateMode="none" />
              </div>
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
            <div className="relative p-8 bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/20 dark:from-emerald-950/10 dark:via-slate-900 dark:to-teal-950/10">
              {/* Elementos decorativos */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl"></div>
              </div>
              
              <div className="relative z-10 rounded-xl bg-white/60 dark:bg-slate-900/60 p-6 backdrop-blur-sm shadow-inner">
                <Line data={{
                  labels: (viewModeLocal === 'subpraca' ? aderenciaSubPraca : aderenciaOrigem).map(item => 
                    viewModeLocal === 'subpraca' ? (item as any).sub_praca : (item as any).origem
                  ),
                  datasets: [
                    {
                      label: '📢 Ofertadas',
                      data: (viewModeLocal === 'subpraca' ? aderenciaSubPraca : aderenciaOrigem).map(item => item.corridas_ofertadas ?? 0),
                      backgroundColor: (ctx: any) => createGradient(ctx, 'rgba(16, 185, 129, 0.2)'),
                      borderColor: 'rgb(16, 185, 129)',
                      borderWidth: 3,
                      tension: 0.4,
                      pointRadius: 5,
                      pointHoverRadius: 8,
                      pointBackgroundColor: 'rgb(16, 185, 129)',
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2,
                      pointHoverBorderWidth: 3,
                      fill: true,
                    },
                    {
                      label: '✅ Aceitas',
                      data: (viewModeLocal === 'subpraca' ? aderenciaSubPraca : aderenciaOrigem).map(item => item.corridas_aceitas ?? 0),
                      backgroundColor: (ctx: any) => {
                        const chart = ctx.chart;
                        const {ctx: canvasCtx, chartArea} = chart;
                        if (!chartArea) return 'rgba(20, 184, 166, 0.2)';
                        const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, 'rgba(45, 212, 191, 0.4)');
                        gradient.addColorStop(1, 'rgba(20, 184, 166, 0.05)');
                        return gradient;
                      },
                      borderColor: 'rgb(20, 184, 166)',
                      borderWidth: 3,
                      tension: 0.4,
                      pointRadius: 5,
                      pointHoverRadius: 8,
                      pointBackgroundColor: 'rgb(20, 184, 166)',
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2,
                      pointHoverBorderWidth: 3,
                      fill: true,
                    },
                    {
                      label: '🏁 Completadas',
                      data: (viewModeLocal === 'subpraca' ? aderenciaSubPraca : aderenciaOrigem).map(item => item.corridas_completadas ?? 0),
                      backgroundColor: (ctx: any) => createGradient(ctx, 'rgba(59, 130, 246, 0.2)'),
                      borderColor: 'rgb(59, 130, 246)',
                      borderWidth: 3,
                      tension: 0.4,
                      pointRadius: 5,
                      pointHoverRadius: 8,
                      pointBackgroundColor: 'rgb(59, 130, 246)',
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2,
                      pointHoverBorderWidth: 3,
                      fill: true,
                    },
                  ],
                }} options={{
                  ...chartOptions,
                  scales: {
                    ...chartOptions.scales,
                    x: {
                      ...chartOptions.scales.x,
                      ticks: { 
                        ...chartOptions.scales.x.ticks,
                        maxRotation: 45, 
                        minRotation: 45,
                        font: { size: 10, weight: '700' as any, family: "'Inter', 'system-ui', sans-serif" },
                      },
                    },
                  },
                }} redraw={false} updateMode="none" />
              </div>
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
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [atividades, setAtividades] = useState<any[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMonitoramento = useCallback(async () => {
    try {
      setError(null);
      
      // Buscar usuários online
      const { data, error } = await supabase.rpc('listar_usuarios_online');
      
      if (error) {
        if (IS_DEV) {
        console.error('Erro ao buscar usuários online:', error);
          if (error.code === '42883') {
            console.error('Função listar_usuarios_online não existe no banco de dados.');
          }
        }
        
        // Se a função não existir, mostrar mensagem específica
        if (error.code === '42883') {
          setError('Função de monitoramento não configurada. Entre em contato com o administrador.');
        } else {
        setError(getSafeErrorMessage(error) || 'Erro ao carregar usuários online. Tente novamente.');
        }
        setUsuarios([]);
        return;
      }
      
      // Validar dados recebidos
      if (!data || !Array.isArray(data)) {
        if (IS_DEV) console.warn('Dados de usuários online inválidos:', data);
        setUsuarios([]);
        return;
      }
      
      if (IS_DEV && data.length > 0) {
        console.log(`✅ ${data.length} usuário(s) online encontrado(s)`);
      }
      
      // Buscar atividades recentes (últimas 50) - com tratamento de erro não bloqueante
      let atividadesData: any[] = [];
      try {
        const { data: atividadesResponse, error: atividadesError } = await supabase
        .from('user_activity')
          .select('id, user_id, action_type, action_details, tab_name, filters_applied, created_at, session_id')
        .order('created_at', { ascending: false })
        .limit(50);
      
        if (atividadesError) {
          if (IS_DEV) {
            console.warn('Erro ao buscar atividades:', atividadesError);
            // Se a tabela não existir, código 42P01
            if (atividadesError.code === '42P01') {
              console.warn('Tabela user_activity não existe. As atividades serão registradas quando a tabela for criada.');
            }
          }
          setAtividades([]);
        } else if (atividadesResponse && Array.isArray(atividadesResponse)) {
          atividadesData = atividadesResponse;
        setAtividades(atividadesData);
          if (IS_DEV) {
            if (atividadesData.length > 0) {
              console.log(`✅ ${atividadesData.length} atividades carregadas`);
            } else {
              console.log('ℹ️ Nenhuma atividade encontrada na tabela user_activity');
            }
          }
        } else {
          setAtividades([]);
          if (IS_DEV && !atividadesError) {
            console.warn('Resposta de atividades inválida:', atividadesResponse);
          }
        }
      } catch (err: any) {
        if (IS_DEV) {
        console.warn('Erro ao buscar atividades (pode não estar disponível):', err);
          if (err?.code === '42P01') {
            console.warn('Tabela user_activity não existe no banco de dados.');
          }
        }
        setAtividades([]);
        // Não bloquear a funcionalidade principal se atividades falhar
      }
      
      // Mapear os dados da API para o formato esperado com validações
      const usuariosMapeados: UsuarioOnline[] = (data || []).map((u: any): UsuarioOnline | null => {
        // Validações de segurança
        if (!u || !u.user_id) return null;
        
        // Segundos de inatividade já vem como número do backend
        const segundosInativo = typeof u.seconds_inactive === 'number' ? u.seconds_inactive : 0;
        
        // Extrair praças dos filtros com validação
        const filtros = u.filters_applied || {};
        let pracas: string[] = [];
        if (filtros.p_praca) {
          pracas = Array.isArray(filtros.p_praca) ? filtros.p_praca : [filtros.p_praca];
        } else if (filtros.praca) {
          pracas = Array.isArray(filtros.praca) ? filtros.praca : [filtros.praca];
        }
        
        // A descrição detalhada já vem do backend (action_details)
        const descricaoAcao = u.action_details || u.last_action_type || u.action_type || 'Atividade desconhecida';
        
        // Contar ações da última hora com validação
        const umaHoraAtras = new Date();
        umaHoraAtras.setHours(umaHoraAtras.getHours() - 1);
        const acoesUltimaHora = atividadesData.filter((a: any) => 
          a && a.user_id === u.user_id && a.created_at && new Date(a.created_at) > umaHoraAtras
        ).length;
        
        // Sanitizar dados do usuário
        const userName = u.user_name || (u.user_email ? u.user_email.split('@')[0] : 'Usuário');
        const userEmail = u.user_email || '';
        
        return {
          user_id: u.user_id || '',
          nome: sanitizeText(userName),
          email: sanitizeText(userEmail),
          aba_atual: u.current_tab || null,
          pracas: pracas,
          ultima_acao: descricaoAcao,
          filtros: filtros,
          ultima_atividade: u.last_action_type || descricaoAcao,
          segundos_inativo: Math.floor(Math.max(0, segundosInativo)),
          acoes_ultima_hora: acoesUltimaHora,
          is_active: u.is_active !== false
        } as UsuarioOnline;
      }).filter((u: UsuarioOnline | null): u is UsuarioOnline => u !== null); // Filtrar nulos
      
      setUsuarios(usuariosMapeados);
    } catch (err: any) {
        safeLog.error('Erro ao buscar monitoramento:', err);
        setError(getSafeErrorMessage(err) || 'Erro desconhecido ao carregar monitoramento');
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitoramento();
    
    // Limpar intervalo anterior se existir
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchMonitoramento();
      }, 10000); // Atualizar a cada 10 segundos
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, fetchMonitoramento]);

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

  const formatarTimestamp = (timestamp: string | null | undefined) => {
    if (!timestamp) return 'Data desconhecida';
    
    try {
    const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Data inválida';
      
    const agora = new Date();
    const diff = Math.floor((agora.getTime() - date.getTime()) / 1000);
    
      if (diff < 0) return 'Agora';
    if (diff < 60) return `${diff}s atrás`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return date.toLocaleDateString('pt-BR');
    } catch (err) {
      return 'Data inválida';
    }
  };

  // IMPORTANTE: Todos os hooks devem ser chamados ANTES de qualquer early return
  // Calcular estatísticas (otimizado com useMemo)
  const usuariosAtivos = useMemo(() => usuarios.filter(u => u.segundos_inativo < 60).length, [usuarios]);
  const usuariosInativos = useMemo(() => usuarios.length - usuariosAtivos, [usuarios, usuariosAtivos]);
  const totalAcoes = useMemo(() => usuarios.reduce((sum, u) => sum + u.acoes_ultima_hora, 0), [usuarios]);
  
  // Filtrar usuários (otimizado com useMemo)
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      if (filtroStatus === 'ativos') return u.segundos_inativo < 60;
      if (filtroStatus === 'inativos') return u.segundos_inativo >= 60;
      return true;
    });
  }, [usuarios, filtroStatus]);

  if (loading && usuarios.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center animate-pulse-soft">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-lg font-semibold text-blue-700 dark:text-blue-200">Carregando monitoramento...</p>
        </div>
      </div>
    );
  }

  // Mostrar erro se houver e não houver usuários
  if (error && usuarios.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center animate-fade-in">
        <div className="max-w-sm mx-auto rounded-xl border border-rose-200 bg-white p-6 text-center shadow-xl dark:border-rose-900 dark:bg-slate-900">
          <div className="text-4xl">⚠️</div>
          <p className="mt-4 text-lg font-bold text-rose-900 dark:text-rose-100">Erro ao carregar monitoramento</p>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchMonitoramento();
            }}
            className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-rose-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }
  ;return (
    <div className="space-y-6 animate-fade-in">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Online"
          value={usuarios.length}
          icon="👥"
          color="blue"
        />

        <MetricCard
          title="Ativos"
          value={usuariosAtivos}
          icon="✅"
          color="green"
        />

        <MetricCard
          title="Inativos"
          value={usuariosInativos}
          icon="⏸️"
          color="red"
        />

        <MetricCard
          title="Ações (1h)"
          value={totalAcoes}
          icon="⚡"
          color="purple"
        />
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
              onClick={() => {
                setLoading(true);
                fetchMonitoramento();
              }}
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-700 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? '⏳ Atualizando...' : '🔄 Atualizar'}
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
                atividades.map((ativ, idx) => {
                  // Validação de dados antes de renderizar
                  if (!ativ || !ativ.user_id || !ativ.created_at) return null;
                  
                  // Buscar nome do usuário da lista de usuários online
                  const usuario = usuarios.find(u => u.user_id === ativ.user_id);
                  const nomeUsuario = usuario?.nome || usuario?.email || 'Usuário desconhecido';
                  
                  // Determinar descrição da ação
                  let actionDescription = '';
                  let actionIcon = '📝';
                  
                  if (ativ.action_details) {
                    // Se tiver action_details, usar diretamente
                    actionDescription = ativ.action_details;
                  } else if (ativ.action_type) {
                    // Senão, construir baseado no tipo
                    switch (ativ.action_type) {
                      case 'tab_change':
                        actionDescription = `Acessou a aba: ${ativ.tab_name || 'desconhecida'}`;
                        actionIcon = '🔄';
                        break;
                      case 'filter_change':
                        actionDescription = 'Alterou filtros';
                        actionIcon = '🔍';
                        break;
                      case 'login':
                        actionDescription = 'Fez login no sistema';
                        actionIcon = '🔐';
                        break;
                      case 'heartbeat':
                        actionDescription = `Ativo na aba ${ativ.tab_name || 'sistema'}`;
                        actionIcon = '💓';
                        break;
                      case 'page_visible':
                        actionDescription = `Voltou para a aba ${ativ.tab_name || 'sistema'}`;
                        actionIcon = '👁️';
                        break;
                      case 'page_hidden':
                        actionDescription = `Saiu da aba ${ativ.tab_name || 'sistema'}`;
                        actionIcon = '👋';
                        break;
                      default:
                        actionDescription = ativ.action_type || 'Ação desconhecida';
                    }
                  } else {
                    actionDescription = 'Ação desconhecida';
                  }
                  
                  return (
                  <div
                      key={ativ.id || `${ativ.user_id}-${ativ.created_at}-${idx}`}
                    className="group rounded-lg border border-slate-100 bg-slate-50 p-3 transition-all hover:border-indigo-200 hover:bg-indigo-50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30"
                  >
                    <div className="flex items-start gap-2">
                        <div className="mt-0.5 text-xs shrink-0">{actionIcon}</div>
                      <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {nomeUsuario}
                          </p>
                          <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                            {actionDescription}
                        </p>
                          <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                          {formatarTimestamp(ativ.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                  );
                }).filter(Boolean)
              ) : (
                <div className="py-8 text-center">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Nenhuma atividade registrada
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    As atividades aparecerão aqui quando os usuários interagirem com o sistema
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
  const [error, setError] = useState<string | null>(null);
  const [dadosComparacao, setDadosComparacao] = useState<DashboardResumoData[]>([]);
  const [utrComparacao, setUtrComparacao] = useState<any[]>([]);
  const [todasSemanas, setTodasSemanas] = useState<(number | string)[]>([]);
  
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
        if (IS_DEV) console.error('Erro ao buscar semanas:', err);
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

  const toggleSemana = (semana: number | string) => {
    setSemanasSelecionadas(prev => {
      // Extrair número da semana se for formato S2025-W44
      let semanaStr = String(semana);
      if (semanaStr.includes('W')) {
        const match = semanaStr.match(/W(\d+)/);
        semanaStr = match ? match[1] : semanaStr;
      } else {
        // Se já for número, converter para string
        semanaStr = String(semana);
      }
      
      if (prev.includes(semanaStr)) {
        return prev.filter(s => s !== semanaStr);
      } else {
        return [...prev, semanaStr].sort((a, b) => {
          const numA = parseInt(a, 10);
          const numB = parseInt(b, 10);
          return numA - numB;
        });
      }
    });
  };

  const compararSemanas = async () => {
    if (semanasSelecionadas.length < 2) return;

    setLoading(true);
    setError(null);
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
      
      if (IS_DEV) {
        console.log('📊 Dados Comparação:', resultadosDados.length, 'semanas');
        console.log('🎯 UTR Comparação:', resultadosUtr.length, 'semanas');
      }
      
      setDadosComparacao(resultadosDados.map(r => r.dados));
      setUtrComparacao(resultadosUtr);
      
    } catch (error) {
      safeLog.error('Erro ao comparar semanas:', error);
      setError(getSafeErrorMessage(error) || 'Erro ao comparar semanas. Tente novamente.');
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
            {todasSemanas.map((semana) => {
              // Extrair número da semana para comparação e exibição
              const semanaStr = String(semana);
              let semanaNumStr = semanaStr;
              if (semanaStr.includes('W')) {
                const match = semanaStr.match(/W(\d+)/);
                semanaNumStr = match ? match[1] : semanaStr;
              }
              
              return (
              <label
                  key={semanaStr}
                className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-3 text-center transition-all hover:scale-105 ${
                    semanasSelecionadas.includes(semanaNumStr)
                    ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                    checked={semanasSelecionadas.includes(semanaNumStr)}
                  onChange={() => toggleSemana(semana)}
                />
                  <span className="text-sm font-bold">{semanaNumStr}</span>
              </label>
              );
            })}
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
            <MetricCard
              title="Aderência Média"
              value={(dadosComparacao.reduce((sum, d) => sum + (d.semanal[0]?.aderencia_percentual ?? 0), 0) / dadosComparacao.length).toFixed(1)}
              icon="📊"
              color="blue"
            />
            <MetricCard
              title="Total de Corridas"
              value={dadosComparacao.reduce((sum, d) => sum + (d.totais?.corridas_completadas ?? 0), 0).toLocaleString('pt-BR')}
              icon="🚗"
              color="green"
            />
            <MetricCard
              title="Horas Entregues"
              value={formatarHorasParaHMS(
                dadosComparacao.reduce((sum, d) => sum + parseFloat(d.semanal[0]?.horas_entregues ?? '0'), 0).toString()
              )}
              icon="⏱️"
              color="purple"
            />
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
                        
                        if (IS_DEV) console.log(`📊 UTR Semana ${item.semana}:`, utrValue);
                        
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
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/20">
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
  utrSemanal,
  loading,
  anoSelecionado,
  anosDisponiveis,
  onAnoChange,
}: {
  evolucaoMensal: EvolucaoMensal[];
  evolucaoSemanal: EvolucaoSemanal[];
  utrSemanal: UtrSemanal[];
  loading: boolean;
  anoSelecionado: number;
  anosDisponiveis: number[];
  onAnoChange: (ano: number) => void;
}) {
  const [viewMode, setViewMode] = useState<'mensal' | 'semanal'>('mensal');
  const [selectedMetrics, setSelectedMetrics] = useState<Set<'ofertadas' | 'aceitas' | 'completadas' | 'rejeitadas' | 'horas' | 'utr'>>(new Set(['completadas']));
  const isSemanal = viewMode === 'semanal';

  // Ajustar métricas quando mudar o modo de visualização
  useEffect(() => {
    setSelectedMetrics(prev => {
      const newSet = new Set(prev);
      // Se estava em UTR e mudou para mensal, remover UTR
      if (viewMode === 'mensal' && newSet.has('utr')) {
        newSet.delete('utr');
        // Se não sobrou nenhuma métrica, adicionar completadas
        if (newSet.size === 0) {
          newSet.add('completadas');
        }
      }
      // Se mudou para semanal mas não tem dados de UTR e estava em UTR, remover UTR
      if (viewMode === 'semanal' && newSet.has('utr') && utrSemanal.length === 0) {
        newSet.delete('utr');
        // Se não sobrou nenhuma métrica, adicionar completadas
        if (newSet.size === 0) {
          newSet.add('completadas');
        }
      }
      return newSet;
    });
  }, [viewMode, utrSemanal.length]);
  
  // Detectar tema atual para ajustar cores do gráfico
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    // Detectar tema inicial
    const checkTheme = () => {
      if (typeof window !== 'undefined') {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
      }
    };
    
    checkTheme();
    
    // Observar mudanças no tema
    const observer = new MutationObserver(() => {
      checkTheme();
    });
    
    if (typeof window !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
    }
    
    return () => observer.disconnect();
  }, []);

  // IMPORTANTE: Todos os hooks devem ser chamados ANTES de qualquer early return
  // Gradientes vibrantes e modernos com múltiplas paradas de cor (otimizado com useCallback)
  const gradientBlue = useCallback((context: any) => {
    const chart = context.chart;
    const { ctx, chartArea } = chart;
    if (!chartArea) return 'rgba(59, 130, 246, 0.2)';
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, 'rgba(96, 165, 250, 0.5)');    // Azul vibrante mais intenso
    gradient.addColorStop(0.3, 'rgba(59, 130, 246, 0.35)'); // Azul médio
    gradient.addColorStop(0.7, 'rgba(37, 99, 235, 0.15)');  // Azul escuro suave
    gradient.addColorStop(1, 'rgba(30, 64, 175, 0.00)');    // Transparente
    return gradient;
  }, []);

  const gradientGreen = useCallback((context: any) => {
    const chart = context.chart;
    const { ctx, chartArea } = chart;
    if (!chartArea) return 'rgba(34, 197, 94, 0.2)';
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, 'rgba(74, 222, 128, 0.5)');    // Verde vibrante mais intenso
    gradient.addColorStop(0.3, 'rgba(34, 197, 94, 0.35)');  // Verde médio
    gradient.addColorStop(0.7, 'rgba(22, 163, 74, 0.15)');   // Verde escuro suave
    gradient.addColorStop(1, 'rgba(20, 83, 45, 0.00)');     // Transparente
    return gradient;
  }, []);

  const gradientPurple = useCallback((context: any) => {
    const chart = context.chart;
    const { ctx, chartArea } = chart;
    if (!chartArea) return 'rgba(168, 85, 247, 0.2)';
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, 'rgba(196, 181, 253, 0.5)');    // Roxo vibrante mais intenso
    gradient.addColorStop(0.3, 'rgba(168, 85, 247, 0.35)');  // Roxo médio
    gradient.addColorStop(0.7, 'rgba(139, 92, 246, 0.15)');   // Roxo escuro suave
    gradient.addColorStop(1, 'rgba(124, 58, 237, 0.00)');     // Transparente
    return gradient;
  }, []);

  const gradientRed = useCallback((context: any) => {
    const chart = context.chart;
    const { ctx, chartArea } = chart;
    if (!chartArea) return 'rgba(239, 68, 68, 0.2)';
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, 'rgba(248, 113, 113, 0.5)');    // Vermelho vibrante mais intenso
    gradient.addColorStop(0.3, 'rgba(239, 68, 68, 0.35)');  // Vermelho médio
    gradient.addColorStop(0.7, 'rgba(220, 38, 38, 0.15)');   // Vermelho escuro suave
    gradient.addColorStop(1, 'rgba(185, 28, 28, 0.00)');     // Transparente
    return gradient;
  }, []);

  // Memoizar conversão de segundos para horas
  const segundosParaHoras = useCallback((segundos: number): number => {
    return segundos / 3600;
  }, []);

  // Ordenar e garantir que todos os dados sejam exibidos (otimizado com useMemo)
  const dadosAtivos = useMemo(() => {
    return viewMode === 'mensal' 
      ? [...evolucaoMensal].filter(d => d.ano === anoSelecionado).sort((a, b) => {
        // Ordenar por ano e mês
        if (a.ano !== b.ano) return a.ano - b.ano;
        return a.mes - b.mes;
      })
      : [...evolucaoSemanal].filter(d => d.ano === anoSelecionado).sort((a, b) => {
        // Ordenar por ano e semana
        if (a.ano !== b.ano) return a.ano - b.ano;
        return a.semana - b.semana;
      });
  }, [viewMode, evolucaoMensal, evolucaoSemanal, anoSelecionado]);

  // Dados de UTR filtrados por ano
  const dadosUtrAtivos = useMemo(() => {
    return utrSemanal
      .filter(d => d.ano === anoSelecionado)
      .sort((a, b) => {
        if (a.ano !== b.ano) return a.ano - b.ano;
        return a.semana - b.semana;
      });
  }, [utrSemanal, anoSelecionado]);

  // Função para traduzir meses para português
  const traduzirMes = useCallback((mesNome: string): string => {
    const meses: Record<string, string> = {
      'January': 'Janeiro',
      'February': 'Fevereiro',
      'March': 'Março',
      'April': 'Abril',
      'May': 'Maio',
      'June': 'Junho',
      'July': 'Julho',
      'August': 'Agosto',
      'September': 'Setembro',
      'October': 'Outubro',
      'November': 'Novembro',
      'December': 'Dezembro',
      'January ': 'Janeiro',
      'February ': 'Fevereiro',
      'March ': 'Março',
      'April ': 'Abril',
      'May ': 'Maio',
      'June ': 'Junho',
      'July ': 'Julho',
      'August ': 'Agosto',
      'September ': 'Setembro',
      'October ': 'Outubro',
      'November ': 'Novembro',
      'December ': 'Dezembro',
    };
    return meses[mesNome] || mesNome;
  }, []);

  // Helper function para obter configuração de métrica
  const getMetricConfig = useCallback((metric: 'ofertadas' | 'aceitas' | 'completadas' | 'rejeitadas' | 'horas' | 'utr'): {
    labels: string[];
    data: number[];
    label: string;
    borderColor: string;
    backgroundColor: any;
    pointColor: string;
    yAxisID: string;
    useUtrData: boolean;
  } | null => {
    const baseLabels = viewMode === 'mensal'
      ? dadosAtivos.map(d => traduzirMes((d as EvolucaoMensal).mes_nome))
      : dadosAtivos.map(d => `S${(d as EvolucaoSemanal).semana}`);

    switch (metric) {
      case 'utr':
        if (viewMode === 'semanal' && dadosUtrAtivos.length > 0) {
          return {
            labels: dadosUtrAtivos.map(d => d.semana_label),
            data: dadosUtrAtivos.map(d => d.utr),
            label: '🎯 UTR (Taxa de Utilização)',
            borderColor: 'rgba(168, 85, 247, 1)',
            backgroundColor: gradientPurple,
            pointColor: 'rgb(168, 85, 247)',
        yAxisID: 'y',
            useUtrData: true,
          };
        }
        return null;
      case 'horas':
        return {
          labels: baseLabels,
          data: dadosAtivos.map(d => segundosParaHoras(d.total_segundos)),
          label: '⏱️ Horas Trabalhadas',
          borderColor: 'rgba(251, 146, 60, 1)', // Laranja (bem diferente do verde)
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'rgba(251, 146, 60, 0.2)';
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(253, 186, 116, 0.5)');
            gradient.addColorStop(0.3, 'rgba(251, 146, 60, 0.35)');
            gradient.addColorStop(0.7, 'rgba(234, 88, 12, 0.15)');
            gradient.addColorStop(1, 'rgba(194, 65, 12, 0.00)');
            return gradient;
          },
          pointColor: 'rgb(251, 146, 60)',
          yAxisID: 'y',
          useUtrData: false,
        };
      case 'ofertadas':
        return {
          labels: baseLabels,
          data: dadosAtivos.map(d => (d as any).corridas_ofertadas || (d as any).total_corridas || 0),
          label: '📢 Corridas Ofertadas',
          borderColor: 'rgba(14, 165, 233, 1)', // Cyan/azul claro
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'rgba(14, 165, 233, 0.2)';
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
            gradient.addColorStop(0.3, 'rgba(14, 165, 233, 0.35)');
            gradient.addColorStop(0.7, 'rgba(2, 132, 199, 0.15)');
            gradient.addColorStop(1, 'rgba(3, 105, 161, 0.00)');
            return gradient;
          },
          pointColor: 'rgb(14, 165, 233)',
          yAxisID: 'y',
          useUtrData: false,
        };
      case 'aceitas':
        return {
          labels: baseLabels,
          data: dadosAtivos.map(d => (d as any).corridas_aceitas || 0),
          label: '✅ Corridas Aceitas',
          borderColor: 'rgba(16, 185, 129, 1)', // Verde esmeralda mais vibrante
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'rgba(16, 185, 129, 0.2)';
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(52, 211, 153, 0.5)');
            gradient.addColorStop(0.3, 'rgba(16, 185, 129, 0.35)');
            gradient.addColorStop(0.7, 'rgba(5, 150, 105, 0.15)');
            gradient.addColorStop(1, 'rgba(4, 120, 87, 0.00)');
            return gradient;
          },
          pointColor: 'rgb(16, 185, 129)',
          yAxisID: 'y',
          useUtrData: false,
        };
      case 'rejeitadas':
        return {
          labels: baseLabels,
          data: dadosAtivos.map(d => (d as any).corridas_rejeitadas || 0),
          label: '❌ Corridas Rejeitadas',
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: gradientRed,
          pointColor: 'rgb(239, 68, 68)',
          yAxisID: 'y',
          useUtrData: false,
        };
      case 'completadas':
      default:
        return {
          labels: baseLabels,
          data: dadosAtivos.map(d => (d as any).corridas_completadas || (d as any).total_corridas || 0),
          label: '🚗 Corridas Completadas',
          borderColor: 'rgba(37, 99, 235, 1)', // Azul escuro
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'rgba(37, 99, 235, 0.2)';
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
            gradient.addColorStop(0.3, 'rgba(37, 99, 235, 0.35)');
            gradient.addColorStop(0.7, 'rgba(30, 64, 175, 0.15)');
            gradient.addColorStop(1, 'rgba(29, 78, 216, 0.00)');
            return gradient;
          },
          pointColor: 'rgb(37, 99, 235)',
          yAxisID: 'y',
          useUtrData: false,
        };
    }
  }, [dadosAtivos, dadosUtrAtivos, viewMode, segundosParaHoras, traduzirMes]); // Removido gradientGreen, gradientPurple, gradientRed (não são dependências)

  // Dados do gráfico com múltiplas métricas (otimizado com useMemo)
  const chartData = useMemo(() => {
    // Se não há métricas selecionadas, retornar gráfico vazio
    if (selectedMetrics.size === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    // Verificar se há dados disponíveis
    const hasData = dadosAtivos.length > 0 || dadosUtrAtivos.length > 0;
    if (!hasData) {
      return {
        labels: [],
        datasets: [],
      };
    }

    try {
      // Obter configurações para todas as métricas selecionadas
      const metricConfigs = Array.from(selectedMetrics)
        .map(metric => getMetricConfig(metric))
        .filter(config => config !== null) as Array<{
          labels: string[];
          data: number[];
          label: string;
          borderColor: string;
          backgroundColor: any;
          pointColor: string;
          yAxisID: string;
          useUtrData: boolean;
        }>;

      if (metricConfigs.length === 0) {
        return {
          labels: [],
          datasets: [],
        };
      }

      // Usar labels da primeira métrica (ou da UTR se estiver presente, pois pode ter labels diferentes)
      const utrConfig = metricConfigs.find(c => c.useUtrData);
      const baseLabels = utrConfig?.labels || metricConfigs[0].labels;

      if (!baseLabels || baseLabels.length === 0) {
        return {
          labels: [],
          datasets: [],
        };
      }

      // Criar datasets para cada métrica selecionada
      const datasets = metricConfigs.map((config) => {
        // Para UTR, usar dados próprios; para outras, alinhar com baseLabels
        let data = config.data || [];
        if (!config.useUtrData && utrConfig && baseLabels.length !== config.data.length) {
          // Se temos UTR e outras métricas, precisamos alinhar os dados
          // Mapear dados para os labels corretos
          const labelMap = new Map();
          config.labels.forEach((label, idx) => {
            labelMap.set(label, config.data[idx]);
          });
          data = baseLabels.map(label => labelMap.get(label) || 0);
        } else if (config.useUtrData && baseLabels.length !== config.data.length) {
          // Se UTR tem labels diferentes, alinhar outras métricas
          data = config.data || [];
        }

        return {
          label: config.label,
          data,
          borderColor: config.borderColor,
          backgroundColor: config.backgroundColor,
          yAxisID: config.yAxisID,
          tension: 0.5,
        cubicInterpolationMode: 'monotone' as const,
          pointRadius: isSemanal ? 5 : 7,
          pointHoverRadius: isSemanal ? 10 : 12,
          pointHitRadius: 20,
          pointBackgroundColor: config.pointColor,
        pointBorderColor: '#fff',
          pointBorderWidth: 3.5,
          pointHoverBackgroundColor: config.pointColor,
        pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 5,
          pointStyle: 'circle' as const,
          borderWidth: 3.5,
        fill: true,
        spanGaps: true,
        segment: {
          borderColor: (ctx: any) => {
              if (!ctx.p0 || !ctx.p1) return config.borderColor;
            const value0 = ctx.p0.parsed.y;
            const value1 = ctx.p1.parsed.y;
              
              // Para UTR, usar cores baseadas no valor
              if (config.useUtrData) {
                const avg = (value0 + value1) / 2;
                if (avg >= 1) return 'rgba(34, 197, 94, 1)'; // Verde para UTR >= 1
                if (avg >= 0.5) return 'rgba(251, 191, 36, 1)'; // Amarelo para UTR >= 0.5
                return 'rgba(239, 68, 68, 1)'; // Vermelho para UTR < 0.5
              }
              return config.borderColor;
          },
        },
        };
      });

      return {
        labels: baseLabels,
        datasets,
      };
    } catch (error) {
      if (IS_DEV) console.error('Erro ao criar chartData:', error);
      return {
        labels: [],
        datasets: [],
  };
    }
  }, [selectedMetrics, getMetricConfig, isSemanal, dadosAtivos.length, dadosUtrAtivos.length]);
  // Opções do gráfico otimizadas (useMemo para evitar recriação)
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 12,
        right: 16,
        bottom: 8,
        left: 12,
      },
    },
    animation: {
      duration: 300, // Animação muito mais rápida para melhor performance
      easing: 'easeOutCubic' as const, // Corrigido: easeOut não é válido, usando easeOutCubic
      delay: 0, // Sem delay para melhor performance
      // Desabilitar animação em dispositivos lentos
      ...(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? { duration: 0 } : {}),
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
      axis: 'x' as const,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'center' as const,
        labels: {
          font: {
            size: 14,
            weight: 'bold' as const,
            family: "'Inter', 'system-ui', sans-serif",
          },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 12,
          boxHeight: 12,
          color: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)',
          generateLabels: (chart: any) => {
            const datasets = chart.data.datasets;
            return datasets.map((dataset: any, i: number) => ({
              text: dataset.label,
              fillStyle: i === 0 ? 'rgb(59, 130, 246)' : 'rgb(34, 197, 94)',
              strokeStyle: i === 0 ? 'rgb(59, 130, 246)' : 'rgb(34, 197, 94)',
              lineWidth: 3,
              hidden: !chart.isDatasetVisible(i),
              index: i,
              pointStyle: 'circle',
            }));
          },
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(15, 23, 42, 0.97)',
        titleColor: 'rgba(255, 255, 255, 1)',
        bodyColor: 'rgba(226, 232, 240, 1)',
        padding: 20,
        titleFont: {
          size: 16,
          weight: 'bold' as const,
          family: "'Inter', 'system-ui', sans-serif",
        },
        bodyFont: {
          size: 15,
          weight: '600' as any,
          family: "'Inter', 'system-ui', sans-serif",
        },
        borderColor: 'rgba(148, 163, 184, 0.5)',
        borderWidth: 2,
        cornerRadius: 12,
        displayColors: true,
        boxWidth: 14,
        boxHeight: 14,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          title: function(context: any) {
            const label = context[0]?.label || '';
            const icon = isSemanal ? '📊' : '📅';
            const prefix = isSemanal ? 'Semana' : 'Mês de';
            const cleanLabel = isSemanal ? label.replace('S','') : label;
            return `${icon} ${prefix} ${cleanLabel}`;
          },
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.dataset.label.includes('Horas')) {
              const horasDecimais = context.parsed.y;
              const totalSegundos = Math.round(horasDecimais * 3600);
              label += formatarHorasParaHMS(totalSegundos / 3600);
            } else if (context.dataset.label.includes('UTR')) {
              label += context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } else if (context.dataset.label.includes('Corridas')) {
              label += context.parsed.y.toLocaleString('pt-BR') + ' corridas';
            } else {
              label += context.parsed.y.toLocaleString('pt-BR');
            }
            return label;
          },
          afterLabel: function(context: any) {
            // Adicionar variação percentual se houver dados anteriores
            const dataIndex = context.dataIndex;
            if (dataIndex > 0) {
              const currentValue = context.parsed.y;
              const previousValue = context.dataset.data[dataIndex - 1];
              if (previousValue && previousValue !== 0) {
                const variation = ((currentValue - previousValue) / previousValue * 100);
                const arrow = variation > 0 ? '📈' : variation < 0 ? '📉' : '➡️';
                const sign = variation > 0 ? '+' : '';
                return `${arrow} ${sign}${variation.toFixed(1)}% vs anterior`;
              }
            }
            return '';
          },
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
          text: selectedMetrics.size === 1 && selectedMetrics.has('utr')
            ? '🎯 UTR (Corridas/Hora)' 
            : selectedMetrics.size === 1 && selectedMetrics.has('horas')
            ? '⏱️ Horas Trabalhadas'
            : selectedMetrics.size === 1 && selectedMetrics.has('ofertadas')
            ? '📢 Corridas Ofertadas'
            : selectedMetrics.size === 1 && selectedMetrics.has('aceitas')
            ? '✅ Corridas Aceitas'
            : selectedMetrics.size === 1 && selectedMetrics.has('rejeitadas')
            ? '❌ Corridas Rejeitadas'
            : 'Métricas Selecionadas',
          font: {
            size: 13,
            weight: 'bold' as const,
            family: "'Inter', 'system-ui', sans-serif",
          },
          color: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)',
          padding: { top: 0, bottom: 8 },
        },
        grid: {
          color: (context: any) => {
            // Grid com opacidade alternada e adaptado ao tema
            if (context.tick.value === 0) return 'rgba(100, 116, 139, 0)';
            return isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.15)';
          },
          lineWidth: 1,
          drawTicks: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)',
          font: {
            size: 12,
            weight: 'bold' as const,
            family: "'Inter', 'system-ui', sans-serif",
          },
          padding: 8,
          callback: function(value: any) {
            // Se tiver UTR selecionado, formatar como decimal
            if (selectedMetrics.has('utr') && selectedMetrics.size === 1) {
              return value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
            }
            // Se tiver horas selecionado, formatar com 'h'
            if (selectedMetrics.has('horas') && selectedMetrics.size === 1) {
            return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'h';
            }
            return value.toLocaleString('pt-BR');
          }
        },
      },
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          maxTicksLimit: isSemanal ? 52 : 12, // Mostrar todas as semanas (até 52) ou todos os meses (12)
          autoSkip: dadosAtivos.length <= (isSemanal ? 52 : 12) ? false : true, // Desabilitar autoSkip se houver poucos dados
          maxRotation: isSemanal ? 45 : 0, // Permitir rotação para semanas para melhor visualização
          minRotation: isSemanal ? 45 : 0,
          font: {
            size: isSemanal ? 10 : 12, // Font menor para semanas quando houver muitos dados
            weight: '700' as any,
            family: "'Inter', 'system-ui', sans-serif",
          },
          color: isDarkMode ? 'rgb(203, 213, 225)' : 'rgb(71, 85, 105)',
          padding: 10,
        },
      },
    },
    elements: {
      line: {
        borderCapStyle: 'round' as const,
        borderJoinStyle: 'round' as const,
      },
      point: {
        hoverBorderWidth: 4,
        radius: isSemanal ? 4 : 6,
        hoverRadius: isSemanal ? 8 : 10,
      },
    },
  }), [isSemanal, dadosAtivos.length, dadosUtrAtivos.length, isDarkMode, selectedMetrics.size]); // Usar .size ao invés do objeto inteiro

  // Early return APÓS todos os hooks
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header Skeleton */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-blue-950/30">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico Skeleton */}
        <div className="relative rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/30 to-blue-50/20 p-8 shadow-xl dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/50 dark:to-blue-950/10 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="mb-6 space-y-2">
              <div className="h-7 w-56 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-4 w-80 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
            
            <div className="h-[550px] rounded-xl bg-white/50 dark:bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-400"></div>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">Carregando dados de evolução...</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Aguarde enquanto buscamos as informações</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200/50 bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-100/30 p-6 shadow-lg dark:border-slate-800/50 dark:from-slate-950/40 dark:via-slate-900/30 dark:to-slate-950/20">
              <div className="space-y-3">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-12 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-3 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
              <div className="flex flex-wrap items-center gap-3">
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

                {/* Seletor de Métricas (Múltipla Seleção) */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Métricas:</label>
                  <div className="flex flex-wrap gap-2">
                    {(['ofertadas', 'aceitas', 'completadas', 'rejeitadas', 'horas'] as const).map(metric => {
                      const labels: Record<typeof metric, string> = {
                        ofertadas: '📢 Ofertadas',
                        aceitas: '✅ Aceitas',
                        completadas: '🚗 Completadas',
                        rejeitadas: '❌ Rejeitadas',
                        horas: '⏱️ Horas',
                      };
                      const colors: Record<typeof metric, { bg: string; border: string; dot: string }> = {
                        ofertadas: { bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-300 dark:border-cyan-700', dot: 'bg-cyan-500' },
                        aceitas: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-300 dark:border-emerald-700', dot: 'bg-emerald-500' },
                        completadas: { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-300 dark:border-blue-700', dot: 'bg-blue-500' },
                        rejeitadas: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-300 dark:border-red-700', dot: 'bg-red-500' },
                        horas: { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-300 dark:border-orange-700', dot: 'bg-orange-500' },
                      };
                      const metricColors = colors[metric];
                      return (
                        <label
                          key={metric}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                            selectedMetrics.has(metric)
                              ? `${metricColors.bg} ${metricColors.border}`
                              : 'bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-700 hover:border-blue-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedMetrics.has(metric)}
                            onChange={(e) => {
                              const newSet = new Set(selectedMetrics);
                              if (e.target.checked) {
                                newSet.add(metric);
                              } else {
                                newSet.delete(metric);
                                // Garantir que pelo menos uma métrica esteja selecionada
                                if (newSet.size === 0) {
                                  newSet.add('completadas');
                                }
                              }
                              setSelectedMetrics(newSet);
                            }}
                            className={`w-4 h-4 rounded focus:ring-2 ${
                              metric === 'ofertadas' ? 'text-cyan-600 focus:ring-cyan-500' :
                              metric === 'aceitas' ? 'text-emerald-600 focus:ring-emerald-500' :
                              metric === 'completadas' ? 'text-blue-600 focus:ring-blue-500' :
                              metric === 'rejeitadas' ? 'text-red-600 focus:ring-red-500' :
                              'text-orange-600 focus:ring-orange-500'
                            }`}
                          />
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${metricColors.dot} shadow-md`}></span>
                            {labels[metric]}
                          </span>
                        </label>
                      );
                    })}
                    {viewMode === 'semanal' && (
                      <label
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                          selectedMetrics.has('utr')
                            ? 'bg-purple-50 border-purple-300 dark:bg-purple-950/30 dark:border-purple-700'
                            : 'bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-700 hover:border-purple-400'
                        } ${dadosUtrAtivos.length === 0 && utrSemanal.length === 0 ? 'opacity-50 cursor-not-allowed' : dadosUtrAtivos.length === 0 && utrSemanal.length > 0 ? 'opacity-75' : ''}`}
                        title={
                          dadosUtrAtivos.length === 0 && utrSemanal.length === 0
                            ? 'Dados de UTR não disponíveis. Verifique se a função SQL listar_utr_semanal está configurada corretamente.'
                            : dadosUtrAtivos.length === 0 && utrSemanal.length > 0
                            ? `Dados de UTR disponíveis para outros anos, mas não para ${anoSelecionado}. Anos disponíveis: ${[...new Set(utrSemanal.map(d => d.ano))].join(', ')}`
                            : `Selecionar UTR (${dadosUtrAtivos.length} semanas disponíveis)`
                        }
                      >
                        <input
                          type="checkbox"
                          checked={selectedMetrics.has('utr')}
                          disabled={dadosUtrAtivos.length === 0}
                          onChange={(e) => {
                            if (dadosUtrAtivos.length === 0) {
                              if (IS_DEV) {
                                console.warn('⚠️ Tentativa de selecionar UTR sem dados disponíveis');
                                console.warn('- Ano selecionado:', anoSelecionado);
                                console.warn('- Total UTR semanal:', utrSemanal.length);
                                console.warn('- Anos disponíveis:', [...new Set(utrSemanal.map(d => d.ano))]);
                                console.warn('- Dados filtrados:', dadosUtrAtivos.length);
                              }
                              return;
                            }
                            const newSet = new Set(selectedMetrics);
                            if (e.target.checked) {
                              newSet.add('utr');
                            } else {
                              newSet.delete('utr');
                              // Garantir que pelo menos uma métrica esteja selecionada
                              if (newSet.size === 0) {
                                newSet.add('completadas');
                              }
                            }
                            setSelectedMetrics(newSet);
                          }}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-purple-500 shadow-md"></span>
                          🎯 UTR {
                            dadosUtrAtivos.length > 0 
                              ? `(${dadosUtrAtivos.length})` 
                              : utrSemanal.length > 0 
                                ? `(sem dados para ${anoSelecionado})` 
                                : '(indisponível)'
                          }
                        </span>
                      </label>
                    )}
            </div>
          </div>
        </div>
      </div>
          </div>
        </div>
      </div>
      {/* Gráfico de Evolução - Visual Premium */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/30 to-blue-50/20 p-8 shadow-xl dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/50 dark:to-blue-950/10 overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        </div>
        
        {chartData.datasets.length > 0 && chartData.labels.length > 0 ? (
          <div className="relative z-10">
            {/* Título do gráfico */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-white text-lg shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                    📊
                  </span>
                  Evolução {selectedMetrics.size === 1 ? 'de ' + (selectedMetrics.has('utr') ? 'UTR' : selectedMetrics.has('horas') ? 'Horas Trabalhadas' : selectedMetrics.has('ofertadas') ? 'Corridas Ofertadas' : selectedMetrics.has('aceitas') ? 'Corridas Aceitas' : selectedMetrics.has('rejeitadas') ? 'Corridas Rejeitadas' : 'Corridas Completadas') : 'de Métricas'} {viewMode === 'mensal' ? 'Mensal' : 'Semanal'}
                </h4>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {selectedMetrics.has('utr') && viewMode === 'semanal' && dadosUtrAtivos.length > 0 && selectedMetrics.size === 1
                    ? `Análise detalhada de UTR por semana (${dadosUtrAtivos.length} semanas exibidas)`
                    : `Análise detalhada de ${selectedMetrics.size} ${selectedMetrics.size === 1 ? 'métrica' : 'métricas'} (${selectedMetrics.has('utr') && dadosUtrAtivos.length > 0 ? dadosUtrAtivos.length : dadosAtivos.length} ${viewMode === 'mensal' ? 'meses' : 'semanas'} exibidos)`}
                </p>
              </div>
              
              {/* Indicadores de métricas selecionadas */}
              <div className="hidden lg:flex items-center gap-2 flex-wrap">
                {selectedMetrics.has('utr') && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                    <div className="w-3 h-3 rounded-full bg-purple-500 shadow-md"></div>
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300">UTR</span>
                </div>
                )}
                {selectedMetrics.has('horas') && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-md"></div>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Horas</span>
                </div>
                )}
                {selectedMetrics.has('ofertadas') && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-md"></div>
                    <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300">Ofertadas</span>
                  </div>
                )}
                {selectedMetrics.has('aceitas') && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-md"></div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Aceitas</span>
                  </div>
                )}
                {selectedMetrics.has('completadas') && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-md"></div>
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Completadas</span>
                  </div>
                )}
                {selectedMetrics.has('horas') && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                    <div className="w-3 h-3 rounded-full bg-orange-500 shadow-md"></div>
                    <span className="text-xs font-bold text-orange-700 dark:text-orange-300">Horas</span>
                  </div>
                )}
                {selectedMetrics.has('rejeitadas') && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-md"></div>
                    <span className="text-xs font-bold text-red-700 dark:text-red-300">Rejeitadas</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Container do gráfico com altura aumentada e melhor performance */}
            <div className="relative h-[550px] rounded-xl bg-white/80 dark:bg-slate-900/80 p-6 backdrop-blur-md shadow-inner border border-slate-200/50 dark:border-slate-700/50">
              {/* Efeito de brilho sutil */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-50/50 via-blue-100/30 to-indigo-100/20 dark:from-blue-950/20 dark:via-blue-900/10 dark:to-indigo-950/10"></div>
              <div className="relative z-10 h-full w-full">
                {chartData && chartData.datasets && chartData.datasets.length > 0 && chartData.labels && chartData.labels.length > 0 ? (
                  <Line 
                    data={chartData} 
                    options={chartOptions}
                    redraw={false}
                    updateMode="none"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-slate-500 dark:text-slate-400">Preparando dados do gráfico...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex h-[500px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <span className="text-4xl">📊</span>
              </div>
              <p className="text-xl font-bold text-slate-600 dark:text-slate-300">
                Nenhum dado disponível para {anoSelecionado}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Selecione outro ano para visualizar os dados
              </p>
            </div>
          </div>
        )}
      </div>
      {/* Cards com estatísticas - Design Premium */}
      {dadosAtivos.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total de Corridas */}
          <div className="group relative rounded-2xl border border-white/20 bg-white/90 backdrop-blur-sm p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-white/30 dark:border-white/10 dark:bg-slate-900/90 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-blue-100/30 to-indigo-100/20 dark:from-blue-950/20 dark:via-blue-900/10 dark:to-indigo-950/10"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  Total de Corridas
                </p>
                <p className="mt-3 text-4xl font-black text-blue-900 dark:text-blue-100 tracking-tight">
                  {dadosAtivos.reduce((sum, d) => sum + ((d as any).corridas_completadas || (d as any).total_corridas || 0), 0).toLocaleString('pt-BR')}
                </p>
                <p className="mt-1 text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">
                  {dadosAtivos.length} {viewMode === 'mensal' ? 'meses' : 'semanas'} analisadas
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl shadow-lg group-hover:scale-110 transition-transform">
                🚗
              </div>
            </div>
          </div>

          {/* Total de Horas */}
          <div className="group relative rounded-2xl border border-white/20 bg-white/90 backdrop-blur-sm p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-white/30 dark:border-white/10 dark:bg-slate-900/90 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-emerald-100/30 to-teal-100/20 dark:from-emerald-950/20 dark:via-emerald-900/10 dark:to-teal-950/10"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Total de Horas
                </p>
                <p className="mt-3 text-4xl font-black text-emerald-900 dark:text-emerald-100 tracking-tight">
                  {formatarHorasParaHMS(dadosAtivos.reduce((sum, d) => sum + d.total_segundos, 0) / 3600)}
                </p>
                <p className="mt-1 text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium">
                  Tempo total trabalhado
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-3xl shadow-lg group-hover:scale-110 transition-transform">
                ⏱️
              </div>
            </div>
          </div>

          {/* Média de Corridas */}
          <div className="group relative rounded-2xl border border-white/20 bg-white/90 backdrop-blur-sm p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-white/30 dark:border-white/10 dark:bg-slate-900/90 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-purple-100/30 to-pink-100/20 dark:from-purple-950/20 dark:via-purple-900/10 dark:to-pink-950/10"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                  Média {viewMode === 'mensal' ? 'Mensal' : 'Semanal'}
                </p>
                <p className="mt-3 text-4xl font-black text-purple-900 dark:text-purple-100 tracking-tight">
                  {dadosAtivos.length > 0 ? (dadosAtivos.reduce((sum, d) => sum + ((d as any).corridas_completadas || (d as any).total_corridas || 0), 0) / dadosAtivos.length).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
                </p>
                <p className="mt-1 text-xs text-purple-600/70 dark:text-purple-400/70 font-medium">
                  Corridas por período
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-3xl shadow-lg group-hover:scale-110 transition-transform">
                📊
              </div>
            </div>
          </div>

          {/* Período */}
          <div className="group relative rounded-2xl border border-white/20 bg-white/90 backdrop-blur-sm p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-white/30 dark:border-white/10 dark:bg-slate-900/90 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-amber-100/30 to-orange-100/20 dark:from-amber-950/20 dark:via-amber-900/10 dark:to-orange-950/10"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Período Analisado
                </p>
                <p className="mt-3 text-4xl font-black text-amber-900 dark:text-amber-100 tracking-tight">
                  {anoSelecionado}
                </p>
                <p className="mt-1 text-xs text-amber-600/70 dark:text-amber-400/70 font-medium">
                  {dadosAtivos.length} {viewMode === 'mensal' ? 'meses' : 'semanas'} registradas
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-3xl shadow-lg group-hover:scale-110 transition-transform">
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
  // IMPORTANTE: Aceita null/undefined e retorna valor padrão
  const formatarReal = (valor: number | null | undefined) => {
    if (valor == null || isNaN(valor)) return 'R$ 0,00';
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
        if (IS_DEV) console.error('Erro ao pesquisar valores:', err);
        // Fallback para pesquisa local
        const valoresArray = Array.isArray(valoresData) ? valoresData : [];
        const filtered = valoresArray.filter(e => 
          e?.nome_entregador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e?.id_entregador?.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Usar resultados da pesquisa se houver termo de busca e resultados, senão usar dados originais
  // Usar useMemo para evitar recriação desnecessária
  // IMPORTANTE: Garantir que sempre seja um array para evitar erros de iteração
  const dataToDisplay = useMemo(() => {
    // Garantir que valoresData seja sempre um array
    const valoresArray = Array.isArray(valoresData) ? valoresData : [];
    
    if (searchTerm.trim() && Array.isArray(searchResults) && searchResults.length > 0) {
      return searchResults;
    }
    
    return valoresArray;
  }, [searchTerm, searchResults, valoresData]);

  // Criar uma cópia estável para ordenação usando useMemo para garantir que reordena quando necessário
  // IMPORTANTE: useMemo deve estar antes de qualquer early return (regras dos hooks do React)
  const sortedValores: ValoresEntregador[] = useMemo(() => {
    // Garantir que dataToDisplay seja sempre um array antes de fazer spread
    if (!Array.isArray(dataToDisplay) || dataToDisplay.length === 0) return [];
    
    // Criar uma cópia do array para não mutar o original
    const dataCopy = [...dataToDisplay];
    
    return dataCopy.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      // Tratar valores nulos/undefined - colocar no final
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      
      // Se for campo de string (nome_entregador ou id_entregador)
      if (sortField === 'nome_entregador' || sortField === 'id_entregador') {
        const aStr = String(aValue).toLowerCase().trim();
        const bStr = String(bValue).toLowerCase().trim();
        const comparison = aStr.localeCompare(bStr, 'pt-BR', { sensitivity: 'base', numeric: true });
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      // Para valores numéricos (total_taxas, numero_corridas_aceitas, taxa_media)
      // Garantir conversão correta para número
      const aNum = Number(aValue) || 0;
      const bNum = Number(bValue) || 0;
      
      // Comparação numérica precisa
      const comparison = aNum - bNum;
      
      // Se os números forem iguais, manter ordem estável usando nome como desempate
      if (comparison === 0) {
        return a.nome_entregador.localeCompare(b.nome_entregador, 'pt-BR');
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [dataToDisplay, sortField, sortDirection]);

  const handleSort = (field: keyof ValoresEntregador) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // IMPORTANTE: Todos os hooks devem estar ANTES de qualquer early return

  // Calcular estatísticas gerais
  // Garantir que dataToDisplay seja array antes de fazer reduce (otimizado com useMemo)
  const dataArray = useMemo(() => {
    return Array.isArray(dataToDisplay) ? dataToDisplay : [];
  }, [dataToDisplay]);
  
  // Calcular totais usando useMemo para evitar recálculos desnecessários
  const totalGeral = useMemo(() => {
    return dataArray.reduce((sum, e) => {
      const valor = Number(e?.total_taxas) || 0;
      return sum + valor;
    }, 0);
  }, [dataArray]);

  const totalCorridas = useMemo(() => {
    return dataArray.reduce((sum, e) => {
      const valor = Number(e?.numero_corridas_aceitas) || 0;
      return sum + valor;
    }, 0);
  }, [dataArray]);

  const taxaMediaGeral = useMemo(() => {
    return totalCorridas > 0 ? totalGeral / totalCorridas : 0;
  }, [totalGeral, totalCorridas]);

  const totalEntregadores = useMemo(() => dataArray.length, [dataArray]);

  // Função auxiliar para ícone de ordenação
  const SortIcon = ({ field }: { field: keyof ValoresEntregador }) => {
    if (sortField !== field) {
      return <span className="ml-1 text-slate-400">⇅</span>;
    }
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  // Early returns APÓS todos os hooks
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
        <MetricCard
          title="Total Geral"
          value={totalGeral}
          icon="💰"
          color="green"
        />
        <MetricCard
          title="Entregadores"
          value={totalEntregadores}
          icon="👥"
          color="blue"
        />
        <MetricCard
          title="Total Corridas"
          value={totalCorridas}
          icon="🚗"
          color="purple"
        />
        <MetricCard
          title="Taxa Média"
          value={taxaMediaGeral}
          icon="📊"
          color="red"
        />
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
              {sortedValores.map((entregador, index) => {
                // Validação de segurança: garantir que entregador existe
                if (!entregador) return null;
                
                // Garantir que o número seja sempre sequencial (ranking)
                const ranking = index + 1;
                
                // Garantir que todos os valores numéricos existam antes de usar
                // Converter para número para garantir que seja numérico
                const totalTaxas = Number(entregador.total_taxas) || 0;
                const numeroCorridas = Number(entregador.numero_corridas_aceitas) || 0;
                const taxaMedia = Number(entregador.taxa_media) || 0;
                const nomeEntregador = String(entregador.nome_entregador || entregador.id_entregador || 'N/A');
                const idEntregador = String(entregador.id_entregador || `entregador-${index}`);
                
                return (
                <tr 
                  key={`${idEntregador}-${sortField}-${sortDirection}-${ranking}`}
                  className="group transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/20"
                >
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs sm:text-sm font-bold text-white shadow-sm">
                        {ranking}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-none">{nomeEntregador}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                    <span className="inline-flex items-center rounded-lg bg-emerald-100 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-bold text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
                      {formatarReal(totalTaxas)}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                      {numeroCorridas.toLocaleString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                    <span className="inline-flex items-center rounded-lg bg-blue-100 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-blue-900 dark:bg-blue-950/50 dark:text-blue-100">
                      {formatarReal(taxaMedia)}
                    </span>
                  </td>
                </tr>
                );
              }).filter(Boolean)}
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
        if (IS_DEV) console.error('Erro ao pesquisar entregadores:', err);
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

  // Usar resultados da pesquisa se houver termo de busca e resultados, senão usar dados originais
  // Usar useMemo para evitar recriação desnecessária
  const dataToDisplay = useMemo(() => {
    const baseData = entregadoresData?.entregadores;
    const baseArray = Array.isArray(baseData) ? baseData : [];
    return (searchTerm.trim() && Array.isArray(searchResults) && searchResults.length > 0) ? searchResults : baseArray;
  }, [searchTerm, searchResults, entregadoresData]);

  // Criar uma cópia estável para ordenação usando useMemo para garantir que reordena quando necessário
  // IMPORTANTE: useMemo deve estar antes de qualquer early return (regras dos hooks do React)
  const sortedEntregadores: Entregador[] = useMemo(() => {
    if (!Array.isArray(dataToDisplay) || dataToDisplay.length === 0) return [];
    
    // Criar uma cópia do array para não mutar o original
    const dataCopy = [...dataToDisplay];
    
    return dataCopy.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      // Tratar valores nulos/undefined - colocar no final
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      
      // Se for campo de string (nome_entregador ou id_entregador)
      if (sortField === 'nome_entregador' || sortField === 'id_entregador') {
        const aStr = String(aValue).toLowerCase().trim();
        const bStr = String(bValue).toLowerCase().trim();
        const comparison = aStr.localeCompare(bStr, 'pt-BR', { sensitivity: 'base', numeric: true });
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      // Para valores numéricos (todos os outros campos)
      // Garantir conversão correta para número
      const aNum = Number(aValue) || 0;
      const bNum = Number(bValue) || 0;
      
      // Comparação numérica precisa
      const comparison = aNum - bNum;
      
      // Se os números forem iguais, manter ordem estável usando nome como desempate
      if (comparison === 0) {
        return a.nome_entregador.localeCompare(b.nome_entregador, 'pt-BR');
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [dataToDisplay, sortField, sortDirection]);

  const handleSort = (field: keyof Entregador) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

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

  if (!entregadoresData) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900 dark:bg-rose-950/30">
        <p className="text-lg font-semibold text-rose-900 dark:text-rose-100">Erro ao carregar entregadores</p>
        <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">A função pesquisar_entregadores não está disponível ou ocorreu um erro no servidor (500). Verifique os logs do banco de dados.</p>
      </div>
    );
  }

  if (entregadoresData.entregadores.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">Nenhum entregador encontrado</p>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">Tente ajustar os filtros para ver os dados.</p>
      </div>
    );
  }

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
        <MetricCard
          title="Entregadores"
          value={totalEntregadores}
          icon="👥"
          color="blue"
        />
        <MetricCard
          title="Ofertadas"
          value={totalOfertadas}
          icon="📢"
          color="purple"
        />
        <MetricCard
          title="Aceitas"
          value={totalAceitas}
          icon="✅"
          color="green"
        />
        <MetricCard
          title="Rejeitadas"
          value={totalRejeitadas}
          icon="❌"
          color="red"
        />
        <MetricCard
          title="Completadas"
          value={totalCompletadas}
          icon="🏁"
          color="cyan"
        />
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
              {sortedEntregadores.map((entregador, index) => {
                // Garantir que o número seja sempre sequencial (ranking)
                const ranking = index + 1;
                
                return (
                <tr
                  key={`${entregador.id_entregador}-${sortField}-${sortDirection}-${ranking}`}
                  className={`border-b border-blue-100 transition-colors hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/20 ${
                    ranking % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-blue-50/30 dark:bg-slate-800/30'
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
// =================================================================================
// View Prioridade/Promo
// =================================================================================

function PrioridadePromoView({
  entregadoresData,
  loading,
}: {
  entregadoresData: EntregadoresData | null;
  loading: boolean;
}) {
  const [sortField, setSortField] = useState<keyof Entregador | 'percentual_aceitas' | 'percentual_completadas'>('aderencia_percentual');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Entregador[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [filtroAderencia, setFiltroAderencia] = useState<string>('');
  const [filtroRejeicao, setFiltroRejeicao] = useState<string>('');
  const [filtroCompletadas, setFiltroCompletadas] = useState<string>('');
  const [filtroAceitas, setFiltroAceitas] = useState<string>('');

  // Funções para calcular percentuais
  const calcularPercentualAceitas = (entregador: Entregador): number => {
    const ofertadas = entregador.corridas_ofertadas || 0;
    if (ofertadas === 0) return 0;
    return (entregador.corridas_aceitas / ofertadas) * 100;
  };

  const calcularPercentualCompletadas = (entregador: Entregador): number => {
    const aceitas = entregador.corridas_aceitas || 0;
    if (aceitas === 0) return 0;
    return (entregador.corridas_completadas / aceitas) * 100;
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
        const { data, error } = await supabase.rpc('pesquisar_entregadores', {
          termo_busca: searchTerm.trim()
        });

        if (error) throw error;
        setSearchResults(data?.entregadores || []);
      } catch (err) {
        if (IS_DEV) console.error('Erro ao pesquisar entregadores:', err);
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

  // Usar resultados da pesquisa se houver termo de busca e resultados, senão usar dados originais
  // Usar useMemo para evitar recriação desnecessária
  const dataToDisplay = useMemo(() => {
    const baseData = entregadoresData?.entregadores;
    const baseArray = Array.isArray(baseData) ? baseData : [];
    return (searchTerm.trim() && Array.isArray(searchResults) && searchResults.length > 0) ? searchResults : baseArray;
  }, [searchTerm, searchResults, entregadoresData]);

  // Aplicar filtros de % de aderência, rejeição, completadas e aceitas
  const dataFiltrada = useMemo(() => {
    if (!Array.isArray(dataToDisplay)) return [];
    let filtered = [...dataToDisplay];
    
    // Filtro por % de aderência (mostrar apenas quem tem o valor ou acima)
    if (filtroAderencia.trim()) {
      const aderenciaMin = parseFloat(filtroAderencia);
      if (!isNaN(aderenciaMin)) {
        filtered = filtered.filter(e => (e.aderencia_percentual ?? 0) >= aderenciaMin);
      }
    }
    
    // Filtro por % de rejeição (mostrar apenas quem tem o valor ou abaixo)
    if (filtroRejeicao.trim()) {
      const rejeicaoMax = parseFloat(filtroRejeicao);
      if (!isNaN(rejeicaoMax)) {
        filtered = filtered.filter(e => (e.rejeicao_percentual ?? 0) <= rejeicaoMax);
      }
    }
    
    // Filtro por % de completadas (mostrar apenas quem tem o valor ou acima)
    // % completadas = (corridas_completadas / corridas_ofertadas) * 100
    if (filtroCompletadas.trim()) {
      const completadasMin = parseFloat(filtroCompletadas);
      if (!isNaN(completadasMin)) {
        filtered = filtered.filter(e => {
          const corridasOfertadas = e.corridas_ofertadas || 0;
          if (corridasOfertadas === 0) return false;
          const percentualCompletadas = (e.corridas_completadas / corridasOfertadas) * 100;
          return percentualCompletadas >= completadasMin;
        });
      }
    }
    
    // Filtro por % de aceitas (mostrar apenas quem tem o valor ou acima)
    // % aceitas = (corridas_aceitas / corridas_ofertadas) * 100
    if (filtroAceitas.trim()) {
      const aceitasMin = parseFloat(filtroAceitas);
      if (!isNaN(aceitasMin)) {
        filtered = filtered.filter(e => {
          const corridasOfertadas = e.corridas_ofertadas || 0;
          if (corridasOfertadas === 0) return false;
          const percentualAceitas = (e.corridas_aceitas / corridasOfertadas) * 100;
          return percentualAceitas >= aceitasMin;
        });
      }
    }
    
    return filtered;
  }, [dataToDisplay, filtroAderencia, filtroRejeicao, filtroCompletadas, filtroAceitas]);

  // Criar uma cópia estável para ordenação usando useMemo para garantir que reordena quando necessário
  // IMPORTANTE: useMemo deve estar antes de qualquer early return (regras dos hooks do React)
  const sortedEntregadores: Entregador[] = useMemo(() => {
    if (!dataFiltrada || dataFiltrada.length === 0) return [];
    
    // Criar uma cópia do array para não mutar o original
    const dataCopy = [...dataFiltrada];
    
    return dataCopy.sort((a, b) => {
      // Campos calculados que precisam de tratamento especial
      if (sortField === 'percentual_aceitas') {
        const aPercent = calcularPercentualAceitas(a);
        const bPercent = calcularPercentualAceitas(b);
        const comparison = aPercent - bPercent;
        if (comparison === 0) {
          return a.nome_entregador.localeCompare(b.nome_entregador, 'pt-BR');
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      if (sortField === 'percentual_completadas') {
        const aPercent = calcularPercentualCompletadas(a);
        const bPercent = calcularPercentualCompletadas(b);
        const comparison = aPercent - bPercent;
        if (comparison === 0) {
          return a.nome_entregador.localeCompare(b.nome_entregador, 'pt-BR');
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      const aValue = a[sortField as keyof Entregador];
      const bValue = b[sortField as keyof Entregador];
      
      // Tratar valores nulos/undefined - colocar no final
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      
      // Se for campo de string (nome_entregador ou id_entregador)
      if (sortField === 'nome_entregador' || sortField === 'id_entregador') {
        const aStr = String(aValue).toLowerCase().trim();
        const bStr = String(bValue).toLowerCase().trim();
        const comparison = aStr.localeCompare(bStr, 'pt-BR', { sensitivity: 'base', numeric: true });
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      // Para valores numéricos (todos os outros campos)
      // Garantir conversão correta para número
    const aNum = Number(aValue) || 0;
    const bNum = Number(bValue) || 0;
      
      // Comparação numérica precisa
      const comparison = aNum - bNum;
      
      // Se os números forem iguais, manter ordem estável usando nome como desempate
      if (comparison === 0) {
        return a.nome_entregador.localeCompare(b.nome_entregador, 'pt-BR');
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [dataFiltrada, sortField, sortDirection]);

  const handleSort = (field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field as keyof Entregador | 'percentual_aceitas' | 'percentual_completadas');
      setSortDirection('desc');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-lg font-semibold text-blue-700 dark:text-blue-200">Carregando dados de prioridade...</p>
        </div>
      </div>
    );
  }

  if (!entregadoresData) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900 dark:bg-rose-950/30">
        <p className="text-lg font-semibold text-rose-900 dark:text-rose-100">Erro ao carregar dados de prioridade</p>
        <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">A função pesquisar_entregadores não está disponível ou ocorreu um erro no servidor (500). Verifique os logs do banco de dados.</p>
      </div>
    );
  }

  if (entregadoresData.entregadores.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">Nenhum entregador encontrado</p>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">Tente ajustar os filtros para ver os dados.</p>
      </div>
    );
  }

  const SortIcon = ({ field }: { field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas' }) => {
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

  // Funções para colorir percentuais de aceitas e completadas
  const getAceitasColor = (percentual: number) => {
    if (percentual >= 90) return 'text-emerald-700 dark:text-emerald-400';
    if (percentual >= 70) return 'text-amber-700 dark:text-amber-400';
    return 'text-rose-700 dark:text-rose-400';
  };

  const getAceitasBg = (percentual: number) => {
    if (percentual >= 90) return 'bg-emerald-50 dark:bg-emerald-950/30';
    if (percentual >= 70) return 'bg-amber-50 dark:bg-amber-950/30';
    return 'bg-rose-50 dark:bg-rose-950/30';
  };

  const getCompletadasColor = (percentual: number) => {
    if (percentual >= 95) return 'text-emerald-700 dark:text-emerald-400';
    if (percentual >= 80) return 'text-amber-700 dark:text-amber-400';
    return 'text-rose-700 dark:text-rose-400';
  };

  const getCompletadasBg = (percentual: number) => {
    if (percentual >= 95) return 'bg-emerald-50 dark:bg-emerald-950/30';
    if (percentual >= 80) return 'bg-amber-50 dark:bg-amber-950/30';
    return 'bg-rose-50 dark:bg-rose-950/30';
  };

  // Calcular estatísticas gerais com base nos dados filtrados
  const totalOfertadas = dataFiltrada.reduce((sum, e) => sum + e.corridas_ofertadas, 0);
  const totalAceitas = dataFiltrada.reduce((sum, e) => sum + e.corridas_aceitas, 0);
  const totalRejeitadas = dataFiltrada.reduce((sum, e) => sum + e.corridas_rejeitadas, 0);
  const totalCompletadas = dataFiltrada.reduce((sum, e) => sum + e.corridas_completadas, 0);
  const totalEntregadores = dataFiltrada.length;
  const aderenciaMedia = totalEntregadores > 0 ? dataFiltrada.reduce((sum, e) => sum + e.aderencia_percentual, 0) / totalEntregadores : 0;
  const rejeicaoMedia = totalEntregadores > 0 ? dataFiltrada.reduce((sum, e) => sum + e.rejeicao_percentual, 0) / totalEntregadores : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filtros de % de Aderência, Rejeição, Completadas e Aceitas */}
      <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-lg dark:border-purple-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              % Aderência Mínima
            </label>
            <input
              type="number"
              placeholder="Ex: 90"
              value={filtroAderencia}
              onChange={(e) => setFiltroAderencia(e.target.value)}
              min="0"
              max="100"
              step="0.1"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Este % ou acima</p>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              % Rejeição Máxima
            </label>
            <input
              type="number"
              placeholder="Ex: 10"
              value={filtroRejeicao}
              onChange={(e) => setFiltroRejeicao(e.target.value)}
              min="0"
              max="100"
              step="0.1"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Este % ou abaixo</p>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              % Completadas Mínima
            </label>
            <input
              type="number"
              placeholder="Ex: 80"
              value={filtroCompletadas}
              onChange={(e) => setFiltroCompletadas(e.target.value)}
              min="0"
              max="100"
              step="0.1"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Este % ou acima</p>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              % Aceitas Mínima
            </label>
            <input
              type="number"
              placeholder="Ex: 85"
              value={filtroAceitas}
              onChange={(e) => setFiltroAceitas(e.target.value)}
              min="0"
              max="100"
              step="0.1"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Este % ou acima</p>
          </div>
        </div>
        {(filtroAderencia || filtroRejeicao || filtroCompletadas || filtroAceitas) && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                setFiltroAderencia('');
                setFiltroRejeicao('');
                setFiltroCompletadas('');
                setFiltroAceitas('');
              }}
              className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
            >
              ✕ Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

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
        <MetricCard
          title="Entregadores"
          value={totalEntregadores}
          icon="👥"
          color="blue"
        />
        <MetricCard
          title="Ofertadas"
          value={totalOfertadas}
          icon="📢"
          color="purple"
        />
        <MetricCard
          title="Aceitas"
          value={totalAceitas}
          icon="✅"
          color="green"
        />
        <MetricCard
          title="Rejeitadas"
          value={totalRejeitadas}
          icon="❌"
          color="red"
        />
        <MetricCard
          title="Completadas"
          value={totalCompletadas}
          icon="🏁"
          color="cyan"
        />
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
                  onClick={() => handleSort('percentual_aceitas')}
                >
                  % Aceitas <SortIcon field="percentual_aceitas" />
                </th>
                <th 
                  className="cursor-pointer px-6 py-4 text-center text-sm font-bold text-blue-900 transition-colors hover:bg-blue-100 dark:text-blue-100 dark:hover:bg-blue-900/50"
                  onClick={() => handleSort('corridas_completadas')}
                >
                  Completadas <SortIcon field="corridas_completadas" />
                </th>
                <th 
                  className="cursor-pointer px-6 py-4 text-center text-sm font-bold text-blue-900 transition-colors hover:bg-blue-100 dark:text-blue-100 dark:hover:bg-blue-900/50"
                  onClick={() => handleSort('percentual_completadas')}
                >
                  % Completadas <SortIcon field="percentual_completadas" />
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
              {sortedEntregadores.map((entregador, index) => {
                // Garantir que o número seja sempre sequencial (ranking)
                const ranking = index + 1;
                const percentualAceitas = calcularPercentualAceitas(entregador);
                const percentualCompletadas = calcularPercentualCompletadas(entregador);
                
                return (
                <tr
                  key={`${entregador.id_entregador}-${sortField}-${sortDirection}-${ranking}`}
                  className={`border-b border-blue-100 transition-colors hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/20 ${
                    ranking % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-blue-50/30 dark:bg-slate-800/30'
                  }`}
                >
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{entregador.nome_entregador}</td>
                  <td className="px-6 py-4 text-center text-slate-700 dark:text-slate-300">{entregador.corridas_ofertadas}</td>
                  <td className="px-6 py-4 text-center text-emerald-700 dark:text-emerald-400">{entregador.corridas_aceitas}</td>
                  <td className="px-6 py-4 text-center text-rose-700 dark:text-rose-400">{entregador.corridas_rejeitadas}</td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 ${getAceitasBg(percentualAceitas)}`}>
                      <span className={`text-lg font-bold ${getAceitasColor(percentualAceitas)}`}>
                        {percentualAceitas.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-blue-700 dark:text-blue-400">{entregador.corridas_completadas}</td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 ${getCompletadasBg(percentualCompletadas)}`}>
                      <span className={`text-lg font-bold ${getCompletadasColor(percentualCompletadas)}`}>
                        {percentualCompletadas.toFixed(2)}%
                      </span>
                    </div>
                  </td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
// =================================================================================

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analise' | 'comparacao' | 'utr' | 'entregadores' | 'valores' | 'evolucao' | 'monitoramento' | 'prioridade'>('dashboard');
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`);
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
  const [turnos, setTurnos] = useState<FilterOption[]>([]);
  // Armazenar dimensões originais completas para sempre manter todas as opções disponíveis
  const [dimensoesOriginais, setDimensoesOriginais] = useState<DimensoesDashboard | null>(null);
  const [filters, setFilters] = useState<Filters>({ ano: null, semana: null, praca: null, subPraca: null, origem: null, turno: null, subPracas: [], origens: [], turnos: [], semanas: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [currentUser, setCurrentUser] = useState<{ is_admin: boolean; assigned_pracas: string[] } | null>(null);
  const [utrData, setUtrData] = useState<UtrData | null>(null);
  const [loadingUtr, setLoadingUtr] = useState(false);
  const [entregadoresData, setEntregadoresData] = useState<EntregadoresData | null>(null);
  const [loadingEntregadores, setLoadingEntregadores] = useState(false);
  const [prioridadeData, setPrioridadeData] = useState<EntregadoresData | null>(null);
  const [loadingPrioridade, setLoadingPrioridade] = useState(false);
  const [valoresData, setValoresData] = useState<ValoresEntregador[]>([]);
  const [loadingValores, setLoadingValores] = useState(false);
  const [evolucaoMensal, setEvolucaoMensal] = useState<EvolucaoMensal[]>([]);
  const [evolucaoSemanal, setEvolucaoSemanal] = useState<EvolucaoSemanal[]>([]);
  const [utrSemanal, setUtrSemanal] = useState<UtrSemanal[]>([]);
  const [loadingUtrSemanal, setLoadingUtrSemanal] = useState(false);
  const [loadingEvolucao, setLoadingEvolucao] = useState(false);
  const [anoEvolucao, setAnoEvolucao] = useState<number>(new Date().getFullYear());

  const aderenciaGeral = useMemo(() => {
    if (aderenciaSemanal.length === 0) return undefined;
    
    // Se houver apenas uma semana, retornar ela
    if (aderenciaSemanal.length === 1) {
      if (IS_DEV) console.log('🎯 Aderência Geral (1 semana):', aderenciaSemanal[0]);
      return aderenciaSemanal[0];
    }
    
    // Se houver múltiplas semanas, calcular a soma total
    // Otimizar: fazer em um único reduce
    const { totalHorasAEntregar, totalHorasEntregues } = aderenciaSemanal.reduce(
      (acc, semana) => ({
        totalHorasAEntregar: acc.totalHorasAEntregar + parseFloat(semana.horas_a_entregar || '0'),
        totalHorasEntregues: acc.totalHorasEntregues + parseFloat(semana.horas_entregues || '0')
      }),
      { totalHorasAEntregar: 0, totalHorasEntregues: 0 }
    );
    
    const aderenciaPercentual = totalHorasAEntregar > 0 
      ? (totalHorasEntregues / totalHorasAEntregar) * 100 
      : 0;
    
    const resultado = {
      semana: 'Geral',
      horas_a_entregar: totalHorasAEntregar.toFixed(2),
      horas_entregues: totalHorasEntregues.toFixed(2),
      aderencia_percentual: aderenciaPercentual
    };
    
    if (IS_DEV) {
    console.log('🎯 Aderência Geral (múltiplas semanas):', resultado);
    console.log('📋 Detalhamento:', {
      qtdSemanas: aderenciaSemanal.length,
      totalHorasAEntregar,
      totalHorasEntregues,
      aderenciaPercentual
    });
    }
    
    return resultado;
  }, [aderenciaSemanal]);

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
        valores: 'Valores',
        prioridade: 'Prioridade/Promo',
        evolucao: 'Evolução',
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
          if (filtersApplied.turno) filtros.push(`Turno: ${filtersApplied.turno}`);
          
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
        if (IS_DEV) console.error('Erro ao registrar atividade:', error);
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
          
          // Para admin: não carregar dados imediatamente se não estiver nas abas que precisam
          // Para não-admin: carregar dados normalmente (será feito pelo useEffect que monitora filters)
          // Não precisamos fazer nada aqui, o useEffect que monitora activeTab e filters cuidará disso
        }
      } catch (err) {
        if (IS_DEV) console.error('Erro ao buscar perfil do usuário:', err);
        setLoading(false);
      }
    }

    checkUserAndFetchData();
  }, []);
  // Cache simples para evitar recarregar dados iguais
  const cacheKeyRef = useRef<string>('');
  const cachedDataRef = useRef<DashboardResumoData | null>(null);
  const evolucaoCacheRef = useRef<Map<string, { mensal: EvolucaoMensal[]; semanal: EvolucaoSemanal[]; utrSemanal: UtrSemanal[] }>>(new Map());
  const dashboardDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastFilterPayloadRef = useRef<string>('');

  // Memoizar buildFilterPayload para evitar recálculos desnecessários
  // IMPORTANTE: Deve estar ANTES dos useEffects que o utilizam
  const filterPayload = useMemo(() => {
    const payload = buildFilterPayload(filters);
    // Criar uma chave de cache baseada no payload
    const payloadKey = JSON.stringify(payload);
    lastFilterPayloadRef.current = payloadKey;
    return payload;
  }, [filters]);

  // Buscar anos disponíveis ao carregar
  useEffect(() => {
    const fetchAnosDisponiveis = async () => {
      try {
        const { data, error } = await supabase.rpc('listar_anos_disponiveis');
        if (error) {
          throw error;
        }
        setAnosDisponiveis(data || []);
      } catch (err) {
        if (IS_DEV) {
        console.error('Erro ao buscar anos disponíveis:', err);
        }
        setAnosDisponiveis([new Date().getFullYear()]);
      }
    };
    fetchAnosDisponiveis();
  }, []);

  // Buscar dados principais do Dashboard (totais e aderências) com debounce e cache
  useEffect(() => {
    // Limpar debounce anterior
    if (dashboardDebounceRef.current) {
      clearTimeout(dashboardDebounceRef.current);
    }

    // Criar chave de cache
    const payloadKey = JSON.stringify(filterPayload);
    
    // Verificar cache
    if (cacheKeyRef.current === payloadKey && cachedDataRef.current) {
      const cached = cachedDataRef.current;
      setTotals({
        ofertadas: safeNumber(cached.totais?.corridas_ofertadas ?? 0),
        aceitas: safeNumber(cached.totais?.corridas_aceitas ?? 0),
        rejeitadas: safeNumber(cached.totais?.corridas_rejeitadas ?? 0),
        completadas: safeNumber(cached.totais?.corridas_completadas ?? 0),
      });
      setAderenciaSemanal(Array.isArray(cached.semanal) ? cached.semanal : []);
      setAderenciaDia(Array.isArray(cached.dia) ? cached.dia : []);
      setAderenciaTurno(Array.isArray(cached.turno) ? cached.turno : []);
      setAderenciaSubPraca(Array.isArray(cached.sub_praca) ? cached.sub_praca : []);
      setAderenciaOrigem(Array.isArray(cached.origem) ? cached.origem : []);
      return;
    }

    let isCancelled = false;
    
    // Debounce de 300ms para evitar múltiplas chamadas rápidas
    dashboardDebounceRef.current = setTimeout(async () => {
      const fetchDashboard = async () => {
        try {
          setLoading(true);
          setError(null);

          // Remover chaves nulas para evitar erros no RPC
          const payloadClean = Object.fromEntries(
            Object.entries(filterPayload as any).filter(([, v]) => v !== null && v !== undefined && v !== '')
          );

          const { data, error } = await supabase.rpc('dashboard_resumo', payloadClean as any);
          if (error) throw error;

          if (isCancelled) return;

          const safeData: DashboardResumoData | null = data || null;

          if (safeData) {
            // Atualizar cache
            cacheKeyRef.current = payloadKey;
            cachedDataRef.current = safeData;

            setTotals({
              ofertadas: safeNumber(safeData.totais?.corridas_ofertadas ?? 0),
              aceitas: safeNumber(safeData.totais?.corridas_aceitas ?? 0),
              rejeitadas: safeNumber(safeData.totais?.corridas_rejeitadas ?? 0),
              completadas: safeNumber(safeData.totais?.corridas_completadas ?? 0),
            });

            setAderenciaSemanal(Array.isArray(safeData.semanal) ? safeData.semanal : []);
            setAderenciaDia(Array.isArray(safeData.dia) ? safeData.dia : []);
            setAderenciaTurno(Array.isArray(safeData.turno) ? safeData.turno : []);
            setAderenciaSubPraca(Array.isArray(safeData.sub_praca) ? safeData.sub_praca : []);
            setAderenciaOrigem(Array.isArray(safeData.origem) ? safeData.origem : []);

            // Dimensões disponíveis para filtros (quando vierem do backend)
            if (safeData.dimensoes) {
              setPracas(Array.isArray(safeData.dimensoes.pracas) ? safeData.dimensoes.pracas.map((p: any) => ({ value: String(p), label: String(p) })) : []);
              setSubPracas(Array.isArray(safeData.dimensoes.sub_pracas) ? safeData.dimensoes.sub_pracas.map((p: any) => ({ value: String(p), label: String(p) })) : []);
              setOrigens(Array.isArray(safeData.dimensoes.origens) ? safeData.dimensoes.origens.map((p: any) => ({ value: String(p), label: String(p) })) : []);
              if (Array.isArray((safeData.dimensoes as any).turnos)) {
                setTurnos((safeData.dimensoes as any).turnos.map((t: any) => ({ value: String(t), label: String(t) })));
              }
            }
          } else {
            setTotals({ ofertadas: 0, aceitas: 0, rejeitadas: 0, completadas: 0 });
            setAderenciaSemanal([]);
            setAderenciaDia([]);
            setAderenciaTurno([]);
            setAderenciaSubPraca([]);
            setAderenciaOrigem([]);
          }
        } catch (err: any) {
          if (!isCancelled) {
            if (IS_DEV) console.error('Erro ao carregar dashboard_resumo:', err);
            setError('Não foi possível carregar os dados do dashboard.');
          }
        } finally {
          if (!isCancelled) setLoading(false);
        }
      };

      await fetchDashboard();
    }, 300);

    return () => {
      isCancelled = true;
      if (dashboardDebounceRef.current) {
        clearTimeout(dashboardDebounceRef.current);
      }
    };
  }, [filterPayload]);

  // Buscar dados de Evolução quando a aba estiver ativa (com debounce e cache)
  // Removido - agora carregado no useEffect específico abaixo

  // Carregar UTR (aba UTR) - apenas quando a aba estiver ativa
  useEffect(() => {
    if (activeTab !== 'utr') return;
    
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingUtr(true);
        const payloadClean = Object.fromEntries(
          Object.entries(filterPayload as any).filter(([, v]) => v !== null && v !== undefined && v !== '')
        );
        const { data, error } = await supabase.rpc('calcular_utr', payloadClean as any);
        if (error) throw error;
        if (!cancelled) setUtrData(data as UtrData);
      } catch (err) {
        if (IS_DEV) console.error('Erro ao carregar UTR:', err);
        if (!cancelled) setUtrData(null);
      } finally {
        if (!cancelled) setLoadingUtr(false);
      }
    };
    
    // Pequeno delay para evitar carregamentos simultâneos
    const timeoutId = setTimeout(load, 100);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [activeTab, filterPayload]);

  // Carregar Entregadores (aba Entregadores) - apenas quando a aba estiver ativa
  useEffect(() => {
    if (activeTab !== 'entregadores') return;
    
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingEntregadores(true);
        // Tentar com termo_busca null primeiro, se falhar tenta com string vazia
        let data, error;
        ({ data, error } = await supabase.rpc('pesquisar_entregadores', { termo_busca: null }));
        if (error && error.code === '42883') {
          // Função não existe, tentar com string vazia
          ({ data, error } = await supabase.rpc('pesquisar_entregadores', { termo_busca: '' }));
        }
        if (error) {
          // Se ainda der erro, pode ser que a função precise de filtros ou tenha outro nome
          if (IS_DEV) console.warn('Erro ao carregar entregadores:', error);
          throw error;
        }
        if (!cancelled) {
          // A RPC pode retornar um array direto ou um objeto com entregadores
          const entregadores = Array.isArray(data) ? data : (data?.entregadores || []);
          setEntregadoresData({ entregadores: Array.isArray(entregadores) ? entregadores : [], total: Array.isArray(entregadores) ? entregadores.length : 0 });
        }
      } catch (err: any) {
        if (IS_DEV) console.error('Erro ao carregar entregadores:', err);
        // Se for erro 500, pode ser problema no SQL, mas não mostrar erro genérico
        if (!cancelled) {
          // Manter dados vazios mas não mostrar erro se for problema de função não encontrada
          if (err?.code !== '42883' && err?.code !== 'PGRST116') {
            setEntregadoresData({ entregadores: [], total: 0 });
          } else {
            // Função não existe, deixar null para mostrar mensagem apropriada
            setEntregadoresData(null);
          }
        }
      } finally {
        if (!cancelled) setLoadingEntregadores(false);
      }
    };
    
    // Pequeno delay para evitar carregamentos simultâneos
    const timeoutId = setTimeout(load, 150);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [activeTab]);

  // Carregar Valores (aba Valores) - apenas quando a aba estiver ativa
  useEffect(() => {
    if (activeTab !== 'valores') return;
    
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingValores(true);
        let data, error;
        ({ data, error } = await supabase.rpc('pesquisar_valores_entregadores', { termo_busca: null }));
        if (error && error.code === '42883') {
          ({ data, error } = await supabase.rpc('pesquisar_valores_entregadores', { termo_busca: '' }));
        }
        if (error) {
          if (IS_DEV) console.warn('Erro ao carregar valores:', error);
          throw error;
        }
        if (!cancelled) setValoresData(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (IS_DEV) console.error('Erro ao carregar valores:', err);
        if (!cancelled) {
          // Para erro 500, manter array vazio (problema no SQL)
          // Para função não encontrada, manter array vazio também
          setValoresData([]);
        }
      } finally {
        if (!cancelled) setLoadingValores(false);
      }
    };
    
    // Pequeno delay para evitar carregamentos simultâneos
    const timeoutId = setTimeout(load, 200);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [activeTab]);

  // Carregar dados de Evolução (aba Evolução) - apenas quando a aba estiver ativa
  useEffect(() => {
    if (activeTab !== 'evolucao') return;
    
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingEvolucao(true);
        const payloadClean = Object.fromEntries(
          Object.entries(filterPayload as any).filter(([, v]) => v !== null && v !== undefined && v !== '')
        );
        const payloadMensal = { ...payloadClean, p_ano: payloadClean['p_ano'] ?? anoEvolucao } as any;
        
        // Tentar carregar evolução mensal (pode não existir)
        let evoMensal: any[] = [];
        let evoSemanal: any[] = [];
        let utrSem: any[] = [];
        
        const { data: dataMensal, error: errMensal } = await supabase.rpc('listar_evolucao_mensal', payloadMensal);
        if (errMensal) {
          if (errMensal.code === '42883' || errMensal.code === 'PGRST116') {
            // Função não existe, ignorar
            if (IS_DEV) console.warn('Função listar_evolucao_mensal não encontrada');
          } else {
            throw errMensal;
          }
        } else {
          evoMensal = Array.isArray(dataMensal) ? dataMensal : [];
        }
        
        const { data: dataSemanal, error: errSemanal } = await supabase.rpc('listar_evolucao_semanal', payloadMensal);
        if (errSemanal) {
          if (errSemanal.code === '42883' || errSemanal.code === 'PGRST116') {
            if (IS_DEV) console.warn('Função listar_evolucao_semanal não encontrada');
          } else {
            throw errSemanal;
          }
        } else {
          evoSemanal = Array.isArray(dataSemanal) ? dataSemanal : [];
        }
        
        const { data: dataUtrSem, error: errUtrSem } = await supabase.rpc('listar_utr_semanal', { p_ano: payloadMensal.p_ano });
        if (errUtrSem) {
          // Se a função não existir, apenas ignore os dados de UTR semanal
          if (errUtrSem.code !== '42883' && errUtrSem.code !== 'PGRST116') {
            if (IS_DEV) console.warn('Erro ao carregar UTR semanal:', errUtrSem);
          }
        } else {
          utrSem = Array.isArray(dataUtrSem) ? dataUtrSem : [];
        }
        
        if (!cancelled) {
          // Salvar no cache
          const cacheKey = `${JSON.stringify(filterPayload)}-${anoEvolucao}`;
          evolucaoCacheRef.current.set(cacheKey, {
            mensal: evoMensal,
            semanal: evoSemanal,
            utrSemanal: utrSem
          });
          
          setEvolucaoMensal(evoMensal);
          setEvolucaoSemanal(evoSemanal);
          setUtrSemanal(utrSem);
        }
      } catch (err) {
        if (IS_DEV) console.error('Erro ao carregar evolução:', err);
        if (!cancelled) {
          setEvolucaoMensal([]);
          setEvolucaoSemanal([]);
          setUtrSemanal([]);
        }
      } finally {
        if (!cancelled) setLoadingEvolucao(false);
      }
    };
    
    // Verificar cache primeiro
    const cacheKey = `${JSON.stringify(filterPayload)}-${anoEvolucao}`;
    const cached = evolucaoCacheRef.current.get(cacheKey);
    if (cached) {
      setEvolucaoMensal(cached.mensal);
      setEvolucaoSemanal(cached.semanal);
      setUtrSemanal(cached.utrSemanal);
      setLoadingEvolucao(false);
      return;
    }
    
    // Pequeno delay para evitar carregamentos simultâneos
    const timeoutId = setTimeout(load, 250);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [activeTab, filterPayload, anoEvolucao]);

  // Carregar dados de Prioridade (aba Prioridade/Promo) - apenas quando a aba estiver ativa
  useEffect(() => {
    if (activeTab !== 'prioridade') return;
    
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingPrioridade(true);
        let data, error;
        ({ data, error } = await supabase.rpc('pesquisar_entregadores', { termo_busca: null }));
        if (error && error.code === '42883') {
          ({ data, error } = await supabase.rpc('pesquisar_entregadores', { termo_busca: '' }));
        }
        if (error) {
          if (IS_DEV) console.warn('Erro ao carregar prioridade:', error);
          throw error;
        }
        if (!cancelled) {
          // A RPC pode retornar um array direto ou um objeto com entregadores
          const entregadores = Array.isArray(data) ? data : (data?.entregadores || []);
          setPrioridadeData({ entregadores: Array.isArray(entregadores) ? entregadores : [], total: Array.isArray(entregadores) ? entregadores.length : 0 });
        }
      } catch (err: any) {
        if (IS_DEV) console.error('Erro ao carregar prioridade/promo:', err);
        if (!cancelled) {
          if (err?.code !== '42883' && err?.code !== 'PGRST116') {
            setPrioridadeData({ entregadores: [], total: 0 });
          } else {
            setPrioridadeData(null);
          }
        }
      } finally {
        if (!cancelled) setLoadingPrioridade(false);
      }
    };
    
    // Pequeno delay para evitar carregamentos simultâneos
    const timeoutId = setTimeout(load, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [activeTab]);
  // Buscar semanas disponíveis ao carregar
  useEffect(() => {
    const fetchSemanasDisponiveis = async () => {
      try {
        const { data, error } = await supabase.rpc('listar_todas_semanas');
        if (error) {
          throw error;
        }
        // Converter para array de strings se necessário
        const semanas = Array.isArray(data) ? data.map(s => String(s)) : [];
        setSemanasDisponiveis(semanas);
      } catch (err) {
        if (IS_DEV) {
          console.error('Erro ao buscar semanas disponíveis:', err);
        }
        setSemanasDisponiveis([]);
      }
    };
    fetchSemanasDisponiveis();
  }, []);
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1920px] px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header Principal Redesenhado */}
        <header className="mb-4 sm:mb-6 lg:mb-8 animate-fade-in">
          <div className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:shadow-3xl dark:border-white/10 dark:bg-slate-900/80">
            {/* Glow effect */}
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 opacity-0 blur-xl transition-opacity group-hover:opacity-100"></div>
            
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
            
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 lg:gap-5 p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 min-w-0 flex-1">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-lg ring-2 ring-white/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <span className="text-3xl sm:text-3xl lg:text-4xl">📊</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent dark:from-white dark:via-blue-200 dark:to-indigo-200 truncate">
                    Dashboard Operacional
                  </h1>
                  <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm lg:text-base font-semibold text-slate-600 dark:text-slate-400 truncate">
                    Sistema de Análise e Monitoramento em Tempo Real
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-4 lg:gap-5 shrink-0">
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Última atualização</p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg ring-2 ring-emerald-500/20">
                  <div className="absolute inset-0 rounded-xl bg-emerald-400/50 animate-ping"></div>
                  <span className="relative text-xl sm:text-2xl">🟢</span>
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

        {!loading && !error && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            {/* Header com filtros e tabs */}
            <div className="group relative rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl p-4 sm:p-5 lg:p-7 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-white/30 dark:border-white/10 dark:bg-slate-900/80 animate-slide-down" style={{ position: 'relative', zIndex: 1 }}>
              {/* Subtle glow */}
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 opacity-0 blur-xl transition-opacity group-hover:opacity-100"></div>
              <div className="relative" style={{ position: 'relative', zIndex: 1 }}>
              {activeTab !== 'comparacao' && (
                <>
                  <div className="relative" style={{ isolation: 'isolate', zIndex: 99999, position: 'relative' }}>
                  <FiltroBar
                    filters={filters}
                    setFilters={setFilters}
                    anos={anosDisponiveis}
                    semanas={semanasDisponiveis}
                    pracas={pracas}
                    subPracas={subPracas}
                    origens={origens}
                    turnos={turnos}
                    currentUser={currentUser}
                  />
                  </div>
                  <div className="my-3 sm:my-4 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent dark:via-blue-700" style={{ position: 'relative', zIndex: 1 }}></div>
                </>
              )}
              {/* Tabs com scroll horizontal em mobile */}
              <div className="relative" style={{ zIndex: 1, position: 'relative' }}>
                <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-transparent">
                  <TabButton label="Dashboard" icon="📊" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                  <TabButton label="Análise" icon="📈" active={activeTab === 'analise'} onClick={() => setActiveTab('analise')} />
                  <TabButton label="Comparação" icon="⚖️" active={activeTab === 'comparacao'} onClick={() => setActiveTab('comparacao')} />
                  <TabButton label="UTR" icon="📏" active={activeTab === 'utr'} onClick={() => setActiveTab('utr')} />
                  <TabButton label="Entregadores" icon="👥" active={activeTab === 'entregadores'} onClick={() => setActiveTab('entregadores')} />
                  <TabButton label="Valores" icon="💰" active={activeTab === 'valores'} onClick={() => setActiveTab('valores')} />
                  <TabButton label="Prioridade/Promo" icon="⭐" active={activeTab === 'prioridade'} onClick={() => setActiveTab('prioridade')} />
                  <TabButton label="Evolução" icon="📉" active={activeTab === 'evolucao'} onClick={() => setActiveTab('evolucao')} />
                  {currentUser?.is_admin && (
                    <TabButton label="Monitor" icon="🔍" active={activeTab === 'monitoramento'} onClick={() => setActiveTab('monitoramento')} />
                  )}
                </div>
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
                  totals={totals ?? { ofertadas: 0, aceitas: 0, rejeitadas: 0, completadas: 0 }} 
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
              
              {activeTab === 'prioridade' && (
                <PrioridadePromoView
                  entregadoresData={prioridadeData}
                  loading={loadingPrioridade}
                />
              )}
              
              {activeTab === 'evolucao' && (
                <EvolucaoView
                  evolucaoMensal={evolucaoMensal}
                  evolucaoSemanal={evolucaoSemanal}
                  utrSemanal={utrSemanal}
                  loading={loadingEvolucao}
                  anoSelecionado={anoEvolucao}
                  anosDisponiveis={anosDisponiveis}
                  onAnoChange={setAnoEvolucao}
                />
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}