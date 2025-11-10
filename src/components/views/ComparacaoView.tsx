import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FilterOption, DashboardResumoData } from '@/types';
import { safeLog, getSafeErrorMessage } from '@/lib/errorHandler';
import FiltroSelect from '@/components/FiltroSelect';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { buildFilterPayload } from '@/utils/helpers';
import MetricCard from '@/components/MetricCard';
import { Bar, Line } from 'react-chartjs-2';
import ApresentacaoView from '@/components/ApresentacaoView';
import { registerChartJS } from '@/lib/chartConfig';

const IS_DEV = process.env.NODE_ENV === 'development';

// Registrar Chart.js quando o componente for carregado
if (typeof window !== 'undefined') {
  registerChartJS();
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
  const [mostrarApresentacao, setMostrarApresentacao] = useState(false);
  
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
        safeLog.error('Erro ao buscar semanas:', err);
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
        
        // Usar buildFilterPayload para garantir que múltiplas praças sejam tratadas corretamente
        const filters = {
          ano: null,
          semana: semanaNumero,
          semanas: [semanaNumero],
          praca: pracaSelecionada,
          subPraca: null,
          origem: null,
          turno: null,
          subPracas: [],
          origens: [],
          turnos: [],
        };
        
        const filtro = buildFilterPayload(filters, currentUser);
        
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
        
        // Usar buildFilterPayload para garantir que múltiplas praças sejam tratadas corretamente
        const filters = {
          ano: null,
          semana: semanaNumero,
          semanas: [semanaNumero],
          praca: pracaSelecionada,
          subPraca: null,
          origem: null,
          turno: null,
          subPracas: [],
          origens: [],
          turnos: [],
        };
        
        const filtro = buildFilterPayload(filters, currentUser);
        
        const { data, error } = await supabase.rpc('calcular_utr', filtro);
        if (error) throw error;
        
        return { semana, utr: data };
      });

      const resultadosDados = await Promise.all(promessasDados);
      const resultadosUtr = await Promise.all(promessasUtr);
      
      safeLog.info('📊 Dados Comparação:', { semanas: resultadosDados.length });
      safeLog.info('🎯 UTR Comparação:', { semanas: resultadosUtr.length });
      
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
        
        {/* Tutorial/Instruções para Apresentação */}
        <div className="mb-6 rounded-lg border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 p-4 dark:border-purple-700 dark:from-purple-950/30 dark:to-pink-950/30">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-2xl">📋</div>
            <div className="flex-1">
              <h4 className="mb-2 font-bold text-purple-900 dark:text-purple-300">Como Gerar a Apresentação em PDF</h4>
              <div className="mb-3 rounded-md bg-amber-100 p-3 text-sm text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
                <strong>🚧 Em Desenvolvimento:</strong> A função de Apresentação está em desenvolvimento e será disponibilizada em breve.
              </div>
              <ol className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600 dark:text-purple-400">1.</span>
                  <span>Selecione <strong>exatamente 2 semanas</strong> usando os checkboxes abaixo. O botão &quot;📄 Apresentação&quot; só ficará disponível quando exatamente 2 semanas estiverem selecionadas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600 dark:text-purple-400">2.</span>
                  <span>Clique em <strong>&quot;⚖️ Comparar Semanas&quot;</strong> para carregar os dados das semanas selecionadas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600 dark:text-purple-400">3.</span>
                  <span>Após a comparação ser concluída, clique em <strong>&quot;📄 Apresentação&quot;</strong> para abrir o preview da apresentação.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600 dark:text-purple-400">4.</span>
                  <span>No preview, você pode navegar pelos slides usando os botões &quot;Anterior&quot; e &quot;Próximo&quot;, e então clicar em <strong>&quot;Gerar PDF&quot;</strong> para baixar a apresentação completa em alta qualidade.</span>
                </li>
              </ol>
              <div className="mt-3 rounded-md bg-purple-100 p-2 text-xs text-purple-900 dark:bg-purple-900/50 dark:text-purple-200">
                <strong>⚠️ Importante:</strong> A apresentação só pode ser gerada com exatamente 2 semanas selecionadas. Se você selecionar 1, 3 ou mais semanas, o botão ficará desabilitado.
              </div>
            </div>
          </div>
        </div>
        
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
            
            <button
              onClick={() => setMostrarApresentacao(true)}
              disabled={semanasSelecionadas.length !== 2 || dadosComparacao.length !== 2}
              className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:scale-100 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              title={semanasSelecionadas.length !== 2 ? 'Selecione exatamente 2 semanas para gerar a apresentação' : 'Gerar apresentação em PDF'}
            >
              📄 Apresentação
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
              value={Number((dadosComparacao.reduce((sum, d) => sum + (d.semanal[0]?.aderencia_percentual ?? 0), 0) / dadosComparacao.length).toFixed(1))}
              icon="📊"
              color="blue"
            />
            <MetricCard
              title="Total de Corridas"
              value={dadosComparacao.reduce((sum, d) => sum + (d.totais?.corridas_completadas ?? 0), 0)}
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
                        
                        safeLog.info(`📊 UTR Semana ${item.semana}:`, { utr: utrValue });
                        
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

      {/* Modal de Apresentação */}
      {mostrarApresentacao && (
        <ApresentacaoView
          dadosComparacao={dadosComparacao}
          semanasSelecionadas={semanasSelecionadas}
          pracaSelecionada={pracaSelecionada}
          onClose={() => setMostrarApresentacao(false)}
        />
      )}
    </div>
  );
}

export default ComparacaoView;
