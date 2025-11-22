'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { getSafeErrorMessage, safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import FiltroSelect from '@/components/FiltroSelect';
import FiltroMultiSelect from '@/components/FiltroMultiSelect';
import FiltroBar from '@/components/FiltroBar';
import { TabNavigation } from '@/components/TabNavigation';
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
  CurrentUser,
  hasFullCityAccess,
  UsuarioOnline,
  EvolucaoMensal,
  EvolucaoSemanal,
  UtrSemanal,
  Entregador,
  TabType
} from '@/types';
import { formatarHorasParaHMS, getAderenciaColor, getAderenciaBgColor } from '@/utils/formatters';
import { buildFilterPayload, safeNumber, arraysEqual } from '@/utils/helpers';
import { DELAYS } from '@/constants/config';

// Lazy load de componentes pesados para melhor performance
import {
  DashboardView,
  MarketingView,
  AnaliseView,
  UtrView,
  EvolucaoView,
  ValoresView,
  EntregadoresMainView,
  PrioridadePromoView,
  ComparacaoView,
} from '@/config/dynamicImports';

// Hook Imports
import { useDashboardData } from '@/hooks/useDashboardData';
import { useUserActivity } from '@/hooks/useUserActivity';
import { useTabData } from '@/hooks/useTabData';
import { useTabDataMapper } from '@/hooks/useTabDataMapper';

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
  const router = useRouter();
  const { isChecking: isCheckingAuth, isAuthenticated, currentUser: authUser } = useAuthGuard({
    requireApproval: true,
    fetchUserProfile: true,
  });
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
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
    // Executar apenas uma vez no mount inicial para registrar atividade inicial
  }, []); // Apenas no mount inicial
  const [anoEvolucao, setAnoEvolucao] = useState<number>(new Date().getFullYear());
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(authUser || null);
  const [chartReady, setChartReady] = useState(false);

  // Atualizar currentUser quando authUser mudar
  useEffect(() => {
    if (authUser) {
      setCurrentUser(authUser);
    }
  }, [authUser]);


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
  const { utrData, entregadoresData, valoresData, prioridadeData } = useTabDataMapper({
    activeTab,
    tabData,
  });

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
    // anoEvolucao não precisa estar nas dependências - queremos verificar apenas quando anosDisponiveis mudar
  }, [anosDisponiveis]);

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
      registrarAtividade('tab_change', { message: `Navegou para a aba ${activeTab}`, tab: activeTab }, activeTab, filters);
    }, DELAYS.TAB_CHANGE);

    return () => {
      if (tabChangeTimeoutRef2.current) {
        clearTimeout(tabChangeTimeoutRef2.current);
      }
    };
    // eslint-disable-line react-hooks/exhaustive-deps
    // registrarAtividade é estável e não precisa estar nas dependências
  }, [activeTab, registrarAtividade, filters, currentUser]);

  // Aplicar filtro automático quando currentUser mudar
  useEffect(() => {
    if (currentUser && !hasFullCityAccess(currentUser) && currentUser.assigned_pracas.length === 1) {
      setFilters(prev => {
        // Só atualizar se ainda não tiver a praça definida
        if (prev.praca !== currentUser.assigned_pracas[0]) {
          return {
            ...prev,
            praca: currentUser.assigned_pracas[0]
          };
        }
        return prev;
      });
    }
  }, [currentUser]);

  // Ref para controlar mudanças de tab e evitar race conditions
  const tabChangeRef = useRef(false);
  const tabChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentTabRef = useRef(activeTab);

  // Atualizar ref quando activeTab mudar
  useEffect(() => {
    currentTabRef.current = activeTab;
  }, [activeTab]);

  // Memoizar handlers de tabs para evitar re-renders e adicionar proteção contra cliques rápidos
  const handleTabChange = useCallback((tab: TabType) => {
    // Se já está mudando de tab ou é a mesma tab, ignorar
    if (currentTabRef.current === tab) {
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
    tabChangeTimeoutRef.current = setTimeout(() => {
      tabChangeRef.current = false;
    }, DELAYS.TAB_CHANGE_PROTECTION);
  }, []);

  // Mostrar loading enquanto verifica autenticação
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-200">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, não renderizar nada (já foi redirecionado)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">

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
          <div className="space-y-4 animate-fade-in">
            {/* Filtros - Container Separado */}
            {activeTab !== 'comparacao' && activeTab !== 'marketing' && (
              <div className="relative group" style={{ zIndex: 1 }}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300/20 to-blue-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative bg-gradient-to-br from-white via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/10 rounded-3xl border-0 shadow-xl p-6 sm:p-8 backdrop-blur-sm" style={{ overflow: 'visible' }}>
                  <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-blue-400/5 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="relative" style={{ zIndex: 1 }}>
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
                </div>
              </div>
            )}

            {/* Tabs - Container Separado */}
            <TabNavigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
              variant={activeTab === 'comparacao' || activeTab === 'marketing' ? 'compact' : 'default'}
            />

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
                      <EntregadoresMainView
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