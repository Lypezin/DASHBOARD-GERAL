/**
 * Hook para gerenciar estado principal da página do dashboard
 * Extraído de src/app/page.tsx para melhor organização
 */

import { useState, useEffect, useMemo, useCallback } from 'react';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useTabData } from '@/hooks/useTabData';
import { useTabDataMapper } from '@/hooks/useTabDataMapper';
import { useUserActivity } from '@/hooks/useUserActivity';
import { registerChartJS } from '@/lib/chartConfig';
import { safeLog } from '@/lib/errorHandler';
import { buildFilterPayload } from '@/utils/helpers';
import type { CurrentUser, TabType } from '@/types';
import { useDashboardFilters } from './useDashboardFilters';
import { useEvolutionAutoSelect } from './useEvolutionAutoSelect';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useDashboardPage() {

  const { isChecking: isCheckingAuth, isAuthenticated, currentUser: authUser } = useAuthGuard({
    requireApproval: true,
    fetchUserProfile: true,
  });

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [anoEvolucao, setAnoEvolucao] = useState<number>(new Date().getFullYear());

  const { filters, setFilters } = useDashboardFilters();

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

  // 1. Obter dados (incluindo anosDisponiveis)
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

  // 2. Usar o hook de lógica de evolução (não controla estado, apenas side-effects)
  useEvolutionAutoSelect({
    filters,
    setFilters,
    anosDisponiveis: anosDisponiveis || [],
    anoEvolucao,
    setAnoEvolucao
  });

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
  }, [currentUser?.is_admin, currentUser?.assigned_pracas]);

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
      return payload;
    } catch (error) {
      safeLog.error('[DashboardPage] Erro ao gerar filterPayload:', error);
      throw error;
    }
  }, [filtersKey, currentUserKey, filters, currentUser]);

  const { data: tabData, loading: loadingTabData } = useTabData(activeTab, filterPayload, currentUser);

  // Mapeia os dados do useTabData para as props dos componentes de view
  const { utrData, entregadoresData, valoresData, prioridadeData } = useTabDataMapper({
    activeTab,
    tabData,
  });

  const { sessionId, isPageVisible, registrarAtividade } = useUserActivity(activeTab, filters, currentUser);

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
    setFilters,
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
