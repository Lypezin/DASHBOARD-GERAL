/**
 * Hook para gerenciar estado principal da página do dashboard
 * Extraído de src/app/page.tsx para melhor organização
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
    aderenciaGeral,
  } = useDashboardData(filters, activeTab, anoEvolucao, currentUser);

  // Memoizar filterPayload
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
  useEffect(() => {
    // Só inicializar se os filtros ainda estão vazios e os dados estão disponíveis
    if (
      !filtersInitializedRef.current &&
      filters.ano === null &&
      filters.semana === null &&
      Array.isArray(anosDisponiveis) &&
      anosDisponiveis.length > 0 &&
      Array.isArray(semanasDisponiveis) &&
      semanasDisponiveis.length > 0
    ) {
      const ultimoAno = anosDisponiveis[anosDisponiveis.length - 1];
      const ultimaSemana = semanasDisponiveis[semanasDisponiveis.length - 1];
      
      // Converter semana de string para número se necessário
      // Suporta formatos: "10", "W10", ou número direto
      let semanaNumero: number;
      if (typeof ultimaSemana === 'string') {
        if (ultimaSemana.includes('W')) {
          const match = ultimaSemana.match(/W(\d+)/);
          semanaNumero = match ? parseInt(match[1], 10) : parseInt(ultimaSemana, 10);
        } else {
          semanaNumero = parseInt(ultimaSemana, 10);
        }
      } else {
        semanaNumero = Number(ultimaSemana);
      }

      if (!isNaN(semanaNumero) && semanaNumero > 0 && semanaNumero <= 53) {
        setFilters(prev => ({
          ...prev,
          ano: ultimoAno,
          semana: semanaNumero,
        }));
        filtersInitializedRef.current = true;
        
        if (IS_DEV) {
          safeLog.info('[DashboardPage] Filtros inicializados automaticamente:', {
            ano: ultimoAno,
            semana: semanaNumero,
          });
        }
      } else if (IS_DEV) {
        safeLog.warn('[DashboardPage] Não foi possível inicializar semana automaticamente:', {
          ultimaSemana,
          semanaNumero,
        });
      }
    }
  }, [anosDisponiveis, semanasDisponiveis, filters.ano, filters.semana]);

  // Registrar atividade do usuário com debounce
  const tabChangeTimeoutRef2 = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!currentUser) return;

    if (tabChangeTimeoutRef2.current) {
      clearTimeout(tabChangeTimeoutRef2.current);
    }

    tabChangeTimeoutRef2.current = setTimeout(() => {
      registrarAtividade('tab_change', { message: `Navegou para a aba ${activeTab}`, tab: activeTab }, activeTab, filters);
    }, DELAYS.TAB_CHANGE);

    return () => {
      if (tabChangeTimeoutRef2.current) {
        clearTimeout(tabChangeTimeoutRef2.current);
      }
    };
  }, [activeTab, registrarAtividade, filters, currentUser]);

  // Aplicar filtro automático quando currentUser mudar
  useEffect(() => {
    if (currentUser && !hasFullCityAccess(currentUser) && currentUser.assigned_pracas.length === 1) {
      setFilters(prev => {
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

  // Refs para controlar mudanças de tab
  const tabChangeRef = useRef(false);
  const tabChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentTabRef = useRef(activeTab);

  useEffect(() => {
    currentTabRef.current = activeTab;
  }, [activeTab]);

  // Handler memoizado para mudança de tab
  const handleTabChange = useCallback((tab: TabType) => {
    if (currentTabRef.current === tab) {
      return;
    }

    if (tabChangeTimeoutRef.current) {
      clearTimeout(tabChangeTimeoutRef.current);
    }

    tabChangeRef.current = true;
    setActiveTab(tab);

    tabChangeTimeoutRef.current = setTimeout(() => {
      tabChangeRef.current = false;
    }, DELAYS.TAB_CHANGE_PROTECTION);
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
    totals,
    aderenciaSemanal,
    aderenciaDia,
    aderenciaTurno,
    aderenciaSubPraca,
    aderenciaOrigem,
    aderenciaGeral,
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
    utrSemanal,
    loadingEvolucao,
    anoEvolucao,
    setAnoEvolucao,
    anoSelecionado: anoEvolucao,
    
    // Dados de Tabs
    utrData,
    entregadoresData,
    valoresData,
    prioridadeData,
    loadingTabData,
    
    // UI State
    chartReady,
  };
}

