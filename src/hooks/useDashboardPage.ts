/**
 * Hook para gerenciar estado principal da página do dashboard
 * Extraído de src/app/page.tsx para melhor organização
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useTabData } from '@/hooks/useTabData';
import { useTabDataMapper } from '@/hooks/useTabDataMapper';
import { useUserActivity } from '@/hooks/useUserActivity';
import { registerChartJS } from '@/lib/chartConfig';
import { safeLog } from '@/lib/errorHandler';
import { buildFilterPayload } from '@/utils/helpers';
import { hasFullCityAccess } from '@/types';
import { DELAYS } from '@/constants/config';
import type { Filters, CurrentUser, TabType } from '@/types';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useDashboardPage() {

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

  // Log quando o hook é montado
  useEffect(() => {
    // console.log('🔄 [DashboardPage] Hook montado/remontado');
  }, []);

  // Log quando os filtros mudam
  useEffect(() => {
    // console.log('📊 [DashboardPage] FILTROS MUDARAM:', {
    //   ano: filters.ano,
    //   semana: filters.semana,
    //   praca: filters.praca,
    //   timestamp: new Date().toISOString(),
    // });
  }, [filters.ano, filters.semana, filters.praca]);

  const [anoEvolucao, setAnoEvolucao] = useState<number>(new Date().getFullYear());
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(authUser || null);
  const [chartReady, setChartReady] = useState(false);

  // Atualizar currentUser quando authUser mudar
  useEffect(() => {
    if (authUser) {
      setCurrentUser(authUser);
    }
  }, [authUser]);

  // Registrar Chart.js apenas no cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      registerChartJS()
        .then(() => {
          setChartReady(true);
          if (IS_DEV) {
            safeLog.info('✅ Chart.js está pronto, componentes podem renderizar');
          }
        })
        .catch((error) => {
          safeLog.error('Erro ao registrar Chart.js:', error);
          setChartReady(true);
        });
    } else {
      setChartReady(true);
    }
  }, []);

  // Dados do dashboard
  const {
    totals,
    aderenciaSemanal,
    aderenciaDia,
    aderenciaTurno,
    aderenciaSubPraca,
    aderenciaOrigem,
    anosDisponiveis,
    semanasDisponiveis,
    pracas,
    subPracas,
    origens,
    turnos,
    loading,
    error,
    evolucaoMensal,
    evolucaoSemanal,
    utrSemanal,
    loadingEvolucao,
    aderenciaGeral
  } = useDashboardData(filters, activeTab, anoEvolucao, currentUser);

  // Selecionar automaticamente o ano mais recente se nenhum estiver selecionado
  useEffect(() => {
    console.log('[DashboardPage] Auto-selection check:', {
      anosDisponiveis,
      'filters.ano': filters.ano,
      shouldSelect: anosDisponiveis && anosDisponiveis.length > 0 && !filters.ano
    });

    if (anosDisponiveis && anosDisponiveis.length > 0 && !filters.ano) {
      const maxYear = Math.max(...anosDisponiveis);
      console.log(`[DashboardPage] ✅ AUTO-SELECIONANDO ANO: ${maxYear}`);
      if (IS_DEV) safeLog.info(`[DashboardPage] Definindo ano padrão para: ${maxYear}`);
      setFilters(prev => ({ ...prev, ano: maxYear }));
      setAnoEvolucao(maxYear);
    }
  }, [anosDisponiveis, filters.ano]);

  // Criar uma string estável dos filtros para usar como dependência
  const filtersKey = useMemo(() => {
    return JSON.stringify({
      ano: filters.ano,
      semana: filters.semana,
      praca: filters.praca,
      subPraca: filters.subPraca,
      origem: filters.origem,
      turno: filters.turno,
      // Incluir arrays de filtros múltiplos
      subPracas: filters.subPracas,
      origens: filters.origens,
      turnos: filters.turnos,
      semanas: filters.semanas,
      filtroModo: filters.filtroModo,
      dataInicial: filters.dataInicial,
      dataFinal: filters.dataFinal,
    });
  }, [
    filters.ano,
    filters.semana,
    filters.praca,
    filters.subPraca,
    filters.origem,
    filters.turno,
    // Incluir arrays como dependências (usar JSON.stringify para comparação profunda)
    JSON.stringify(filters.subPracas),
    JSON.stringify(filters.origens),
    JSON.stringify(filters.turnos),
    JSON.stringify(filters.semanas),
    filters.filtroModo,
    filters.dataInicial,
    filters.dataFinal,
  ]);

  const currentUserKey = useMemo(() => {
    return currentUser ? JSON.stringify({
      is_admin: currentUser.is_admin,
      assigned_pracas: currentUser.assigned_pracas,
    }) : 'null';
  }, [currentUser?.is_admin, currentUser?.assigned_pracas?.join(',')]);

  // Memoizar filterPayload
  const filterPayload = useMemo(() => {
    if (IS_DEV) {
      safeLog.info('[DashboardPage] Gerando filterPayload com:', {
        filters,
        filtersAno: filters.ano,
        filtersSemana: filters.semana,
        currentUser: currentUser ? { is_admin: currentUser.is_admin, hasAssignedPracas: currentUser.assigned_pracas.length > 0 } : null,
      });
    }
    try {
      const payload = buildFilterPayload(filters, currentUser);

      if (IS_DEV) {
        safeLog.info('[DashboardPage] filterPayload gerado com sucesso:', {
          payload,
          p_ano: payload.p_ano,
          p_semana: payload.p_semana,
          p_data_inicial: payload.p_data_inicial,
          p_data_final: payload.p_data_final,
        });
      }
      return payload;
    } catch (error) {
      safeLog.error('[DashboardPage] Erro ao gerar filterPayload:', error);
      throw error;
    }
    // Usar apenas as chaves estáveis, não os objetos completos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, currentUserKey]);

  const { data: tabData, loading: loadingTabData } = useTabData(activeTab, filterPayload, currentUser);

  // Mapeia os dados do useTabData para as props dos componentes de view
  const { utrData, entregadoresData, valoresData, prioridadeData } = useTabDataMapper({
    activeTab,
    tabData,
  });

  const { sessionId, isPageVisible, registrarAtividade } = useUserActivity(activeTab, filters, currentUser);

  // Ajustar automaticamente o ano da evolução
  useEffect(() => {
    if (Array.isArray(anosDisponiveis) && anosDisponiveis.length > 0) {
      if (!anosDisponiveis.includes(anoEvolucao)) {
        const ultimoAno = anosDisponiveis[anosDisponiveis.length - 1];
        setAnoEvolucao(ultimoAno);
      }
    }
  }, [anosDisponiveis, anoEvolucao]);

  // Inicializar automaticamente os filtros quando os dados de dimensões são carregados
  const filtersInitializedRef = useRef(false);
  const hasTriedInitializeRef = useRef(false);
  const filtersProtectedRef = useRef(false);

  // Wrapper para setFilters que protege ano e semana após inicialização
  const setFiltersProtected = useCallback((newFilters: Filters | ((prev: Filters) => Filters)) => {
    const stackTrace = new Error().stack;

    // Type guard para verificar se é função
    const isFunction = typeof newFilters === 'function';

    if (isFunction) {
      const updater = newFilters as (prev: Filters) => Filters;
      setFilters((prev) => {
        const updated = updater(prev);

        // LOG: Rastrear mudanças nos arrays de filtros
        if (prev.subPracas?.length !== updated.subPracas?.length ||
          prev.origens?.length !== updated.origens?.length ||
          prev.turnos?.length !== updated.turnos?.length) {
          console.log('🔴 [setFiltersProtected] Arrays de filtros mudaram:', {
            antes: {
              subPracas: prev.subPracas?.length || 0,
              origens: prev.origens?.length || 0,
              turnos: prev.turnos?.length || 0,
            },
            depois: {
              subPracas: updated.subPracas?.length || 0,
              origens: updated.origens?.length || 0,
              turnos: updated.turnos?.length || 0,
            },
            stackTrace: stackTrace?.split('\n').slice(1, 4).join('\n'),
          });
        }

        // Proteger ano e semana se já foram inicializados
        if (filtersProtectedRef.current) {
          const wouldResetAno = prev.ano !== null && updated.ano === null;
          const wouldResetSemana = prev.semana !== null && updated.semana === null;

          if (wouldResetAno || wouldResetSemana) {
            console.warn('🛡️ [DashboardPage] BLOQUEANDO reset de filtros protegidos:', {
              wouldResetAno,
              wouldResetSemana,
              previous: { ano: prev.ano, semana: prev.semana },
              attempted: { ano: updated.ano, semana: updated.semana },
              stackTrace: stackTrace?.split('\n').slice(0, 5).join('\n'),
            });

            // Manter valores anteriores de ano e semana
            return {
              ...updated,
              ano: wouldResetAno ? prev.ano : updated.ano,
              semana: wouldResetSemana ? prev.semana : updated.semana,
            };
          }
        }

        return updated;
      });
    } else {
      // Proteger ano e semana se já foram inicializados
      const filtersObj = newFilters as Filters;

      // LOG: Rastrear mudanças nos arrays de filtros
      const currentSubPracas = filters.subPracas?.length || 0;
      const currentOrigens = filters.origens?.length || 0;
      const currentTurnos = filters.turnos?.length || 0;
      const newSubPracas = filtersObj.subPracas?.length || 0;
      const newOrigens = filtersObj.origens?.length || 0;
      const newTurnos = filtersObj.turnos?.length || 0;

      if (currentSubPracas !== newSubPracas || currentOrigens !== newOrigens || currentTurnos !== newTurnos) {
        console.log('🔴 [setFiltersProtected] Arrays de filtros mudaram (obj):', {
          antes: { subPracas: currentSubPracas, origens: currentOrigens, turnos: currentTurnos },
          depois: { subPracas: newSubPracas, origens: newOrigens, turnos: newTurnos },
          stackTrace: stackTrace?.split('\n').slice(1, 4).join('\n'),
        });
      }

      if (filtersProtectedRef.current) {
        const currentAno = filters.ano;
        const currentSemana = filters.semana;
        const wouldResetAno = currentAno !== null && filtersObj.ano === null;
        const wouldResetSemana = currentSemana !== null && filtersObj.semana === null;

        if (wouldResetAno || wouldResetSemana) {
          console.warn('🛡️ [DashboardPage] BLOQUEANDO reset de filtros protegidos:', {
            wouldResetAno,
            wouldResetSemana,
            current: { ano: currentAno, semana: currentSemana },
            attempted: { ano: filtersObj.ano, semana: filtersObj.semana },
            stackTrace: stackTrace?.split('\n').slice(0, 5).join('\n'),
          });

          // Manter valores anteriores de ano e semana
          const protectedFilters: Filters = {
            ...filtersObj,
            ano: wouldResetAno ? currentAno : filtersObj.ano,
            semana: wouldResetSemana ? currentSemana : filtersObj.semana,
          };

          setFilters(protectedFilters);
          return;
        }
      }

      setFilters(filtersObj);
    }
  }, [filters]);

  // Função para mudar de aba
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  return {
    // Auth
    isCheckingAuth,
    isAuthenticated,
    currentUser,

    // Tabs e Filtros
    activeTab,
    filters,
    setFilters: setFiltersProtected,
    handleTabChange,

    // Dados do Dashboard
    aderenciaGeral,
    aderenciaDia,
    aderenciaTurno,
    aderenciaSubPraca,
    aderenciaOrigem,
    totals,
    anosDisponiveis,
    semanasDisponiveis,
    pracas,
    subPracas,
    origens,
    turnos,
    loading,
    error,

    // Dados de Evolução
    evolucaoMensal,
    evolucaoSemanal,
    loadingEvolucao,
    anoSelecionado: anoEvolucao,
    setAnoEvolucao,

    // Dados de Tabs
    utrData,
    entregadoresData,
    valoresData,
    prioridadeData,
    loadingTabData,

    // Chart
    chartReady,
  };
}
