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
import { useDashboardFilters } from './useDashboardFilters';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useDashboardPage() {

  const { isChecking: isCheckingAuth, isAuthenticated, currentUser: authUser } = useAuthGuard({
    requireApproval: true,
    fetchUserProfile: true,
  });

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const { filters, setFilters, filtersProtectedRef } = useDashboardFilters();

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
  // Selecionar automaticamente o ano mais recente se nenhum estiver selecionado ou se o ano selecionado não estiver disponível
  useEffect(() => {
    if (anosDisponiveis && anosDisponiveis.length > 0) {
      const shouldSelect = !filters.ano || !anosDisponiveis.includes(filters.ano);

      if (shouldSelect) {
        const maxYear = Math.max(...anosDisponiveis);
        if (IS_DEV) safeLog.info(`[DashboardPage] Definindo ano padrão para: ${maxYear}`);
        setFilters(prev => ({ ...prev, ano: maxYear }));
        setAnoEvolucao(maxYear);
      }
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
