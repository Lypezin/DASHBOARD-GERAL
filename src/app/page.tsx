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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-slate-900 dark:via-blue-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
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
            {/* Header com Filtros */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-blue-200 dark:border-blue-800 p-6 mb-6">
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

            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-blue-200 dark:border-blue-800 mb-6">
              <div className="flex border-b border-blue-100 dark:border-blue-700">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-6 py-4 font-semibold text-sm transition-all duration-200 border-b-2 ${
                    activeTab === 'dashboard'
                      ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
                  }`}
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('analise')}
                  className={`px-6 py-4 font-semibold text-sm transition-all duration-200 border-b-2 ${
                    activeTab === 'analise'
                      ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
                  }`}
                >
                  📈 Análise
                </button>
              </div>
            </div>

            {/* Tab Content */}
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
          </>
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
    <div className="space-y-6">
      {/* Aderência Geral Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-blue-200 dark:border-blue-800 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <span className="text-white text-2xl">🎯</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Aderência Geral</h2>
              <p className="text-gray-600 dark:text-gray-400">Desempenho consolidado</p>
            </div>
          </div>
        </div>

        {aderenciaGeral ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Gauge percentual={aderenciaGeral.aderencia_percentual} size="large" />
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Horas Planejadas</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{aderenciaGeral.horas_a_entregar}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-4">
                <p className="text-sm font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">Horas Entregues</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-300">{aderenciaGeral.horas_entregues}</p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Badge value={aderenciaGeral.aderencia_percentual} size="large" />
            </div>
          </div>
        ) : (
          <EmptyState message="Sem dados de aderência geral." />
        )}
      </div>

      {/* Aderência Diária */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-blue-200 dark:border-blue-800 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <span className="text-white text-2xl">📅</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Aderência por Dia da Semana</h2>
              <p className="text-gray-600 dark:text-gray-400">Distribuição semanal do desempenho</p>
            </div>
          </div>
        </div>

        {aderenciaDia.length === 0 ? (
          <EmptyState message="Sem dados de aderência por dia." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {aderenciaDia.map((dia) => (
              <CardDia key={dia.dia_iso} dia={dia} />
            ))}
          </div>
        )}
      </div>

      {/* Filtros de Visualização */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-blue-200 dark:border-blue-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Visualizações Adicionais</h3>
          <div className="flex space-x-2">
            {[
              { key: 'geral', label: 'Geral', icon: '📊' },
              { key: 'turno', label: 'Por Turno', icon: '⏰' },
              { key: 'sub_praca', label: 'Por Sub Praça', icon: '🏢' },
              { key: 'origem', label: 'Por Origem', icon: '🌐' }
            ].map((mode) => (
              <button
                key={mode.key}
                onClick={() => setViewMode(mode.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === mode.key
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                }`}
              >
                {mode.icon} {mode.label}
              </button>
            ))}
          </div>
        </div>

        {viewMode === 'turno' && (
          <div className="space-y-4">
            {aderenciaTurno.length === 0 ? (
              <EmptyState message="Sem dados de aderência por turno." />
            ) : (
              aderenciaTurno.map((turno) => (
                <CardTurno key={turno.periodo} turno={turno} />
              ))
            )}
          </div>
        )}

        {viewMode === 'sub_praca' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {aderenciaSubPraca.length === 0 ? (
              <EmptyState message="Sem dados de aderência por sub praça." />
            ) : (
              aderenciaSubPraca.map((sub) => (
                <CardSubPraca key={sub.sub_praca} subPraca={sub} />
              ))
            )}
          </div>
        )}

        {viewMode === 'origem' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {aderenciaOrigem.length === 0 ? (
              <EmptyState message="Sem dados de aderência por origem." />
            ) : (
              aderenciaOrigem.map((origem) => (
                <CardOrigem key={origem.origem} origem={origem} />
              ))
            )}
          </div>
        )}

        {viewMode === 'geral' && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-600 dark:text-gray-400">Selecione uma visualização acima para ver dados detalhados</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Análise Tab Component
function AnaliseTab({ totals }: { totals: Totals }) {
  const metricas = [
    { 
      titulo: "Corridas Ofertadas", 
      valor: totals.ofertadas, 
      icon: "🎯", 
      cor: "from-blue-500 to-blue-600",
      descricao: "Total de corridas disponibilizadas no sistema"
    },
    { 
      titulo: "Corridas Aceitas", 
      valor: totals.aceitas, 
      icon: "✅", 
      cor: "from-green-500 to-green-600",
      descricao: "Corridas aceitas pelos entregadores"
    },
    { 
      titulo: "Corridas Rejeitadas", 
      valor: totals.rejeitadas, 
      icon: "❌", 
      cor: "from-red-500 to-red-600",
      descricao: "Corridas recusadas pelos entregadores"
    },
    { 
      titulo: "Corridas Completadas", 
      valor: totals.completadas, 
      icon: "🏆", 
      cor: "from-purple-500 to-purple-600",
      descricao: "Corridas finalizadas com sucesso"
    }
  ];

  const taxaAceitacao = totals.ofertadas > 0 ? (totals.aceitas / totals.ofertadas) * 100 : 0;
  const taxaCompletude = totals.aceitas > 0 ? (totals.completadas / totals.aceitas) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricas.map((metrica, index) => (
          <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-blue-200 dark:border-blue-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${metrica.cor} text-white shadow-lg`}>
                <span className="text-2xl">{metrica.icon}</span>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                  {metrica.valor.toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{metrica.titulo}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{metrica.descricao}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Análises Calculadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-blue-200 dark:border-blue-800 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <span className="text-white text-2xl">📊</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Taxa de Aceitação</h3>
              <p className="text-gray-600 dark:text-gray-400">Percentual de corridas aceitas</p>
            </div>
          </div>
          <div className="text-center">
            <Gauge percentual={taxaAceitacao} size="large" />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              {totals.aceitas.toLocaleString('pt-BR')} de {totals.ofertadas.toLocaleString('pt-BR')} corridas
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-blue-200 dark:border-blue-800 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <span className="text-white text-2xl">🎯</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Taxa de Completude</h3>
              <p className="text-gray-600 dark:text-gray-400">Percentual de corridas finalizadas</p>
            </div>
          </div>
          <div className="text-center">
            <Gauge percentual={taxaCompletude} size="large" />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              {totals.completadas.toLocaleString('pt-BR')} de {totals.aceitas.toLocaleString('pt-BR')} aceitas
            </p>
          </div>
        </div>
      </div>

      {/* Resumo Detalhado */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-blue-200 dark:border-blue-800 p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
            <span className="text-white text-2xl">📈</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Resumo Operacional</h3>
            <p className="text-gray-600 dark:text-gray-400">Visão consolidada do desempenho</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {((totals.aceitas + totals.rejeitadas) / totals.ofertadas * 100).toFixed(1)}%
            </div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Taxa de Resposta</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Corridas com alguma ação</p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {(totals.completadas / totals.ofertadas * 100).toFixed(1)}%
            </div>
            <p className="text-sm font-medium text-green-800 dark:text-green-300">Eficiência Geral</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Completadas vs Ofertadas</p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {totals.ofertadas - totals.aceitas - totals.rejeitadas}
            </div>
            <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Sem Resposta</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Corridas não respondidas</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares atualizados
function CardDia({ dia }: { dia: AderenciaDia }) {
  const corFundo = dia.aderencia_percentual >= 80 ? 'from-green-50 to-emerald-50 border-green-200' : 
                   dia.aderencia_percentual >= 60 ? 'from-yellow-50 to-orange-50 border-yellow-200' : 
                   'from-red-50 to-pink-50 border-red-200';
  
  return (
    <div className={`bg-gradient-to-br ${corFundo} dark:from-gray-800 dark:to-gray-700 rounded-xl border-2 p-4 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3`}>
      <div className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{dia.dia_da_semana}</div>
      <Gauge percentual={dia.aderencia_percentual} size="small" />
      <div className="space-y-1">
        <p className="text-xs text-blue-700 dark:text-blue-400">{dia.horas_a_entregar}</p>
        <p className="text-xs text-green-700 dark:text-green-400">{dia.horas_entregues}</p>
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
    <div className={`bg-gradient-to-r ${corFundo} dark:from-gray-800 dark:to-gray-700 border-2 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
              <span className="text-white text-sm">⏰</span>
            </div>
            <p className="text-lg font-bold uppercase tracking-wide text-gray-800 dark:text-gray-200">{turno.periodo}</p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">{turno.horas_a_entregar} planejadas • {turno.horas_entregues} entregues</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-24">
            <Gauge percentual={turno.aderencia_percentual} thickness="thin" />
          </div>
          <Badge value={turno.aderencia_percentual} />
        </div>
      </div>
    </div>
  );
}

function CardSubPraca({ subPraca }: { subPraca: AderenciaSubPraca }) {
  const corFundo = subPraca.aderencia_percentual >= 80 ? 'from-green-50 to-emerald-100 border-green-200' : 
                   subPraca.aderencia_percentual >= 60 ? 'from-yellow-50 to-orange-100 border-yellow-200' : 
                   'from-red-50 to-pink-100 border-red-200';
  
  return (
    <div className={`bg-gradient-to-br ${corFundo} dark:from-gray-800 dark:to-gray-700 border-2 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col gap-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
            <span className="text-white text-sm">🏢</span>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">{subPraca.sub_praca}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{subPraca.horas_a_entregar} • {subPraca.horas_entregues}</p>
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

function CardOrigem({ origem }: { origem: AderenciaOrigem }) {
  const corFundo = origem.aderencia_percentual >= 80 ? 'from-cyan-50 to-sky-100 border-cyan-200' :
                   origem.aderencia_percentual >= 60 ? 'from-blue-50 to-indigo-100 border-blue-200' :
                   'from-slate-50 to-slate-100 border-slate-200';

  return (
    <div className={`bg-gradient-to-br ${corFundo} dark:from-gray-800 dark:to-gray-700 border-2 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col gap-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg">
            <span className="text-white text-sm">🌐</span>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">{origem.origem}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{origem.horas_a_entregar} • {origem.horas_entregues}</p>
          </div>
        </div>
        <Badge value={origem.aderencia_percentual} />
      </div>
      <div className="flex justify-center">
        <Gauge percentual={origem.aderencia_percentual} thickness="thin" />
      </div>
    </div>
  );
}

function Gauge({ percentual, size = 'medium', thickness = 'normal' }: { percentual: number; size?: 'small' | 'medium' | 'large'; thickness?: 'normal' | 'thin' }) {
  const clamped = Math.max(0, Math.min(percentual, 100));
  const radius = size === 'large' ? 70 : size === 'small' ? 35 : 50;
  const strokeWidth = thickness === 'thin' ? 6 : size === 'large' ? 12 : 8;
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
        <span className={`font-semibold ${size === 'large' ? 'text-lg' : size === 'small' ? 'text-xs' : 'text-sm'}`} style={{ color }}>
          {clamped.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function Badge({ value, size = 'normal' }: { value: number; size?: 'normal' | 'large' }) {
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

  const sizeClass = size === 'large' ? 'px-4 py-3 text-sm' : 'px-3 py-2 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 rounded-xl font-bold ${badgeClass} transform transition-transform hover:scale-105 ${sizeClass}`}>
      <span>{icon}</span>
      {label}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-4 opacity-50">📊</div>
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
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
          <span className="text-white text-lg">🔍</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Filtros de Análise</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
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
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{label}</span>
      <select
        className="rounded-xl border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-700 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
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