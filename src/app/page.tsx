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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
              </div>
              <div className="text-center">
                <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg">Carregando dados...</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Processando informações do dashboard</p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-8 text-center shadow-lg">
            <div className="text-6xl mb-4">⚠️</div>
            <div className="text-red-700 text-xl font-bold mb-2">Erro ao carregar dados</div>
            <p className="text-red-600 text-lg">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

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
    </div>
  );
}

function ResumoCards({ totals, aderenciaAtual }: { totals: Totals; aderenciaAtual?: number }) {
  const cards = [
    { titulo: "Corridas ofertadas", valor: totals.ofertadas, subtitulo: "Total do período", icon: "🎯", cor: "from-blue-500 to-blue-600" },
    { titulo: "Corridas aceitas", valor: totals.aceitas, subtitulo: "Entregadores", icon: "✅", cor: "from-green-500 to-green-600" },
    { titulo: "Corridas rejeitadas", valor: totals.rejeitadas, subtitulo: "Total", icon: "❌", cor: "from-red-500 to-red-600" },
    { titulo: "Corridas completadas", valor: totals.completadas, subtitulo: "Finalizadas", icon: "🏆", cor: "from-purple-500 to-purple-600" },
    { titulo: "Aderência geral", valor: aderenciaAtual ?? 0, subtitulo: "Semana atual", icon: "📈", cor: "from-indigo-500 to-indigo-600", formato: "percentual" as const }
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {cards.map((card, index) => (
        <ResumoCard key={index} {...card} />
      ))}
    </section>
  );
}

function ResumoCard({ titulo, valor, subtitulo, formato, icon, cor }: { titulo: string; valor: number; subtitulo: string; formato?: 'percentual'; icon?: string; cor?: string }) {
  return (
    <div className="group relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className={`absolute inset-0 bg-gradient-to-br ${cor || 'from-blue-500 to-blue-600'} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${cor || 'from-blue-500 to-blue-600'} text-white shadow-lg`}>
            <span className="text-xl">{icon || '📊'}</span>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-50">
              {formato === 'percentual' ? `${valor.toFixed(1)}%` : valor.toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{titulo}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{subtitulo}</p>
        </div>
      </div>
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
        <div className="lg:col-span-1 bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-xl border border-blue-100 dark:border-blue-900/40 p-8 flex flex-col justify-between">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
              <span className="text-2xl text-white">🎯</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Aderência Geral</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Semana mais recente</p>
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

        <div className="lg:col-span-3 bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-xl border border-blue-100 dark:border-blue-900/40 p-8">
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <span className="text-white text-lg">📈</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Histórico Semanal</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Últimas 10 semanas acompanhadas</p>
              </div>
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

      <section className="bg-gradient-to-br from-white to-green-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-xl border border-green-100 dark:border-green-900/40 p-8">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <span className="text-white text-lg">📅</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Aderência por Dia da Semana</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Consolidado do período carregado</p>
            </div>
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

      <section className="bg-gradient-to-br from-white to-orange-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-xl border border-orange-100 dark:border-orange-900/40 p-8">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
              <span className="text-white text-lg">⏰</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Aderência por Turno</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Comparativo entre períodos operacionais</p>
            </div>
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

      <section className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-xl border border-purple-100 dark:border-purple-900/40 p-8">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <span className="text-white text-lg">🏢</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Aderência por Sub Praça</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Comportamento por hubs locais</p>
            </div>
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
  const corFundo = dia.aderencia_percentual >= 80 ? 'from-green-50 to-emerald-50 border-green-200' : 
                   dia.aderencia_percentual >= 60 ? 'from-yellow-50 to-orange-50 border-yellow-200' : 
                   'from-red-50 to-pink-50 border-red-200';
  
  return (
    <div className={`bg-gradient-to-br ${corFundo} dark:from-gray-800 dark:to-gray-700 rounded-2xl border-2 p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-4`}>
      <div className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{dia.dia_da_semana}</div>
      <Gauge percentual={dia.aderencia_percentual} size="small" />
      <div className="space-y-2">
        <ResumoHoras titulo="Horas a entregar" valor={dia.horas_a_entregar} cor="text-blue-700 dark:text-blue-400" tamanho="sm" />
        <ResumoHoras titulo="Entregues" valor={dia.horas_entregues} cor="text-green-700 dark:text-green-400" tamanho="sm" />
      </div>
      <Badge value={dia.aderencia_percentual} />
    </div>
  );
}

function CardTurno({ turno }: { turno: AderenciaTurno }) {
  const corFundo = turno.aderencia_percentual >= 80 ? 'from-green-50 to-emerald-100 border-green-200' : 
                   turno.aderencia_percentual >= 60 ? 'from-yellow-50 to-orange-100 border-yellow-200' : 
                   'from-red-50 to-pink-100 border-red-200';
  
  return (
    <div className={`bg-gradient-to-r ${corFundo} dark:from-gray-800 dark:to-gray-700 border-2 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
              <span className="text-white text-sm">⏰</span>
            </div>
            <p className="text-lg font-bold uppercase tracking-wide text-gray-800 dark:text-gray-200">{turno.periodo}</p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">{turno.horas_a_entregar} planejadas • {turno.horas_entregues} entregues</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-32">
            <Gauge percentual={turno.aderencia_percentual} thickness="thin" />
          </div>
          <Badge value={turno.aderencia_percentual} />
        </div>
      </div>
      <div className="mt-4 h-3 w-full bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full transition-all duration-500 ${turno.aderencia_percentual >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' : turno.aderencia_percentual >= 60 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-red-400 to-red-600'}`}
          style={{ width: `${Math.min(turno.aderencia_percentual, 100)}%` }}
        />
      </div>
    </div>
  );
}

function CardSubPraca({ subPraca }: { subPraca: AderenciaSubPraca }) {
  const corFundo = subPraca.aderencia_percentual >= 80 ? 'from-green-50 to-emerald-100 border-green-200' : 
                   subPraca.aderencia_percentual >= 60 ? 'from-yellow-50 to-orange-100 border-yellow-200' : 
                   'from-red-50 to-pink-100 border-red-200';
  
  return (
    <div className={`bg-gradient-to-br ${corFundo} dark:from-gray-800 dark:to-gray-700 border-2 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col gap-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
            <span className="text-white text-sm">🏢</span>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">{subPraca.sub_praca}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{subPraca.horas_a_entregar} planejadas • {subPraca.horas_entregues} entregues</p>
          </div>
        </div>
        <Badge value={subPraca.aderencia_percentual} />
      </div>
      <div className="flex justify-center">
        <Gauge percentual={subPraca.aderencia_percentual} thickness="thin" />
      </div>
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
  let badgeClass = 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg';
  let label = 'Precisa melhorar';
  let icon = '⚠️';

  if (value >= 80) {
    badgeClass = 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg';
    label = 'Excelente';
    icon = '🏆';
  } else if (value >= 60) {
    badgeClass = 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg';
    label = 'Bom';
    icon = '👍';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold ${badgeClass} transform transition-transform hover:scale-105`}>
      <span>{icon}</span>
      {label}
    </span>
  );
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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl mb-4 opacity-50">📊</div>
      <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">{message}</p>
      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Dados serão exibidos quando disponíveis</p>
    </div>
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
    <section className="bg-gradient-to-r from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 border-2 border-blue-200 dark:border-blue-900/40 shadow-xl rounded-2xl p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
          <span className="text-white text-lg">🔍</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Filtros de Análise</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{label}</span>
      <select
        className="rounded-xl border-2 border-blue-200 dark:border-blue-900/60 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
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
