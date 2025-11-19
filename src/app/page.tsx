'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
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
const EntregadoresMainView = dynamic(() => import('@/components/views/EntregadoresMainView').then(mod => ({ default: mod.default })), {
  loading: () => <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div></div>,
  ssr: false
});
const PrioridadePromoView = dynamic(() => import('@/components/views/PrioridadePromoView').then(mod => ({ default: mod.default })), {
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

type TabType = 'dashboard' | 'analise' | 'utr' | 'entregadores' | 'valores' | 'evolucao' | 'prioridade' | 'comparacao' | 'marketing';


// =================================================================================
// Funções auxiliares
// =================================================================================



// =================================================================================
// Componente Principal
// =================================================================================

const IS_DEV = process.env.NODE_ENV === 'development';

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
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
  }, []); // Apenas no mount inicial
  const [anoEvolucao, setAnoEvolucao] = useState<number>(new Date().getFullYear());
  const [currentUser, setCurrentUser] = useState<{ is_admin: boolean; assigned_pracas: string[] } | null>(null);
  const [chartReady, setChartReady] = useState(false);

  // Verificar autenticação antes de permitir acesso
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // PRIMEIRO: Limpar qualquer sessão inválida do localStorage antes de verificar
        if (typeof window !== 'undefined') {
          // Verificar se há tokens antigos que podem estar causando problemas
          const hasOldTokens = Array.from({ length: localStorage.length }, (_, i) => {
            const key = localStorage.key(i);
            return key && (key.startsWith('sb-') || key.includes('supabase'));
          }).some(Boolean);
          
          if (hasOldTokens) {
            // Verificar se a sessão é válida antes de limpar
            const { data: { session: testSession } } = await supabase.auth.getSession();
            if (!testSession || !testSession.user) {
              // Sessão inválida - limpar tudo
              if (IS_DEV) {
                safeLog.warn('[DashboardPage] Limpando sessões inválidas do localStorage');
              }
              const keysToRemove: string[] = [];
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
                  keysToRemove.push(key);
                }
              }
              keysToRemove.forEach(key => localStorage.removeItem(key));
            }
          }
        }
        
        // Verificar sessão atual (não apenas getUser, mas também getSession para garantir validade)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session || !session.user) {
          // Sem sessão válida - limpar qualquer sessão antiga e redirecionar
          if (IS_DEV) {
            safeLog.warn('[DashboardPage] Sem sessão válida, limpando e redirecionando para login');
          }
          await supabase.auth.signOut();
          // Limpar localStorage do Supabase
          if (typeof window !== 'undefined') {
            localStorage.removeItem('supabase.auth.token');
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
          }
          router.push('/login');
          return;
        }
        
        // Verificar se o token da sessão ainda é válido fazendo uma chamada ao servidor
        try {
          const { data: { user: verifiedUser }, error: verifyError } = await supabase.auth.getUser();
          if (verifyError || !verifiedUser) {
            // Token inválido - limpar e redirecionar
            if (IS_DEV) {
              safeLog.warn('[DashboardPage] Token inválido, limpando e redirecionando para login');
            }
            await supabase.auth.signOut();
            if (typeof window !== 'undefined') {
              localStorage.removeItem('supabase.auth.token');
              const keysToRemove: string[] = [];
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
                  keysToRemove.push(key);
                }
              }
              keysToRemove.forEach(key => localStorage.removeItem(key));
            }
            router.push('/login');
            return;
          }
        } catch (verifyErr) {
          // Erro ao verificar token - limpar e redirecionar
          if (IS_DEV) {
            safeLog.warn('[DashboardPage] Erro ao verificar token, limpando e redirecionando para login:', verifyErr);
          }
          await supabase.auth.signOut();
          if (typeof window !== 'undefined') {
            localStorage.removeItem('supabase.auth.token');
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
          }
          router.push('/login');
          return;
        }

        // Verificar se o usuário está aprovado
        try {
          const { data: profile, error: profileError } = await safeRpc<{ is_approved: boolean }>('get_current_user_profile', {}, {
            timeout: 10000,
            validateParams: false
          });

          if (profileError) {
            // Erro ao buscar perfil - fazer logout e redirecionar
            if (IS_DEV) {
              safeLog.warn('[DashboardPage] Erro ao buscar perfil, fazendo logout:', profileError);
            }
            await supabase.auth.signOut();
            if (typeof window !== 'undefined') {
              localStorage.removeItem('supabase.auth.token');
            }
            router.push('/login');
            return;
          }

          if (!profile?.is_approved) {
            // Usuário não aprovado - fazer logout e redirecionar
            if (IS_DEV) {
              safeLog.warn('[DashboardPage] Usuário não aprovado, fazendo logout');
            }
            await supabase.auth.signOut();
            if (typeof window !== 'undefined') {
              localStorage.removeItem('supabase.auth.token');
            }
            router.push('/login');
            return;
          }

          // Usuário autenticado e aprovado
          setIsAuthenticated(true);
        } catch (err) {
          // Erro ao verificar perfil - fazer logout e redirecionar
          if (IS_DEV) {
            safeLog.error('[DashboardPage] Erro ao verificar perfil:', err);
          }
          await supabase.auth.signOut();
          if (typeof window !== 'undefined') {
            localStorage.removeItem('supabase.auth.token');
          }
          router.push('/login');
        }
      } catch (err) {
        // Erro inesperado - fazer logout e redirecionar
        if (IS_DEV) {
          safeLog.error('[DashboardPage] Erro ao verificar autenticação:', err);
        }
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase.auth.token');
        }
        router.push('/login');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, [router]);

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
        const { data: profile, error } = await safeRpc<{ is_admin: boolean; assigned_pracas: string[]; role?: 'admin' | 'marketing' | 'user' }>('get_current_user_profile', {}, {
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
          // Aplicar filtro automático se não for admin nem marketing e tiver apenas uma praça
          // Marketing tem acesso a todas as cidades, então não precisa aplicar filtro automático
          const isMarketing = profile.role === 'marketing';
          if (!profile.is_admin && !isMarketing && profile.assigned_pracas.length === 1) {
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
  const handleTabChange = useCallback((tab: TabType) => {
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
            {activeTab !== 'comparacao' && activeTab !== 'marketing' && (
              <div className="relative group z-0">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300/20 to-blue-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative bg-gradient-to-br from-white via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/10 rounded-3xl border-0 shadow-xl p-4 sm:p-6 backdrop-blur-sm overflow-hidden">
                  <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-blue-400/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="relative flex gap-3 pb-2">
                    <TabButton label="Dashboard" active={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} />
                    <TabButton label="Análise" active={activeTab === 'analise'} onClick={() => handleTabChange('analise')} />
                    <TabButton label="UTR" active={activeTab === 'utr'} onClick={() => handleTabChange('utr')} />
                    <TabButton label="Entregadores" active={activeTab === 'entregadores'} onClick={() => handleTabChange('entregadores')} />
                    <TabButton label="Valores" active={activeTab === 'valores'} onClick={() => handleTabChange('valores')} />
                    <TabButton label="Prioridade/Promo" active={activeTab === 'prioridade'} onClick={() => handleTabChange('prioridade')} />
                    <TabButton label="Evolução" active={activeTab === 'evolucao'} onClick={() => handleTabChange('evolucao')} />
                    <TabButton label="Comparar" active={(activeTab as TabType) === 'comparacao'} onClick={() => handleTabChange('comparacao')} />
                    <TabButton label="Marketing" active={(activeTab as TabType) === 'marketing'} onClick={() => handleTabChange('marketing')} />
                  </div>
                </div>
              </div>
            )}
            
            {/* Tabs apenas para comparacao e marketing */}
            {(activeTab === 'comparacao' || activeTab === 'marketing') && (
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-4">
                <div className="flex gap-2 pb-2">
                  <TabButton label="Dashboard" active={(activeTab as TabType) === 'dashboard'} onClick={() => handleTabChange('dashboard')} />
                  <TabButton label="Análise" active={(activeTab as TabType) === 'analise'} onClick={() => handleTabChange('analise')} />
                  <TabButton label="UTR" active={(activeTab as TabType) === 'utr'} onClick={() => handleTabChange('utr')} />
                  <TabButton label="Entregadores" active={(activeTab as TabType) === 'entregadores'} onClick={() => handleTabChange('entregadores')} />
                  <TabButton label="Valores" active={(activeTab as TabType) === 'valores'} onClick={() => handleTabChange('valores')} />
                  <TabButton label="Prioridade/Promo" active={(activeTab as TabType) === 'prioridade'} onClick={() => handleTabChange('prioridade')} />
                  <TabButton label="Evolução" active={(activeTab as TabType) === 'evolucao'} onClick={() => handleTabChange('evolucao')} />
                  <TabButton label="Comparar" active={activeTab === 'comparacao'} onClick={() => handleTabChange('comparacao')} />
                  <TabButton label="Marketing" active={activeTab === 'marketing'} onClick={() => handleTabChange('marketing')} />
                </div>
              </div>
            )}

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