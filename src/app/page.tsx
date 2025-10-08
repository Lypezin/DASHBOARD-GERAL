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
  map_sub_praca?: { [key: string]: string[] };
};

interface DashboardResumoData {
  totais?: {
    corridas_ofertadas?: number;
    corridas_aceitas?: number;
    corridas_rejeitadas?: number;
    corridas_completadas?: number;
  };
  semanal?: AderenciaSemanal[];
  dia?: AderenciaDia[];
  turno?: AderenciaTurno[];
  sub_praca?: AderenciaSubPraca[];
  origem?: AderenciaOrigem[];
  dimensoes?: DimensoesDashboard;
}

// =================================================================================
// Definições de Props para os componentes
// =================================================================================

interface TabButtonProps {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}

interface DashboardViewProps {
  aderenciaGeral?: AderenciaSemanal;
  aderenciaSemanal: AderenciaSemanal[];
  aderenciaDia: AderenciaDia[];
  aderenciaTurno: AderenciaTurno[];
  aderenciaSubPraca: AderenciaSubPraca[];
  aderenciaOrigem: AderenciaOrigem[];
}

interface AnaliseViewProps {
  totals: Totals;
  aderenciaGeral?: AderenciaSemanal;
  aderenciaSemanal: AderenciaSemanal[];
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

interface FiltroSelectProps {
  label: string;
  placeholder: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string | null) => void;
}


// =================================================================================
// Funções Utilitárias
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


// =================================================================================
// Componentes de UI reutilizáveis (movidos para cima)
// =================================================================================

function TabButton({ label, icon, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? 'bg-white text-blue-600 shadow-md dark:bg-slate-800 dark:text-blue-200'
          : 'text-blue-500 hover:bg-white/60 dark:text-blue-300 dark:hover:bg-slate-800/50'
      }`}
    >
      {icon} {label}
    </button>
  );
}

function AderenciaGeralCard({ aderenciaGeral }: { aderenciaGeral?: AderenciaSemanal }) {
  return (
    <section className="flex flex-col rounded-2xl border border-blue-200 bg-white/90 p-6 shadow-lg backdrop-blur dark:border-blue-800 dark:bg-slate-900/80">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl text-white shadow-md">🎯</div>
        <div>
          <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100">Aderência Geral</h2>
          <p className="text-sm text-blue-600 dark:text-blue-300">Última semana calculada</p>
        </div>
      </header>
      <div className="mt-5 flex flex-1 flex-col justify-center gap-6">
        {aderenciaGeral ? (
          <>
            <div className="flex items-center justify-center">
              <Gauge percentual={aderenciaGeral.aderencia_percentual} size="lg" />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
  );
}

function DestaquesCard({ aderenciaDia, aderenciaTurno }: { aderenciaDia: AderenciaDia[]; aderenciaTurno: AderenciaTurno[] }) {
  const melhorDia = aderenciaDia.length > 0 ? aderenciaDia.reduce((prev, curr) => (curr.aderencia_percentual > prev.aderencia_percentual ? curr : prev)) : null;
  const piorDia = aderenciaDia.length > 0 ? aderenciaDia.reduce((prev, curr) => (curr.aderencia_percentual < prev.aderencia_percentual ? curr : prev)) : null;
  const melhorTurno = aderenciaTurno.length > 0 ? aderenciaTurno.reduce((prev, curr) => (curr.aderencia_percentual > prev.aderencia_percentual ? curr : prev)) : null;

  return (
    <section className="flex flex-col rounded-2xl border border-blue-200 bg-white/90 p-6 shadow-lg backdrop-blur dark:border-blue-800 dark:bg-slate-900/80">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl text-white shadow-md">🔍</div>
        <div>
          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">Destaques da Operação</h3>
          <p className="text-sm text-blue-600 dark:text-blue-300">Pontos chave do período</p>
        </div>
      </header>
      <div className="mt-5 flex flex-1 flex-col justify-center gap-4">
        <HighlightItem titulo="Melhor dia" valor={melhorDia?.dia_da_semana ?? 'N/D'} percentual={melhorDia?.aderencia_percentual} />
        <HighlightItem titulo="Maior desafio" valor={piorDia?.dia_da_semana ?? 'N/D'} percentual={piorDia?.aderencia_percentual} invert />
        <HighlightItem titulo="Turno destaque" valor={melhorTurno?.periodo ?? 'N/D'} percentual={melhorTurno?.aderencia_percentual} />
      </div>
    </section>
  );
}

function AderenciaDiaCard({ aderenciaDia }: { aderenciaDia: AderenciaDia[] }) {
  return (
    <section className="flex flex-col rounded-2xl border border-blue-200 bg-white/90 p-6 shadow-lg backdrop-blur dark:border-blue-800 dark:bg-slate-900/80">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl text-white shadow-md">📅</div>
        <div>
          <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100">Aderência por Dia</h2>
          <p className="text-sm text-blue-600 dark:text-blue-300">Comparativo da semana</p>
        </div>
      </header>
      <div className="mt-5 flex flex-1 items-stretch">
        {aderenciaDia.length === 0 ? (
          <EmptyState message="Ainda não existem dados por dia." />
        ) : (
          <div className="grid flex-1 grid-cols-7 gap-4">
            {aderenciaDia.map((dia) => (
              <DayCard key={dia.dia_iso} dia={dia} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function VisualizacoesAdicionais({ aderenciaTurno, aderenciaSubPraca, aderenciaOrigem }: { aderenciaTurno: AderenciaTurno[]; aderenciaSubPraca: AderenciaSubPraca[]; aderenciaOrigem: AderenciaOrigem[] }) {
  const [viewMode, setViewMode] = useState<'turno' | 'sub_praca' | 'origem'>('turno');

  return (
    <section className="flex flex-col rounded-2xl border border-blue-200 bg-white/90 p-6 shadow-lg backdrop-blur dark:border-blue-800 dark:bg-slate-900/80">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">Recortes de Aderência</h3>
          <p className="text-sm text-blue-600 dark:text-blue-300">Explore diferentes visualizações</p>
        </div>
        <div className="flex gap-2 rounded-xl bg-blue-100 p-1 dark:bg-blue-900/50">
          {[
            { key: 'turno', label: 'Turnos', icon: '⏰' },
            { key: 'sub_praca', label: 'Sub Praças', icon: '🏢' },
            { key: 'origem', label: 'Origem', icon: '🌐' },
          ].map((mode) => (
            <button
              key={mode.key}
              onClick={() => setViewMode(mode.key as typeof viewMode)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === mode.key
                  ? 'bg-white text-blue-600 shadow-md dark:bg-slate-800 dark:text-blue-200'
                  : 'text-blue-500 hover:bg-white/60 dark:text-blue-300 dark:hover:bg-slate-800/50'
              }`}
            >
              {mode.icon} {mode.label}
            </button>
          ))}
        </div>
      </header>
      <div className="mt-5 flex flex-1 items-stretch">
        {viewMode === 'turno' && (
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            {aderenciaTurno.length === 0 ? <EmptyState message="Sem dados por turno." /> : aderenciaTurno.map((turno) => <CompactMetric key={turno.periodo} title={turno.periodo} direita={turno.horas_entregues} esquerda={turno.horas_a_entregar} percentual={turno.aderencia_percentual} />)}
          </div>
        )}
        {viewMode === 'sub_praca' && (
          <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-4">
            {aderenciaSubPraca.length === 0 ? <EmptyState message="Sem dados por sub praça." /> : aderenciaSubPraca.map((sub) => <MiniGauge key={sub.sub_praca} titulo={sub.sub_praca} percentual={sub.aderencia_percentual} />)}
          </div>
        )}
        {viewMode === 'origem' && (
          <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-4">
            {aderenciaOrigem.length === 0 ? <EmptyState message="Sem dados por origem." /> : aderenciaOrigem.map((origem) => <MiniGauge key={origem.origem} titulo={origem.origem} percentual={origem.aderencia_percentual} />)}
          </div>
        )}
      </div>
    </section>
  );
}

function DashboardView({
  aderenciaGeral,
  aderenciaSemanal,
  aderenciaDia,
  aderenciaTurno,
  aderenciaSubPraca,
  aderenciaOrigem,
}: Omit<DashboardViewProps, 'viewMode' | 'setViewMode'>) {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Coluna Esquerda */}
      <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
        <AderenciaGeralCard aderenciaGeral={aderenciaGeral} />
        <DestaquesCard aderenciaDia={aderenciaDia} aderenciaTurno={aderenciaTurno} />
      </div>

      {/* Coluna Direita */}
      <div className="col-span-12 flex flex-col gap-6 lg:col-span-8">
        <AderenciaDiaCard aderenciaDia={aderenciaDia} />
        <VisualizacoesAdicionais
          aderenciaTurno={aderenciaTurno}
          aderenciaSubPraca={aderenciaSubPraca}
          aderenciaOrigem={aderenciaOrigem}
        />
      </div>
    </div>
  );
}

function AnaliseView({ totals, aderenciaGeral, aderenciaSemanal }: AnaliseViewProps) {
  const taxaAceitacao = totals.ofertadas > 0 ? (totals.aceitas / totals.ofertadas) * 100 : 0;
  const taxaCompletude = totals.aceitas > 0 ? (totals.completadas / totals.aceitas) * 100 : 0;

  const metricas = [
    { titulo: 'Corridas Ofertadas', valor: totals.ofertadas, icon: '🎯', cor: 'bg-blue-600' },
    { titulo: 'Corridas Aceitas', valor: totals.aceitas, icon: '✅', cor: 'bg-blue-500' },
    { titulo: 'Corridas Rejeitadas', valor: totals.rejeitadas, icon: '❌', cor: 'bg-blue-400' },
    { titulo: 'Corridas Completadas', valor: totals.completadas, icon: '🏆', cor: 'bg-blue-700' },
  ];

  return (
    <div className="grid grid-cols-12 grid-rows-2 gap-6">
      {metricas.map((metrica) => (
        <article key={metrica.titulo} className="col-span-12 flex flex-col justify-between rounded-2xl border border-blue-200 bg-white/90 p-5 shadow-lg backdrop-blur transition-transform hover:-translate-y-1 dark:border-blue-800 dark:bg-slate-900/80 sm:col-span-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${metrica.cor} text-xl text-white shadow-md`}>{metrica.icon}</div>
            <span className="text-3xl font-bold text-blue-900 dark:text-blue-100">{metrica.valor.toLocaleString('pt-BR')}</span>
          </div>
          <h3 className="mt-5 text-base font-semibold text-blue-800 dark:text-blue-200">{metrica.titulo}</h3>
        </article>
      ))}

      <article className="col-span-12 flex flex-col rounded-2xl border border-blue-200 bg-white/90 p-6 shadow-lg backdrop-blur dark:border-blue-800 dark:bg-slate-900/80 lg:col-span-4">
        <header className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl text-white shadow-md">📊</div>
          <div>
            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">Taxa de Aceitação</h3>
            <p className="text-sm text-blue-600 dark:text-blue-300">Aceitas vs. Ofertadas</p>
          </div>
        </header>
        <div className="mt-6 flex flex-1 items-center justify-center">
          <Gauge percentual={taxaAceitacao} size="lg" />
        </div>
      </article>

      <article className="col-span-12 flex flex-col rounded-2xl border border-blue-200 bg-white/90 p-6 shadow-lg backdrop-blur dark:border-blue-800 dark:bg-slate-900/80 lg:col-span-4">
        <header className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl text-white shadow-md">🎯</div>
          <div>
            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">Taxa de Completude</h3>
            <p className="text-sm text-blue-600 dark:text-blue-300">Completadas vs. Aceitas</p>
          </div>
        </header>
        <div className="mt-6 flex flex-1 items-center justify-center">
          <Gauge percentual={taxaCompletude} size="lg" />
        </div>
      </article>

      <article className="col-span-12 flex flex-col rounded-2xl border border-blue-200 bg-white/90 p-6 shadow-lg backdrop-blur dark:border-blue-800 dark:bg-slate-900/80 lg:col-span-4">
        <header className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl text-white shadow-md">📈</div>
          <div>
            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">Resumo Operacional</h3>
            <p className="text-sm text-blue-600 dark:text-blue-300">Indicadores chave</p>
          </div>
        </header>
        <div className="mt-5 grid flex-1 grid-cols-2 gap-4">
          <SummaryCard title="Resposta" value={(totals.ofertadas > 0 ? ((totals.aceitas + totals.rejeitadas) / totals.ofertadas) * 100 : 0).toFixed(1) + '%'} subtitle="Ações sobre corridas" />
          <SummaryCard title="Eficiência" value={(totals.ofertadas > 0 ? (totals.completadas / totals.ofertadas) * 100 : 0).toFixed(1) + '%'} subtitle="Completadas vs. ofertadas" />
          <SummaryCard title="Aderência Média" value={(aderenciaSemanal.slice(0, 4).reduce((acc, semana) => acc + semana.aderencia_percentual, 0) / Math.max(aderenciaSemanal.slice(0, 4).length, 1)).toFixed(1) + '%'} subtitle="Últimas 4 semanas" />
          <SummaryCard title="Aderência Atual" value={`${aderenciaGeral ? aderenciaGeral.aderencia_percentual.toFixed(1) : '0.0'}%`} subtitle={aderenciaGeral ? aderenciaGeral.semana : 'N/D'} />
        </div>
      </article>
    </div>
  );
}

// =================================================================================
// Componentes Auxiliares Refinados
// =================================================================================

function MetricChip({ label, value, accent }: { label: string; value: string; accent: 'primary' | 'secondary' }) {
  const accentClasses = accent === 'primary' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-200' : 'bg-blue-200 text-blue-900 dark:bg-blue-800/80 dark:text-blue-300';
  return (
    <div className={`rounded-lg p-3 text-center transition-transform hover:scale-105 ${accentClasses}`}>
      <p className="text-xs font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function SummaryCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="flex flex-col justify-center rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-center transition-transform hover:-translate-y-1 dark:border-blue-800 dark:bg-blue-900/50">
      <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">{title}</p>
      <p className="text-[11px] text-blue-600 dark:text-blue-400">{subtitle}</p>
    </div>
  );
}

function HighlightItem({ titulo, valor, percentual, invert }: { titulo: string; valor: string; percentual?: number; invert?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 transition-shadow hover:shadow-md dark:border-blue-800 dark:bg-blue-900/50">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">{titulo}</p>
        <p className="text-base font-bold text-blue-900 dark:text-blue-100">{valor}</p>
      </div>
      {percentual !== undefined && <Badge value={percentual} size="md" emphasis={invert ? 'low' : 'high'} />}
    </div>
  );
}

function DayCard({ dia }: { dia: AderenciaDia }) {
  return (
    <div className="flex flex-col justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-center shadow-sm transition-transform hover:-translate-y-1 dark:border-blue-800 dark:bg-blue-900/60">
      <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">{dia.dia_da_semana}</p>
      <div className="flex flex-1 items-center justify-center">
        <Gauge percentual={dia.aderencia_percentual} size="sm" />
      </div>
      <Badge value={dia.aderencia_percentual} size="sm" />
    </div>
  );
}

function CompactMetric({ title, esquerda, direita, percentual }: { title: string; esquerda: string; direita: string; percentual: number }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50/80 p-4 shadow-sm transition-shadow hover:shadow-md dark:border-blue-800 dark:bg-blue-900/60">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-blue-800 dark:text-blue-200">{title}</p>
        <Badge value={percentual} size="md" />
      </div>
      <div className="grid grid-cols-2 gap-2 text-center text-xs text-blue-700 dark:text-blue-200">
        <div className="rounded-lg bg-blue-100/70 p-2 dark:bg-blue-900/60">
          <span className="font-bold">{esquerda}</span> <span className="text-blue-600 dark:text-blue-400">Plan.</span>
        </div>
        <div className="rounded-lg bg-blue-100/70 p-2 dark:bg-blue-900/60">
          <span className="font-bold">{direita}</span> <span className="text-blue-600 dark:text-blue-400">Entr.</span>
        </div>
      </div>
    </div>
  );
}

function MiniGauge({ titulo, percentual }: { titulo: string; percentual: number }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-center shadow-sm transition-shadow hover:shadow-md dark:border-blue-800 dark:bg-blue-900/60">
      <p className="w-full truncate text-xs font-semibold uppercase tracking-wide text-blue-800 dark:text-blue-200">{titulo}</p>
      <Gauge percentual={percentual} size="xs" />
      <Badge value={percentual} size="sm" />
    </div>
  );
}

function Gauge({ percentual, size = 'md' }: { percentual: number; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const clamped = Math.min(Math.max(percentual, 0), 100);
  const config = {
    xs: { radius: 22, stroke: 4.5, font: '11px' },
    sm: { radius: 30, stroke: 6, font: '12px' },
    md: { radius: 40, stroke: 7, font: '14px' },
    lg: { radius: 60, stroke: 9, font: '18px' },
  }[size];
  const circumference = 2 * Math.PI * config.radius;
  const offset = circumference * (1 - clamped / 100);

  const color = clamped >= 85 ? '#1e3a8a' : clamped >= 70 ? '#1d4ed8' : clamped >= 55 ? '#2563eb' : '#60a5fa';

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
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ color, fontSize: config.font }} className="font-bold">
          {clamped.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function Badge({ value, size = 'md', emphasis = 'high' }: { value: number; size?: 'sm' | 'md' | 'lg'; emphasis?: 'high' | 'low' }) {
  let base = 'bg-blue-200 text-blue-800 dark:bg-blue-800/50 dark:text-blue-300';
  if (value >= 85) base = 'bg-blue-700 text-white dark:bg-blue-600';
  else if (value >= 70) base = 'bg-blue-600 text-white dark:bg-blue-500';
  else if (value >= 55) base = 'bg-blue-500 text-white dark:bg-blue-400';
  else if (value < 55 && emphasis === 'low') base = 'bg-red-200 text-red-800 dark:bg-red-800/50 dark:text-red-300';

  const padding = size === 'lg' ? 'px-4 py-1.5 text-sm' : size === 'md' ? 'px-3 py-1 text-xs' : 'px-2.5 py-1 text-[11px]';

  return <span className={`inline-flex items-center rounded-full font-bold transition-colors ${base} ${padding}`}>{value.toFixed(1)}%</span>;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center text-center text-sm text-blue-600 dark:text-blue-300">
      <div className="text-3xl">📊</div>
      <p className="mt-2 font-semibold">{message}</p>
    </div>
  );
}

function FiltroBar({ filters, setFilters, anos, semanas, pracas, subPracas, origens }: FiltroBarProps) {
  const handleChange = (key: keyof Filters, rawValue: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: rawValue === '' || rawValue === null ? null : key === 'ano' || key === 'semana' ? Number(rawValue) : rawValue,
    }));
  };

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      <FiltroSelect label="Ano" value={filters.ano !== null ? String(filters.ano) : ''} options={anos.map((ano) => ({ value: String(ano), label: String(ano) }))} placeholder="Todos" onChange={(value) => handleChange('ano', value)} />
      <FiltroSelect label="Semana" value={filters.semana !== null ? String(filters.semana) : ''} options={semanas.map((sem) => ({ value: String(sem), label: `S${sem.toString().padStart(2, '0')}` }))} placeholder="Todas" onChange={(value) => handleChange('semana', value)} />
      <FiltroSelect label="Praça" value={filters.praca ?? ''} options={pracas} placeholder="Todas" onChange={(value) => handleChange('praca', value)} />
      <FiltroSelect label="Sub praça" value={filters.subPraca ?? ''} options={subPracas} placeholder="Todas" onChange={(value) => handleChange('subPraca', value)} />
      <FiltroSelect label="Origem" value={filters.origem ?? ''} options={origens} placeholder="Todas" onChange={(value) => handleChange('origem', value)} />
    </div>
  );
}

function FiltroSelect({ label, placeholder, options, value, onChange }: FiltroSelectProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">{label}</span>
      <select
        className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-800 shadow-sm transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-blue-700 dark:bg-slate-800 dark:text-blue-100 dark:focus:border-blue-500 dark:focus:ring-blue-800/50"
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

// =================================================================================
// Componente Principal da Página
// =================================================================================

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
  const abortRef = useRef<AbortController | null>(null);

  const aderenciaGeral = useMemo(() => aderenciaSemanal[0], [aderenciaSemanal]);

  useEffect(() => {
    async function fetchData() {
    setLoading(true);
    setError(null);

    const params = buildFilterPayload(filters);

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    try {
      const response = await supabase.rpc('dashboard_resumo', params, {
        signal: controller.signal,
      });

      if (response.error) {
        throw response.error;
      }

      const resumoData = response.data as DashboardResumoData | null;

      const safeNumber = (value: number | string | null | undefined) => (value === null || value === undefined ? 0 : Number(value));

      const totalsRow = resumoData?.totais;
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

      setAderenciaSemanal(resumoData?.semanal ?? []);
      setAderenciaDia(resumoData?.dia ?? []);
      setAderenciaTurno(resumoData?.turno ?? []);
      setAderenciaSubPraca(resumoData?.sub_praca ?? []);
      setAderenciaOrigem(resumoData?.origem ?? []);

      const dimensoes = resumoData?.dimensoes;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-6 py-8">
        {loading && (
          <div className="flex h-[80vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-14 w-14 animate-spin rounded-full border-4 border-blue-200"></div>
                <div className="absolute inset-0 h-14 w-14 animate-spin rounded-full border-t-4 border-blue-600"></div>
              </div>
              <p className="font-semibold text-blue-700 dark:text-blue-200">Carregando dados do dashboard...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex h-[80vh] items-center justify-center">
            <div className="max-w-lg rounded-2xl border border-blue-200 bg-white px-8 py-6 text-center shadow-xl dark:border-blue-700 dark:bg-slate-900">
              <div className="text-5xl">⚠️</div>
              <p className="mt-4 text-xl font-bold text-blue-800 dark:text-blue-200">Não foi possível carregar os dados</p>
              <p className="mt-2 text-blue-600 dark:text-blue-300">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {totals && !loading && !error && (
          <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-4 rounded-2xl border border-blue-200 bg-white/80 p-5 shadow-lg backdrop-blur dark:border-blue-800 dark:bg-slate-900/70">
              <FiltroBar
                filters={filters}
                setFilters={setFilters}
                anos={anosDisponiveis}
                semanas={semanasDisponiveis}
                pracas={pracas}
                subPracas={subPracas}
                origens={origens}
              />
              <div className="h-px w-full bg-blue-200 dark:bg-blue-800"></div>
              <div className="flex items-center gap-3">
                <TabButton label="Dashboard" icon="📊" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <TabButton label="Análise Detalhada" icon="📈" active={activeTab === 'analise'} onClick={() => setActiveTab('analise')} />
              </div>
            </header>

            <main className="transition-all duration-300">
              {activeTab === 'dashboard' && (
                <DashboardView
                  aderenciaGeral={aderenciaGeral}
                  aderenciaSemanal={aderenciaSemanal}
                  aderenciaDia={aderenciaDia}
                  aderenciaTurno={aderenciaTurno}
                  aderenciaSubPraca={aderenciaSubPraca}
                  aderenciaOrigem={aderenciaOrigem}
                />
              )}
              {activeTab === 'analise' && <AnaliseView totals={totals} aderenciaGeral={aderenciaGeral} aderenciaSemanal={aderenciaSemanal} />}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}