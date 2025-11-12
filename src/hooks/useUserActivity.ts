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

export function useUserActivity(activeTab: string, filters: any, currentUser: { is_admin: boolean; assigned_pracas: string[] } | null) {
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');

  // Obter sessionId do Supabase
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setSessionId(session.user.id);
      }
    };
    getSession();
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
    action_details: any = {},
    tab_name: string | null = null,
    filters_applied: any = {}
  ) => {
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
        evolucao: 'Evolução',
        monitoramento: 'Monitoramento'
      };
      const currentTab = tab_name || activeTabRef.current;
      const nomeAba = tabNames[currentTab] || currentTab;

      switch (action_type) {
        case 'filter_change':
          const filtros: string[] = [];
          if (filters_applied.semana) filtros.push(`Semana ${filters_applied.semana}`);
          if (filters_applied.praca) filtros.push(`Praça: ${filters_applied.praca}`);
          if (filters_applied.sub_praca) filtros.push(`Sub-Praça: ${filters_applied.sub_praca}`);
          if (filters_applied.origem) filtros.push(`Origem: ${filters_applied.origem}`);
          if (filters_applied.turno) filtros.push(`Turno: ${filters_applied.turno}`);
          
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
      
      const { data, error } = await safeRpc('registrar_atividade', {
        p_session_id: sessionId,
        p_action_type: action_type,
        p_action_details: descricaoDetalhada,
        p_tab_name: tab_name || activeTabRef.current,
        p_filters_applied: filters_applied as any
      }, {
        timeout: 30000,
        validateParams: true
      });

      if (error) {
        // Ignorar erros 404 (função não encontrada) e heartbeat silenciosamente
        const errorCode = (error as any)?.code;
        const errorMessage = String((error as any)?.message || '');
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
    if (!currentUserRef.current) return;
    
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
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentUserRef.current && Object.values(filtersRef.current).some(v => v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : true))) {
      registrarAtividade('filter_change', { filters: filtersRef.current }, activeTabRef.current, filtersRef.current);
    }
  }, [JSON.stringify(filters)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);
      
      if (currentUserRef.current) {
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!currentUserRef.current) return;
    
    // Registrar login apenas uma vez quando o usuário é carregado
    const loginTimeout = setTimeout(() => {
      registrarAtividade('login', { dispositivo: 'web' }, activeTabRef.current, filtersRef.current);
    }, 500); // Pequeno delay para garantir que tudo está inicializado
    
    const heartbeatInterval = setInterval(() => {
      // Só enviar heartbeat se a função estiver disponível e a página estiver visível
      if (currentUserRef.current && isPageVisible && functionAvailability.status !== false) {
        registrarAtividade('heartbeat', {}, activeTabRef.current, filtersRef.current);
      }
    }, 60000); // A cada 1 minuto

    return () => {
      clearTimeout(loginTimeout);
      clearInterval(heartbeatInterval);
    };
  }, [currentUser, isPageVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  return { sessionId, isPageVisible, registrarAtividade };
}
