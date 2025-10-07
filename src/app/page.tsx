"use client";

import { useEffect, useMemo, useState } from 'react';
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

interface FilterOption {
  value: string;
  label: string;
}

interface Filters {
  ano: number | null;
  semana: number | null;
  praca: string | null;
  subPraca: string | null;
}

export default function DashboardPage() {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [aderenciaSemanal, setAderenciaSemanal] = useState<AderenciaSemanal[]>([]);
  const [aderenciaDia, setAderenciaDia] = useState<AderenciaDia[]>([]);
  const [aderenciaTurno, setAderenciaTurno] = useState<AderenciaTurno[]>([]);
  const [aderenciaSubPraca, setAderenciaSubPraca] = useState<AderenciaSubPraca[]>([]);
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [semanasDisponiveis, setSemanasDisponiveis] = useState<number[]>([]);
  const [pracas, setPracas] = useState<FilterOption[]>([]);
  const [subPracas, setSubPracas] = useState<FilterOption[]>([]);
  const [filters, setFilters] = useState<Filters>({ ano: null, semana: null, praca: null, subPraca: null });
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
        const safeNumber = (value: number | string | null | undefined) =>
          value === null || value === undefined ? 0 : Number(value);

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

      const [semanal, porDia, porTurno, porSubPraca, filtrosDisponiveis] = await Promise.all([
        supabase.rpc('calcular_aderencia_semanal', params),
        supabase.rpc('calcular_aderencia_por_dia', params),
        supabase.rpc('calcular_aderencia_por_turno', params),
        supabase.rpc('calcular_aderencia_por_sub_praca', params),
        supabase.rpc('listar_dimensoes_dashboard'),
      ]);

      if (semanal.error) {
        console.error('Erro ao buscar aderência semanal:', semanal.error);
        setAderenciaSemanal([]);
      } else {
        setAderenciaSemanal((semanal.data as AderenciaSemanal[]) || []);
      }

      if (porDia.error) {
        console.error('Erro ao buscar aderência por dia:', porDia.error);
        setAderenciaDia([]);
      } else {
        setAderenciaDia((porDia.data as AderenciaDia[]) || []);
      }

      if (porTurno.error) {
        console.error('Erro ao buscar aderência por turno:', porTurno.error);
        setAderenciaTurno([]);
      } else {
        setAderenciaTurno((porTurno.data as AderenciaTurno[]) || []);
      }

      if (porSubPraca.error) {
        console.error('Erro ao buscar aderência por sub praça:', porSubPraca.error);
        setAderenciaSubPraca([]);
      } else {
        setAderenciaSubPraca((porSubPraca.data as AderenciaSubPraca[]) || []);
      }

      if (!filtrosDisponiveis.error && filtrosDisponiveis.data) {
        const { anos, semanas, pracas: pracasData, sub_pracas: subPracasData } = filtrosDisponiveis.data as any;
        setAnosDisponiveis(anos || []);
        setSemanasDisponiveis(semanas || []);
        setPracas((pracasData || []).map((p: string) => ({ value: p, label: p })));
        setSubPracas((subPracasData || []).map((sp: string) => ({ value: sp, label: sp })));
      }

      setLoading(false);
    }

    fetchData();
  }, [filters]);

  return (
    <div className="container mx-auto space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Dashboard de Aderência Operacional</h1>
        <p className="text-sm text-gray-500">Visão consolidada semelhante a um relatório Power BI</p>
      </header>

      {loading && <p>Carregando dados...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {totals && !loading && !error && (
        <>
          <FiltroBar
            filters={filters}
            setFilters={setFilters}
            anos={anosDisponiveis}
            semanas={semanasDisponiveis}
            pracas={pracas}
            subPracas={subPracas}
          />
          <ResumoCards totals={totals} aderenciaAtual={aderenciaGeral?.aderencia_percentual} />
          <AderenciaOverview
            aderenciaSemanal={aderenciaSemanal}
            aderenciaDia={aderenciaDia}
            aderenciaTurno={aderenciaTurno}
            aderenciaSubPraca={aderenciaSubPraca}
          />
        </>
      )}
    </div>
  );
}

function ResumoCards({ totals, aderenciaAtual }: { totals: Totals; aderenciaAtual?: number }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <ResumoCard titulo="Corridas ofertadas" valor={totals.ofertadas} subtitulo="Total do período" />
      <ResumoCard titulo="Corridas aceitas" valor={totals.aceitas} subtitulo="Entregadores" />
      <ResumoCard titulo="Corridas rejeitadas" valor={totals.rejeitadas} subtitulo="Total" />
      <ResumoCard titulo="Corridas completadas" valor={totals.completadas} subtitulo="Finalizadas" />
      <ResumoCard
        titulo="Aderência geral"
        valor={aderenciaAtual ?? 0}
        subtitulo="Semana atual"
        formato="percentual"
      />
    </section>
  );
}

function ResumoCard({ titulo, valor, subtitulo, formato }: { titulo: string; valor: number; subtitulo: string; formato?: 'percentual' }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-900/40 shadow-sm rounded-xl p-5 flex flex-col gap-2">
      <span className="text-xs uppercase tracking-wide text-blue-600 font-semibold">{titulo}</span>
      <span className="text-2xl font-bold text-gray-900 dark:text-gray-50">
        {formato === 'percentual' ? `${valor.toFixed(1)}%` : valor.toLocaleString('pt-BR')}
      </span>
      <span className="text-xs text-gray-400 uppercase">{subtitulo}</span>
    </div>
  );
}

interface AderenciaOverviewProps {
  aderenciaSemanal: AderenciaSemanal[];
  aderenciaDia: AderenciaDia[];
  aderenciaTurno: AderenciaTurno[];
  aderenciaSubPraca: AderenciaSubPraca[];
}

function AderenciaOverview({ aderenciaSemanal, aderenciaDia, aderenciaTurno, aderenciaSubPraca }: AderenciaOverviewProps) {
  const semanaAtual = aderenciaSemanal[0];

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-blue-100 dark:border-blue-900/40 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Aderência geral</h2>
            <p className="text-sm text-gray-500">Semana mais recente</p>
          </div>

          {semanaAtual ? (
            <div className="flex flex-col items-center mt-6 space-y-4">
              <Gauge percentual={semanaAtual.aderencia_percentual} size="large" />
              <ResumoHoras titulo="Horas a entregar" valor={semanaAtual.horas_a_entregar} cor="text-blue-600" />
              <ResumoHoras titulo="Horas entregues" valor={semanaAtual.horas_entregues} cor="text-green-600" />
              <Badge value={semanaAtual.aderencia_percentual} />
            </div>
          ) : (
            <EmptyState message="Sem dados de aderência semanal." />
          )}
        </div>

        <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-blue-100 dark:border-blue-900/40 p-6">
          <header className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Histórico semanal</h3>
              <p className="text-sm text-gray-500">Últimas 10 semanas acompanhadas</p>
            </div>
          </header>

          {aderenciaSemanal.length === 0 ? (
            <EmptyState message="Sem dados históricos de aderência." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <TableHeader text="Semana" />
                    <TableHeader text="Horas a entregar" />
                    <TableHeader text="Horas entregues" />
                    <TableHeader text="Aderência" />
                    <TableHeader text="Status" />
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                  {aderenciaSemanal.slice(0, 10).map((semana) => (
                    <tr key={semana.semana}>
                      <TableCell text={semana.semana} bold />
                      <TableCell text={semana.horas_a_entregar} />
                      <TableCell text={semana.horas_entregues} />
                      <TableCell text={`${semana.aderencia_percentual}%`} />
                      <TableCell>
                        <Badge value={semana.aderencia_percentual} />
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-blue-100 dark:border-blue-900/40 p-6">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Aderência por dia da semana</h3>
            <p className="text-sm text-gray-500">Consolidado do período carregado</p>
          </div>
        </header>

        {aderenciaDia.length === 0 ? (
          <EmptyState message="Sem dados de aderência por dia." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {aderenciaDia.map((dia) => (
              <CardDia key={dia.dia_iso} dia={dia} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-blue-100 dark:border-blue-900/40 p-6">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Aderência por turno</h3>
            <p className="text-sm text-gray-500">Comparativo entre períodos operacionais</p>
          </div>
        </header>

        {aderenciaTurno.length === 0 ? (
          <EmptyState message="Sem dados de aderência por turno." />
        ) : (
          <div className="space-y-4">
            {aderenciaTurno.map((turno) => (
              <CardTurno key={turno.periodo} turno={turno} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-blue-100 dark:border-blue-900/40 p-6">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Aderência por sub praça</h3>
            <p className="text-sm text-gray-500">Comportamento por hubs locais</p>
          </div>
        </header>

        {aderenciaSubPraca.length === 0 ? (
          <EmptyState message="Sem dados de aderência por sub praça." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {aderenciaSubPraca.map((sub) => (
              <CardSubPraca key={sub.sub_praca} subPraca={sub} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CardDia({ dia }: { dia: AderenciaDia }) {
  return (
    <div className="bg-gradient-to-b from-blue-50 via-white to-white dark:from-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-900/40 p-4 text-center shadow-sm space-y-3">
      <div className="text-xs uppercase tracking-wider text-blue-700 font-semibold">{dia.dia_da_semana}</div>
      <Gauge percentual={dia.aderencia_percentual} size="small" />
      <div className="space-y-1">
        <ResumoHoras titulo="Horas a entregar" valor={dia.horas_a_entregar} cor="text-blue-600" tamanho="sm" />
        <ResumoHoras titulo="Entregues" valor={dia.horas_entregues} cor="text-green-600" tamanho="sm" />
      </div>
      <Badge value={dia.aderencia_percentual} />
    </div>
  );
}

function CardTurno({ turno }: { turno: AderenciaTurno }) {
  return (
    <div className="border border-blue-100 dark:border-blue-900/40 rounded-lg p-4 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">{turno.periodo}</p>
          <p className="text-xs text-gray-500">{turno.horas_a_entregar} planejadas • {turno.horas_entregues} entregues</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-28">
            <Gauge percentual={turno.aderencia_percentual} thickness="thin" />
          </div>
          <Badge value={turno.aderencia_percentual} />
        </div>
      </div>
      <div className="mt-3 h-2 w-full bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
        <div
          className={`h-full ${turno.aderencia_percentual >= 80 ? 'bg-green-500' : turno.aderencia_percentual >= 60 ? 'bg-yellow-400' : 'bg-red-500'}`}
          style={{ width: `${Math.min(turno.aderencia_percentual, 100)}%` }}
        />
      </div>
    </div>
  );
}

function CardSubPraca({ subPraca }: { subPraca: AderenciaSubPraca }) {
  return (
    <div className="border border-blue-100 dark:border-blue-900/40 rounded-lg p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">{subPraca.sub_praca}</p>
          <p className="text-xs text-gray-500">{subPraca.horas_a_entregar} planejadas • {subPraca.horas_entregues} entregues</p>
        </div>
        <Badge value={subPraca.aderencia_percentual} />
      </div>
      <Gauge percentual={subPraca.aderencia_percentual} thickness="thin" />
    </div>
  );
}

function Gauge({ percentual, size = 'medium', thickness = 'normal' }: { percentual: number; size?: 'small' | 'medium' | 'large'; thickness?: 'normal' | 'thin' }) {
  const clamped = Math.max(0, Math.min(percentual, 100));
  const radius = size === 'large' ? 70 : size === 'small' ? 40 : 56;
  const strokeWidth = thickness === 'thin' ? 8 : 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const color = clamped >= 80 ? '#10b981' : clamped >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: radius * 2, height: radius * 2 }}>
      <svg className="transform -rotate-90" width={radius * 2} height={radius * 2}>
        <circle cx={radius} cy={radius} r={radius} fill="transparent" stroke="#e5e7eb" strokeWidth={strokeWidth} strokeDasharray={circumference} />
        <circle
          cx={radius}
          cy={radius}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold" style={{ color }}>
          {clamped.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function Badge({ value }: { value: number }) {
  let badgeClass = 'bg-red-100 text-red-800';
  let label = 'Precisa melhorar';

  if (value >= 80) {
    badgeClass = 'bg-green-100 text-green-800';
    label = 'Excelente';
  } else if (value >= 60) {
    badgeClass = 'bg-yellow-100 text-yellow-800';
    label = 'Bom';
  }

  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badgeClass}`}>{label}</span>;
}

function TableHeader({ text }: { text: string }) {
  return <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">{text}</th>;
}

function TableCell({ text, children, bold }: { text?: string; children?: React.ReactNode; bold?: boolean }) {
  return (
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
      {children ?? <span className={bold ? 'font-semibold text-gray-800 dark:text-gray-100' : ''}>{text}</span>}
    </td>
  );
}

function ResumoHoras({ titulo, valor, cor, tamanho = 'md' }: { titulo: string; valor: string; cor: string; tamanho?: 'sm' | 'md' }) {
  return (
    <div>
      <p className={`text-${tamanho === 'sm' ? 'xs' : 'xs'} uppercase tracking-wide text-gray-500`}>{titulo}</p>
      <p className={`${cor} font-semibold ${tamanho === 'sm' ? 'text-sm' : 'text-lg'}`}>{valor}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-sm text-gray-500 dark:text-gray-400 border border-dashed rounded-lg">{message}</div>
  );
}

function buildFilterPayload(filters: Filters) {
  return {
    p_ano: filters.ano,
    p_semana: filters.semana,
    p_praca: filters.praca,
    p_sub_praca: filters.subPraca,
  };
}

interface FiltroBarProps {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  anos: number[];
  semanas: number[];
  pracas: FilterOption[];
  subPracas: FilterOption[];
}

function FiltroBar({ filters, setFilters, anos, semanas, pracas, subPracas }: FiltroBarProps) {
  const handleChange = (key: keyof Filters, value: string | null) => {
    setFilters({
      ...filters,
      [key]: value === '' ? null : key === 'ano' || key === 'semana' ? value ? Number(value) : null : value,
    });
  };

  return (
    <section className="bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-900/40 shadow-sm rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide mb-4">Filtros</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <FiltroSelect
          label="Ano (ISO)"
          placeholder="Todos"
          options={anos.map((ano) => ({ value: String(ano), label: String(ano) }))}
          value={filters.ano !== null ? String(filters.ano) : ''}
          onChange={(value) => handleChange('ano', value)}
        />
        <FiltroSelect
          label="Semana (ISO)"
          placeholder="Todas"
          options={semanas.map((sem) => ({ value: String(sem), label: `Semana ${sem.toString().padStart(2, '0')}` }))}
          value={filters.semana !== null ? String(filters.semana) : ''}
          onChange={(value) => handleChange('semana', value)}
        />
        <FiltroSelect
          label="Praça"
          placeholder="Todas"
          options={pracas}
          value={filters.praca ?? ''}
          onChange={(value) => handleChange('praca', value)}
        />
        <FiltroSelect
          label="Sub praça"
          placeholder="Todas"
          options={subPracas}
          value={filters.subPraca ?? ''}
          onChange={(value) => handleChange('subPraca', value)}
        />
      </div>
    </section>
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
    <label className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
      {label}
      <select
        className="rounded-lg border border-blue-100 dark:border-blue-900/60 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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
