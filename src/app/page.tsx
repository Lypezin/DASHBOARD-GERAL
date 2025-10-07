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

      if (porOrigem.error) {
        console.error('Erro ao buscar aderência por origem:', porOrigem.error);
        setAderenciaOrigem([]);
      } else {
        setAderenciaOrigem((porOrigem.data as AderenciaOrigem[]) || []);
      }

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
    <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 overflow-hidden">
      <div className="h-full flex flex-col max-w-full p-3">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 absolute top-0 left-0"></div>
              </div>
              <p className="text-blue-700 dark:text-blue-300 font-medium">Carregando...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center shadow-lg max-w-md">
              <div className="text-4xl mb-3">⚠️</div>
              <div className="text-blue-700 text-lg font-bold mb-2">Erro ao carregar dados</div>
              <p className="text-blue-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {totals && !loading && !error && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header com Filtros - Compacto */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-blue-200 dark:border-blue-700 p-4 mb-3 flex-shrink-0">
              <FiltroBar
                filters={filters}
                setFilters={setFilters}
                anos={anosDisponiveis}
                semanas={semanasDisponiveis}
                pracas={pracas}
                subPracas={subPracas}
                origens={origens}
              />
            </div>

            {/* Navigation Tabs - Compacto */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-blue-200 dark:border-blue-700 mb-3 flex-shrink-0">
              <div className="flex border-b border-blue-100 dark:border-blue-700">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2 font-medium text-sm transition-all duration-200 border-b-2 ${
                    activeTab === 'dashboard'
                      ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
                  }`}
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('analise')}
                  className={`px-4 py-2 font-medium text-sm transition-all duration-200 border-b-2 ${
                    activeTab === 'analise'
                      ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
                  }`}
                >
                  📈 Análise
                </button>
              </div>
            </div>

            {/* Tab Content - Flex que preenche o espaço restante */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'dashboard' && (
                <DashboardTab
                  aderenciaGeral={aderenciaGeral}
                  aderenciaDia={aderenciaDia}
                  aderenciaTurno={aderenciaTurno}
                  aderenciaSubPraca={aderenciaSubPraca}
                  aderenciaOrigem={aderenciaOrigem}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                />
              )}

              {activeTab === 'analise' && (
                <AnaliseTab totals={totals} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Dashboard Tab Component
interface DashboardTabProps {
  aderenciaGeral?: AderenciaSemanal;
  aderenciaDia: AderenciaDia[];
  aderenciaTurno: AderenciaTurno[];
  aderenciaSubPraca: AderenciaSubPraca[];
  aderenciaOrigem: AderenciaOrigem[];
  viewMode: 'geral' | 'turno' | 'sub_praca' | 'origem';
  setViewMode: (mode: 'geral' | 'turno' | 'sub_praca' | 'origem') => void;
}

function DashboardTab({ aderenciaGeral, aderenciaDia, aderenciaTurno, aderenciaSubPraca, aderenciaOrigem, viewMode, setViewMode }: DashboardTabProps) {
  return (
    <div className="h-full grid grid-rows-3 gap-3 overflow-hidden">
      {/* Row 1: Aderência Geral + Aderência Diária */}
      <div className="grid grid-cols-5 gap-3">
        {/* Aderência Geral - 2 colunas */}
        <div className="col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-blue-200 dark:border-blue-700 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
              <span className="text-white text-lg">🎯</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Aderência Geral</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">Desempenho consolidado</p>
            </div>
          </div>

          {aderenciaGeral ? (
            <div className="grid grid-cols-3 gap-3 h-24">
              <div className="flex items-center justify-center">
                <Gauge percentual={aderenciaGeral.aderencia_percentual} size="medium" />
              </div>
              <div className="space-y-2">
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2 text-center">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Planejadas</p>
                  <p className="text-sm font-bold text-blue-800 dark:text-blue-300">{aderenciaGeral.horas_a_entregar}</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-800/30 rounded-lg p-2 text-center">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Entregues</p>
                  <p className="text-sm font-bold text-blue-800 dark:text-blue-300">{aderenciaGeral.horas_entregues}</p>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <Badge value={aderenciaGeral.aderencia_percentual} />
              </div>
            </div>
          ) : (
            <EmptyState message="Sem dados gerais." />
          )}
        </div>

        {/* Aderência Diária - 3 colunas */}
        <div className="col-span-3 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-blue-200 dark:border-blue-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                <span className="text-white text-lg">📅</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Aderência por Dia</h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">Distribuição semanal</p>
              </div>
            </div>
          </div>

          {aderenciaDia.length === 0 ? (
            <EmptyState message="Sem dados por dia." />
          ) : (
            <div className="grid grid-cols-7 gap-2 h-24">
              {aderenciaDia.map((dia) => (
                <CardDia key={dia.dia_iso} dia={dia} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Filtros de Visualização */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-blue-200 dark:border-blue-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Visualizações</h3>
          <div className="flex space-x-2">
            {[
              { key: 'geral', label: 'Geral', icon: '📊' },
              { key: 'turno', label: 'Turno', icon: '⏰' },
              { key: 'sub_praca', label: 'Sub Praça', icon: '🏢' },
              { key: 'origem', label: 'Origem', icon: '🌐' }
            ].map((mode) => (
              <button
                key={mode.key}
                onClick={() => setViewMode(mode.key as any)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                  viewMode === mode.key
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100'
                }`}
              >
                {mode.icon} {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visualização Selecionada */}
        <div className="h-20 overflow-hidden">
          {viewMode === 'turno' && (
            <div className="space-y-1 h-full overflow-y-auto">
              {aderenciaTurno.length === 0 ? (
                <EmptyState message="Sem dados por turno." />
              ) : (
                aderenciaTurno.slice(0, 2).map((turno) => (
                  <CardTurnoCompact key={turno.periodo} turno={turno} />
                ))
              )}
            </div>
          )}

          {viewMode === 'sub_praca' && (
            <div className="grid grid-cols-4 gap-2 h-full">
              {aderenciaSubPraca.length === 0 ? (
                <EmptyState message="Sem dados por sub praça." />
              ) : (
                aderenciaSubPraca.slice(0, 4).map((sub) => (
                  <CardCompact key={sub.sub_praca} titulo={sub.sub_praca} percentual={sub.aderencia_percentual} />
                ))
              )}
            </div>
          )}

          {viewMode === 'origem' && (
            <div className="grid grid-cols-4 gap-2 h-full">
              {aderenciaOrigem.length === 0 ? (
                <EmptyState message="Sem dados por origem." />
              ) : (
                aderenciaOrigem.slice(0, 4).map((origem) => (
                  <CardCompact key={origem.origem} titulo={origem.origem} percentual={origem.aderencia_percentual} />
                ))
              )}
            </div>
          )}

          {viewMode === 'geral' && (
            <div className="text-center py-4">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Selecione uma visualização</p>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Espaço para expansão ou informações adicionais */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-blue-200 dark:border-blue-700 p-4">
        <div className="text-center h-full flex items-center justify-center">
          <div>
            <div className="text-3xl mb-2">📈</div>
            <p className="text-sm text-blue-600 dark:text-blue-400">Área reservada para expansões futuras</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Análise Tab Component
function AnaliseTab({ totals }: { totals: Totals }) {
  const metricas = [
    { titulo: "Ofertadas", valor: totals.ofertadas, icon: "🎯", intensidade: "bg-blue-500" },
    { titulo: "Aceitas", valor: totals.aceitas, icon: "✅", intensidade: "bg-blue-600" },
    { titulo: "Rejeitadas", valor: totals.rejeitadas, icon: "❌", intensidade: "bg-blue-400" },
    { titulo: "Completadas", valor: totals.completadas, icon: "🏆", intensidade: "bg-blue-700" }
  ];

  const taxaAceitacao = totals.ofertadas > 0 ? (totals.aceitas / totals.ofertadas) * 100 : 0;
  const taxaCompletude = totals.aceitas > 0 ? (totals.completadas / totals.aceitas) * 100 : 0;

  return (
    <div className="h-full grid grid-rows-2 gap-3 overflow-hidden">
      {/* Row 1: Métricas */}
      <div className="grid grid-cols-4 gap-3">
        {metricas.map((metrica, index) => (
          <div key={index} className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-blue-200 dark:border-blue-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${metrica.intensidade} shadow-sm`}>
                <span className="text-white text-lg">{metrica.icon}</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {metrica.valor.toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-800 dark:text-blue-200">{metrica.titulo}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Análises */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-blue-200 dark:border-blue-700 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
              <span className="text-white text-lg">📊</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200">Taxa de Aceitação</h3>
              <p className="text-xs text-blue-600 dark:text-blue-400">Aceitas / Ofertadas</p>
            </div>
          </div>
          <div className="text-center">
            <Gauge percentual={taxaAceitacao} size="medium" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-blue-200 dark:border-blue-700 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-2 bg-blue-700 rounded-lg shadow-sm">
              <span className="text-white text-lg">🎯</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200">Taxa de Completude</h3>
              <p className="text-xs text-blue-600 dark:text-blue-400">Completadas / Aceitas</p>
            </div>
          </div>
          <div className="text-center">
            <Gauge percentual={taxaCompletude} size="medium" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-blue-200 dark:border-blue-700 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-2 bg-blue-800 rounded-lg shadow-sm">
              <span className="text-white text-lg">📈</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200">Resumo</h3>
              <p className="text-xs text-blue-600 dark:text-blue-400">Visão geral</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {((totals.aceitas + totals.rejeitadas) / totals.ofertadas * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-blue-800 dark:text-blue-300">Taxa Resposta</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-800/30 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {totals.ofertadas - totals.aceitas - totals.rejeitadas}
              </div>
              <p className="text-xs text-blue-800 dark:text-blue-300">Sem Resposta</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares compactos
function CardDia({ dia }: { dia: AderenciaDia }) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700 p-2 text-center h-full flex flex-col justify-between">
      <div className="text-xs font-bold text-blue-800 dark:text-blue-200 uppercase">{dia.dia_da_semana.substring(0, 3)}</div>
      <div className="flex-1 flex items-center justify-center">
        <Gauge percentual={dia.aderencia_percentual} size="small" />
      </div>
      <Badge value={dia.aderencia_percentual} size="small" />
    </div>
  );
}

function CardTurnoCompact({ turno }: { turno: AderenciaTurno }) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-2 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="p-1 bg-blue-500 rounded text-white text-xs">⏰</div>
        <p className="text-sm font-bold text-blue-800 dark:text-blue-200 uppercase">{turno.periodo}</p>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-12">
          <Gauge percentual={turno.aderencia_percentual} size="tiny" />
        </div>
        <Badge value={turno.aderencia_percentual} size="small" />
      </div>
    </div>
  );
}

function CardCompact({ titulo, percentual }: { titulo: string; percentual: number }) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-2 text-center h-full flex flex-col justify-between">
      <p className="text-xs font-bold text-blue-800 dark:text-blue-200 uppercase truncate">{titulo}</p>
      <div className="flex-1 flex items-center justify-center">
        <Gauge percentual={percentual} size="small" />
      </div>
      <Badge value={percentual} size="small" />
    </div>
  );
}

function Gauge({ percentual, size = 'medium' }: { percentual: number; size?: 'tiny' | 'small' | 'medium' | 'large' }) {
  const clamped = Math.max(0, Math.min(percentual, 100));
  const radius = size === 'large' ? 50 : size === 'medium' ? 35 : size === 'small' ? 25 : 15;
  const strokeWidth = size === 'large' ? 8 : size === 'medium' ? 6 : size === 'small' ? 4 : 3;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  
  // Tons de azul baseado na performance
  const color = clamped >= 80 ? '#1e40af' : clamped >= 60 ? '#3b82f6' : clamped >= 40 ? '#60a5fa' : '#93c5fd';

  return (
    <div className="relative flex items-center justify-center" style={{ width: radius * 2, height: radius * 2 }}>
      <svg className="transform -rotate-90" width={radius * 2} height={radius * 2}>
        <circle 
          cx={radius} 
          cy={radius} 
          r={radius} 
          fill="transparent" 
          stroke="#e0f2fe" 
          strokeWidth={strokeWidth}
        />
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
        <span 
          className={`font-bold ${size === 'large' ? 'text-sm' : size === 'medium' ? 'text-xs' : 'text-xs'}`}
          style={{ color, fontSize: size === 'tiny' ? '8px' : undefined }}
        >
          {clamped.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function Badge({ value, size = 'normal' }: { value: number; size?: 'normal' | 'small' }) {
  // Tons de azul baseado na performance
  let badgeClass = 'bg-blue-300 text-blue-900';
  let label = 'Baixo';

  if (value >= 80) {
    badgeClass = 'bg-blue-700 text-white';
    label = 'Alto';
  } else if (value >= 60) {
    badgeClass = 'bg-blue-500 text-white';
    label = 'Médio';
  } else if (value >= 40) {
    badgeClass = 'bg-blue-400 text-white';
    label = 'Baixo';
  }

  const sizeClass = size === 'small' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-xs';

  return (
    <span className={`inline-flex items-center rounded-lg font-bold ${badgeClass} ${sizeClass}`}>
      {label}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="text-2xl mb-2 opacity-50">📊</div>
      <p className="text-sm text-blue-600 dark:text-blue-400">{message}</p>
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
      [key]: rawValue === '' || rawValue === null
        ? null
        : key === 'ano' || key === 'semana'
        ? Number(rawValue)
        : rawValue,
    }));
  };

  return (
    <div>
      <div className="flex items-center space-x-2 mb-3">
        <div className="p-2 bg-blue-500 rounded-lg">
          <span className="text-white text-sm">🔍</span>
        </div>
        <h2 className="text-lg font-bold text-blue-800 dark:text-blue-200">Filtros</h2>
      </div>
      <div className="grid grid-cols-5 gap-3">
        <FiltroSelect
          label="Ano"
          placeholder="Todos"
          options={anos.map((ano) => ({ value: String(ano), label: String(ano) }))}
          value={filters.ano !== null ? String(filters.ano) : ''}
          onChange={(value) => handleChange('ano', value)}
        />
        <FiltroSelect
          label="Semana"
          placeholder="Todas"
          options={semanas.map((sem) => ({ value: String(sem), label: `S${sem.toString().padStart(2, '0')}` }))}
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
          label="Sub Praça"
          placeholder="Todas"
          options={subPracas}
          value={filters.subPraca ?? ''}
          onChange={(value) => handleChange('subPraca', value)}
        />
        <FiltroSelect
          label="Origem"
          placeholder="Todas"
          options={origens}
          value={filters.origem ?? ''}
          onChange={(value) => handleChange('origem', value)}
        />
      </div>
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
      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{label}</span>
      <select
        className="rounded-lg border border-blue-200 dark:border-blue-600 bg-white dark:bg-slate-700 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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