'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';
import { getSafeErrorMessage, safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { sanitizeText } from '@/lib/sanitize';
import FiltroSelect from '@/components/FiltroSelect';
import FiltroMultiSelect from '@/components/FiltroMultiSelect';
import FiltroBar from '@/components/FiltroBar';
import TabButton from '@/components/TabButton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { registerChartJS } from '@/lib/chartConfig';
import {
  Totals,
  AderenciaSemanal,
  AderenciaDia,
  AderenciaTurno,
  AderenciaSubPraca,
  AderenciaOrigem,
  FilterOption,
  Filters,
  DimensoesDashboard,
  DashboardResumoData,
  UtrData,
  EntregadoresData,
  ValoresEntregador,
  ValoresData,
  UsuarioOnline,
  MonitoramentoData,
  EvolucaoMensal,
  EvolucaoSemanal,
  UtrSemanal,
  Entregador
} from '@/types';
import { formatarHorasParaHMS, getAderenciaColor, getAderenciaBgColor } from '@/utils/formatters';
import { buildFilterPayload, safeNumber, arraysEqual } from '@/utils/helpers';

// Lazy load de componentes pesados para melhor performance
// Componentes que usam Chart.js devem ser carregados apenas no cliente (ssr: false)
const DashboardView = dynamic(() => import('@/components/views/DashboardView').then(mod => ({ default: mod.default })), {
  loading: () => <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div></div>,
  ssr: false
});
const MarketingView = dynamic(() => import('@/components/views/MarketingView').then(mod => ({ default: mod.default })), {
  loading: () => <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div></div>,
  ssr: false
});
const AnaliseView = dynamic(() => import('@/components/views/AnaliseView').then(mod => ({ default: mod.default })), {
  loading: () => <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div></div>,
  ssr: false
});
const UtrView = dynamic(() => import('@/components/views/UtrView').then(mod => ({ default: mod.default })), {
  loading: () => <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div></div>,
  ssr: false
});
const EvolucaoView = dynamic(() => import('@/components/views/EvolucaoView').then(mod => ({ default: mod.default })), {
  loading: () => <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div></div>,
  ssr: false
});
const ValoresView = dynamic(() => import('@/components/views/ValoresView').then(mod => ({ default: mod.default })), {
  loading: () => <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div></div>,
  ssr: false
});
const EntregadoresView = dynamic(() => import('@/components/views/EntregadoresView').then(mod => ({ default: mod.default })), {
  loading: () => <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div></div>,
  ssr: false
});
const PrioridadePromoView = dynamic(() => import('@/components/views/PrioridadePromoView').then(mod => ({ default: mod.default })), {
  loading: () => <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div></div>,
  ssr: false
});
const MonitoramentoView = dynamic(() => import('@/components/views/MonitoramentoView').then(mod => ({ default: mod.default })), {
  loading: () => <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div></div>,
  ssr: false
});
const ComparacaoView = dynamic(() => import('@/components/views/ComparacaoView').then(mod => ({ default: mod.default })), {
  loading: () => <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div></div>,
  ssr: false
});

// Hook Imports
import { useDashboardData } from '@/hooks/useDashboardData';
import { useUserActivity } from '@/hooks/useUserActivity';
import { useTabData } from '@/hooks/useTabData'; // Importa o novo hook

// =================================================================================
// Interfaces e Tipos
// =================================================================================


// =================================================================================
// Funções auxiliares
// =================================================================================



// =================================================================================
// Componente Principal
// =================================================================================

const IS_DEV = process.env.NODE_ENV === 'development';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analise' | 'utr' | 'entregadores' | 'valores' | 'evolucao' | 'monitoramento' | 'prioridade' | 'comparacao' | 'marketing'>('dashboard');
  const [filters, setFilters] = useState<Filters>({ 
    ano: null, 
    semana: null, 
    praca: null, 
    subPraca: null, 
    origem: null, 
    turno: null, 
    subPracas: [], 
    origens: [], 
    turnos: [], 
    semanas: [],
    filtroModo: 'ano_semana',
    dataInicial: null,
    dataFinal: null,
  });

  // Log para debug - verificar inicialização dos filtros (apenas em desenvolvimento)
  useEffect(() => {
    if (IS_DEV) {
      safeLog.info('[DashboardPage] Filters inicializados:', {
        filtroModo: filters.filtroModo,
        dataInicial: filters.dataInicial,
        dataFinal: filters.dataFinal,
        hasFiltroModo: 'filtroModo' in filters,
        filtersKeys: Object.keys(filters),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Apenas no mount inicial
  const [anoEvolucao, setAnoEvolucao] = useState<number>(new Date().getFullYear());
  const [currentUser, setCurrentUser] = useState<{ is_admin: boolean; assigned_pracas: string[] } | null>(null);
  const [chartReady, setChartReady] = useState(false);

  // Registrar Chart.js apenas no cliente (após montagem)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      registerChartJS()
        .then(() => {
          // Chart.js está pronto, permitir renderização dos componentes
          setChartReady(true);
          if (process.env.NODE_ENV === 'development') {
            safeLog.info('✅ Chart.js está pronto, componentes podem renderizar');
          }
        })
        .catch((error) => {
          // Mesmo com erro, permitir renderização para não travar a aplicação
          safeLog.error('Erro ao registrar Chart.js:', error);
          setChartReady(true);
        });
    } else {
      // No servidor, marcar como pronto imediatamente (componentes não renderizam no SSR)
      setChartReady(true);
    }
  }, []);

  const {
    totals, aderenciaSemanal, aderenciaDia, aderenciaTurno, aderenciaSubPraca, aderenciaOrigem,
    anosDisponiveis, semanasDisponiveis, pracas, subPracas, origens, turnos, loading, error,
    evolucaoMensal, evolucaoSemanal, utrSemanal, loadingEvolucao,
    aderenciaGeral
  } = useDashboardData(filters, activeTab, anoEvolucao, currentUser);

  const filterPayload = useMemo(() => {
    if (IS_DEV) {
      safeLog.info('[DashboardPage] Gerando filterPayload com:', {
        filters,
        currentUser: currentUser ? { is_admin: currentUser.is_admin, hasAssignedPracas: currentUser.assigned_pracas.length > 0 } : null,
      });
    }
    try {
      const payload = buildFilterPayload(filters, currentUser);
      if (IS_DEV) {
        safeLog.info('[DashboardPage] filterPayload gerado com sucesso:', payload);
      }
      return payload;
    } catch (error) {
      safeLog.error('[DashboardPage] Erro ao gerar filterPayload:', error);
      throw error;
    }
  }, [filters, currentUser]);
  
  const { data: tabData, loading: loadingTabData } = useTabData(activeTab, filterPayload, currentUser);

  // Mapeia os dados do useTabData para as props dos componentes de view
  // Memoizar para evitar recriação desnecessária
  const utrData = useMemo(() => {
    return activeTab === 'utr' ? (tabData as UtrData) : null;
  }, [activeTab, tabData]);
  
  const entregadoresData = useMemo(() => {
    return activeTab === 'entregadores' ? (tabData as EntregadoresData) : null;
  }, [activeTab, tabData]);
  
  const valoresData = useMemo(() => {
    if (activeTab !== 'valores') return [];
    if (!tabData) return [];
    if (Array.isArray(tabData)) {
      // Verificar se é realmente um array de ValoresEntregador
      return tabData as ValoresEntregador[];
    }
    // Se não é array e não é null, não deve acontecer para valores, mas retornar array vazio por segurança
    return [];
  }, [activeTab, tabData]);
  
  const prioridadeData = useMemo(() => {
    return activeTab === 'prioridade' ? (tabData as EntregadoresData) : null;
  }, [activeTab, tabData]);
  
  const { sessionId, isPageVisible, registrarAtividade } = useUserActivity(activeTab, filters, currentUser);

  // Ajustar automaticamente o ano da evolução para o mais recente disponível quando o atual não existir
  useEffect(() => {
    if (Array.isArray(anosDisponiveis) && anosDisponiveis.length > 0) {
      if (!anosDisponiveis.includes(anoEvolucao)) {
        const ultimoAno = anosDisponiveis[anosDisponiveis.length - 1];
        setAnoEvolucao(ultimoAno);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anosDisponiveis]); // anoEvolucao não precisa estar nas dependências - queremos verificar apenas quando anosDisponiveis mudar

  // Lógica para registrar atividade do usuário
  // Adicionar debounce para evitar múltiplas chamadas quando há mudanças rápidas de tab
  const tabChangeTimeoutRef2 = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!currentUser) return; // Só registrar se houver usuário autenticado
    
    // Limpar timeout anterior se existir (debounce)
    if (tabChangeTimeoutRef2.current) {
      clearTimeout(tabChangeTimeoutRef2.current);
    }

    // Adicionar pequeno delay para evitar race conditions
    tabChangeTimeoutRef2.current = setTimeout(() => {
      registrarAtividade('tab_change', `Navegou para a aba ${activeTab}`, activeTab, filters);
    }, 100); // 100ms de debounce para evitar múltiplas chamadas
    
    return () => {
      if (tabChangeTimeoutRef2.current) {
        clearTimeout(tabChangeTimeoutRef2.current);
      }
    };
  }, [activeTab, registrarAtividade, filters, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lógica para buscar dados do usuário
  const verifyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: profile, error } = await safeRpc<{ is_admin: boolean; assigned_pracas: string[] }>('get_current_user_profile', {}, {
          timeout: 10000,
          validateParams: false
        });
      
      if (error) {
          if (IS_DEV) safeLog.error('Erro ao buscar perfil do usuário:', error);
          setCurrentUser(null);
        return;
      }
      
        if (profile) {
          setCurrentUser(profile);
          // Aplicar filtro automático se não for admin e tiver apenas uma praça
          if (!profile.is_admin && profile.assigned_pracas.length === 1) {
            setFilters(prev => {
              // Só atualizar se ainda não tiver a praça definida
              if (prev.praca !== profile.assigned_pracas[0]) {
        return {
                  ...prev,
                  praca: profile.assigned_pracas[0]
                };
              }
              return prev;
            });
                    }
                  
                  } else {
          setCurrentUser(null);
        }
      } catch (err) {
        safeLog.error('Erro ao buscar usuário', err);
        setCurrentUser(null);
      }
    };

    fetchUser();
    
  }, []);

  // Ref para controlar mudanças de tab e evitar race conditions
  const tabChangeRef = useRef(false);
  const tabChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentTabRef = useRef(activeTab);

  // Atualizar ref quando activeTab mudar
  useEffect(() => {
    currentTabRef.current = activeTab;
  }, [activeTab]);

  // Memoizar handlers de tabs para evitar re-renders e adicionar proteção contra cliques rápidos
  const handleTabChange = useCallback((tab: typeof activeTab) => {
    // Se já está mudando de tab ou é a mesma tab, ignorar
    if (tabChangeRef.current || currentTabRef.current === tab) {
      return;
    }

    // Limpar timeout anterior se existir
    if (tabChangeTimeoutRef.current) {
      clearTimeout(tabChangeTimeoutRef.current);
    }

    // Marcar como mudando
    tabChangeRef.current = true;

    // Mudar tab imediatamente para feedback visual
    setActiveTab(tab);

    // Resetar flag após um delay maior para garantir que a renderização anterior terminou
    // Aumentado para 800ms para dar mais tempo para requisições cancelarem
    tabChangeTimeoutRef.current = setTimeout(() => {
      tabChangeRef.current = false;
    }, 800);
  }, []);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1920px] px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
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
              <div className="hidden sm:flex items-center gap-2 md:gap-3 lg:gap-4 xl:gap-5 shrink-0">
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
            <div className="group relative rounded-xl sm:rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl p-3 sm:p-4 md:p-5 lg:p-7 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-white/30 dark:border-white/10 dark:bg-slate-900/80 animate-slide-down" style={{ position: 'relative', zIndex: 10 }}>
              {/* Subtle glow */}
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 opacity-0 blur-xl transition-opacity group-hover:opacity-100"></div>
              <div className="relative">
              {activeTab !== 'comparacao' && activeTab !== 'marketing' && (
                <>
                  <div className="relative">
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
                  <div className="my-3 sm:my-4 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent dark:via-blue-700"></div>
                </>
              )}
              {/* Tabs com scroll horizontal em mobile */}
              <div className="relative" style={{ position: 'relative', zIndex: 1 }}>
                <div className="flex gap-1 sm:gap-1.5 md:gap-2 overflow-x-auto pb-2 sm:pb-3 -mx-3 sm:-mx-4 md:mx-0 px-3 sm:px-4 md:px-0 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-transparent">
                  <TabButton label="Dashboard" active={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} />
                  <TabButton label="Análise" active={activeTab === 'analise'} onClick={() => handleTabChange('analise')} />
                  <TabButton label="UTR" active={activeTab === 'utr'} onClick={() => handleTabChange('utr')} />
                  <TabButton label="Entregadores" active={activeTab === 'entregadores'} onClick={() => handleTabChange('entregadores')} />
                  <TabButton label="Valores" active={activeTab === 'valores'} onClick={() => handleTabChange('valores')} />
                  <TabButton label="Prioridade/Promo" active={activeTab === 'prioridade'} onClick={() => handleTabChange('prioridade')} />
                  <TabButton label="Evolução" active={activeTab === 'evolucao'} onClick={() => handleTabChange('evolucao')} />
                  {currentUser?.is_admin && (
                    <TabButton label="Monitor" active={activeTab === 'monitoramento'} onClick={() => handleTabChange('monitoramento')} />
                  )}
                  <TabButton label="Comparar" active={activeTab === 'comparacao'} onClick={() => handleTabChange('comparacao')} />
                  <TabButton label="Marketing" active={activeTab === 'marketing'} onClick={() => handleTabChange('marketing')} />
                </div>
                </div>
              </div>
            </div>

            {/* Conteúdo */}
            <main>
              {!chartReady && (activeTab === 'dashboard' || activeTab === 'analise' || activeTab === 'evolucao' || activeTab === 'comparacao') ? (
                <div className="flex h-[60vh] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                    <p className="mt-4 text-sm font-semibold text-blue-700 dark:text-blue-300">Carregando gráficos...</p>
                  </div>
                </div>
              ) : (
                <ErrorBoundary>
                  <Suspense fallback={
                    <div className="flex h-[60vh] items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                        <p className="mt-4 text-sm font-semibold text-blue-700 dark:text-blue-300">Carregando...</p>
                      </div>
                    </div>
                  }>
                    {activeTab === 'dashboard' && (
                      <DashboardView
                        aderenciaGeral={aderenciaGeral as AderenciaSemanal | undefined}
                        aderenciaDia={aderenciaDia}
                        aderenciaTurno={aderenciaTurno}
                        aderenciaSubPraca={aderenciaSubPraca}
                        aderenciaOrigem={aderenciaOrigem}
                      />
                    )}
                    {activeTab === 'analise' && totals && (
                      <AnaliseView 
                        totals={totals}
                        aderenciaDia={aderenciaDia}
                        aderenciaTurno={aderenciaTurno}
                        aderenciaSubPraca={aderenciaSubPraca}
                        aderenciaOrigem={aderenciaOrigem}
                      />
                    )}
                    {activeTab === 'utr' && (
                      <UtrView
                        utrData={utrData}
                        loading={loadingTabData}
                      />
                    )}
                    
                    {activeTab === 'entregadores' && (
                      <EntregadoresView
                        entregadoresData={entregadoresData}
                        loading={loadingTabData}
                      />
                    )}
                    
                    {activeTab === 'valores' && (
                      <ValoresView
                        valoresData={valoresData}
                        loading={loadingTabData}
                      />
                    )}
                    
                    {activeTab === 'prioridade' && (
                      <PrioridadePromoView
                        entregadoresData={prioridadeData}
                        loading={loadingTabData}
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
                    {activeTab === 'monitoramento' && (
                      <MonitoramentoView />
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
                    {activeTab === 'marketing' && (
                      <MarketingView />
                    )}
                  </Suspense>
                </ErrorBoundary>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}