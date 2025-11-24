import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Filters } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';

const IS_DEV = process.env.NODE_ENV === 'development';

// Flag para rastrear se a função registrar_atividade está disponível
// null = ainda não verificou, true = disponível, false = indisponível
// Usar um objeto para garantir que a referência seja mantida
const functionAvailability = {
  status: null as boolean | null,
  lastCheck: 0 as number,
  checkInterval: 60000 // Verificar novamente após 1 minuto se foi marcada como indisponível
};

/**
 * Hook para gerenciar atividade e sessão do usuário
 * 
 * Rastreia atividade do usuário, gerencia sessão e registra ações no sistema.
 * Inclui detecção de visibilidade da página e limpeza automática de sessões inativas.
 * 
 * @param {string} activeTab - Aba ativa do dashboard
 * @param {DashboardFilters | Record<string, unknown>} filters - Filtros atuais aplicados
 * @param {CurrentUser | null} currentUser - Usuário atual
 * @returns {Object} Objeto contendo sessionId, isPageVisible e função registrarAtividade
 * 
 * @example
 * ```typescript
 * const { sessionId, isPageVisible, registrarAtividade } = useUserActivity(
 *   'dashboard',
 *   filters,
 *   currentUser
 * );
 * 
 * registrarAtividade('view', { view: 'dashboard' }, 'dashboard', filters);
 * ```
 */
import type { DashboardFilters } from '@/types/filters';
import type { CurrentUser } from '@/types';

export function useUserActivity(
  activeTab: string,
  filters: DashboardFilters | Record<string, unknown>,
  currentUser: CurrentUser | null
) {
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');

  // Obter sessionId do Supabase com retry e listener
  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout | null = null;
    
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session?.user?.id) {
          setSessionId(session.user.id);
          if (IS_DEV) {
            safeLog.info('SessionId capturado:', session.user.id);
          }
        } else if (mounted) {
          // Tentar novamente após 1 segundo se não conseguir na primeira tentativa
          retryTimeout = setTimeout(async () => {
            if (!mounted) return;
            try {
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              if (retrySession?.user?.id && mounted) {
                setSessionId(retrySession.user.id);
                if (IS_DEV) {
                  safeLog.info('SessionId capturado no retry:', retrySession.user.id);
                }
              }
            } catch (err) {
              if (IS_DEV) {
                safeLog.warn('Erro ao capturar sessionId no retry:', err);
              }
            }
          }, 1000);
        }
      } catch (err) {
        if (IS_DEV) {
          safeLog.warn('Erro ao capturar sessionId:', err);
        }
      }
    };
    
    // Capturar sessionId inicial
    getSession();
    
    // Listener para mudanças na sessão
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted && session?.user?.id) {
        setSessionId(session.user.id);
        if (IS_DEV) {
          safeLog.info('SessionId atualizado via listener:', session.user.id);
        }
      } else if (mounted && event === 'SIGNED_OUT') {
        setSessionId('');
      }
    });

    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      subscription.unsubscribe();
    };
  }, []);

  // Usar refs para evitar dependências desnecessárias
  const activeTabRef = useRef(activeTab);
  const filtersRef = useRef(filters);
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    activeTabRef.current = activeTab;
    filtersRef.current = filters;
    currentUserRef.current = currentUser;
  }, [activeTab, filters, currentUser]);

  // Função para registrar atividade
  const registrarAtividade = useCallback(async (
    action_type: string,
    action_details: Record<string, unknown> = {},
    tab_name: string | null = null,
    filters_applied: DashboardFilters | Record<string, unknown> = {}
  ) => {
    // Verificar se há usuário autenticado e sessionId
    if (!currentUserRef.current || !sessionId) {
      // Se não há usuário ou sessionId, não tentar registrar
      return;
    }

    // Se já sabemos que a função não está disponível, verificar se podemos tentar novamente
    if (functionAvailability.status === false) {
      const timeSinceLastCheck = Date.now() - functionAvailability.lastCheck;
      // Se ainda não passou o intervalo, não tentar chamar
      if (timeSinceLastCheck < functionAvailability.checkInterval) {
        return;
      }
      // Resetar status para tentar novamente
      functionAvailability.status = null;
    }
    
    try {
      let descricaoDetalhada = '';
      const tabNames: Record<string, string> = {
        dashboard: 'Dashboard',
        analise: 'Análise Detalhada',
        comparacao: 'Comparação',
        utr: 'UTR',
        entregadores: 'Entregadores',
        valores: 'Valores',
        prioridade: 'Prioridade/Promo',
        evolucao: 'Evolução'
      };
      const currentTab = tab_name || activeTabRef.current;
      const nomeAba = tabNames[currentTab] || currentTab;

      switch (action_type) {
        case 'filter_change':
          const filtros: string[] = [];
          const filtersObj = filters_applied as Record<string, unknown>;
          if (filtersObj.semana) filtros.push(`Semana ${filtersObj.semana}`);
          if (filtersObj.praca) filtros.push(`Praça: ${filtersObj.praca}`);
          if (filtersObj.sub_praca || filtersObj.subPraca) filtros.push(`Sub-Praça: ${filtersObj.sub_praca || filtersObj.subPraca}`);
          if (filtersObj.origem) filtros.push(`Origem: ${filtersObj.origem}`);
          if (filtersObj.turno) filtros.push(`Turno: ${filtersObj.turno}`);
          
          if (filtros.length > 0) {
            descricaoDetalhada = `Filtrou: ${filtros.join(', ')} na aba ${nomeAba}`;
          } else {
            descricaoDetalhada = `Limpou filtros na aba ${nomeAba}`;
          }
          break;
        case 'tab_change':
          descricaoDetalhada = `Acessou a aba ${nomeAba}`;
          break;
        case 'login':
          descricaoDetalhada = 'Fez login no sistema';
          break;
        case 'heartbeat':
          descricaoDetalhada = `Navegando na aba ${nomeAba}`;
          break;
        case 'page_visible':
          descricaoDetalhada = `Voltou para a aba ${nomeAba}`;
          break;
        case 'page_hidden':
          descricaoDetalhada = `Saiu da aba ${nomeAba}`;
          break;
        default:
          descricaoDetalhada = typeof action_details === 'string' ? action_details : `${action_type} na aba ${nomeAba}`;
      }
      
      // Garantir que sessionId não está vazio
      if (!sessionId || sessionId.trim() === '') {
        if (IS_DEV) {
          safeLog.warn('Tentativa de registrar atividade sem sessionId válido');
        }
        return;
      }

      const { data, error } = await safeRpc('registrar_atividade', {
        p_session_id: sessionId,
        p_action_type: action_type,
        p_action_details: descricaoDetalhada || null,
        p_tab_name: tab_name || activeTabRef.current || null,
        p_filters_applied: filters_applied && Object.keys(filters_applied).length > 0 ? filters_applied : null
      }, {
        timeout: 10000, // Reduzido para 10s para evitar timeouts longos
        validateParams: false // Desabilitar validação para evitar problemas com tipos
      });

      if (error) {
        // Ignorar erros 404 (função não encontrada) e heartbeat silenciosamente
        const errorCode = error?.code;
        const errorMessage = String(error?.message || '');
        const is404 = errorCode === 'PGRST116' || errorCode === '42883' || 
                      errorCode === 'PGRST204' ||
                      errorMessage.includes('404') || 
                      errorMessage.includes('not found') ||
                      (errorMessage.includes('function') && errorMessage.includes('does not exist'));
        
        if (is404) {
          // Marcar função como indisponível para evitar chamadas futuras
          functionAvailability.status = false;
          functionAvailability.lastCheck = Date.now();
          // Não logar em produção e não tentar novamente
          return;
        } else {
          // Se não for 404, a função existe mas teve outro erro
          // Marcar como disponível para não bloquear tentativas futuras
          if (functionAvailability.status === null) {
            functionAvailability.status = true;
          }
          
          // Para heartbeat, ignorar silenciosamente todos os erros
          if (action_type === 'heartbeat') {
            return;
          }
          
          // Apenas logar erros não-404 e não-heartbeat em desenvolvimento
          if (IS_DEV) {
            safeLog.warn('Erro ao registrar atividade:', { error, action_type });
          }
        }
      } else {
        // Sucesso - marcar função como disponível
        if (functionAvailability.status === null) {
          functionAvailability.status = true;
        }
        functionAvailability.lastCheck = Date.now();
      }
    } catch (err) {
      if (action_type !== 'heartbeat') {
        safeLog.error('Erro inesperado ao registrar atividade:', err);
      }
    }
  }, [sessionId]);

  // Debounce para evitar múltiplas chamadas quando há mudanças rápidas de tab
  const tabChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!currentUserRef.current || !sessionId) return;
    
    // Limpar timeout anterior se existir
    if (tabChangeTimeoutRef.current) {
      clearTimeout(tabChangeTimeoutRef.current);
    }

    // Adicionar pequeno delay para evitar race conditions
    tabChangeTimeoutRef.current = setTimeout(() => {
      registrarAtividade('tab_change', { tab: activeTabRef.current }, activeTabRef.current, filtersRef.current);
    }, 150); // 150ms de debounce

    return () => {
      if (tabChangeTimeoutRef.current) {
        clearTimeout(tabChangeTimeoutRef.current);
      }
    };
  }, [activeTab, sessionId, registrarAtividade]);

  useEffect(() => {
    if (!currentUserRef.current || !sessionId) return;
    
    if (Object.values(filtersRef.current).some(v => v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : true))) {
      registrarAtividade('filter_change', { filters: filtersRef.current }, activeTabRef.current, filtersRef.current);
    }
    // eslint-disable-line react-hooks/exhaustive-deps
    // registrarAtividade é estável e não precisa estar nas dependências
  }, [JSON.stringify(filters), sessionId, registrarAtividade]);

  useEffect(() => {
    if (!sessionId) return;
    
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);
      
      if (currentUserRef.current && sessionId) {
        if (visible) {
          registrarAtividade('page_visible', {}, activeTabRef.current, filtersRef.current);
        } else {
          registrarAtividade('page_hidden', {}, activeTabRef.current, filtersRef.current);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-line react-hooks/exhaustive-deps
    // registrarAtividade é estável e não precisa estar nas dependências
  }, [sessionId, registrarAtividade]);

  useEffect(() => {
    if (!currentUserRef.current || !sessionId) return;
    
    // Registrar login apenas uma vez quando o usuário é carregado
    const loginTimeout = setTimeout(() => {
      registrarAtividade('login', { dispositivo: 'web' }, activeTabRef.current, filtersRef.current);
    }, 500); // Pequeno delay para garantir que tudo está inicializado
    
    const heartbeatInterval = setInterval(() => {
      // Só enviar heartbeat se a função estiver disponível e a página estiver visível
      if (currentUserRef.current && isPageVisible && sessionId && functionAvailability.status !== false) {
        registrarAtividade('heartbeat', {}, activeTabRef.current, filtersRef.current);
      }
    }, 60000); // A cada 1 minuto

    return () => {
      clearTimeout(loginTimeout);
      clearInterval(heartbeatInterval);
    };
    // eslint-disable-line react-hooks/exhaustive-deps
    // registrarAtividade é estável e não precisa estar nas dependências
  }, [currentUser, isPageVisible, sessionId, registrarAtividade]);

  return { sessionId, isPageVisible, registrarAtividade };
}
