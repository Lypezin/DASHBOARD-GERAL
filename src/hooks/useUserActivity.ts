import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Filters } from '@/types';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

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
      
      const { data, error } = await supabase.rpc('registrar_atividade', {
        p_session_id: sessionId,
        p_action_type: action_type,
        p_action_details: descricaoDetalhada,
        p_tab_name: tab_name || activeTabRef.current,
        p_filters_applied: filters_applied as any
      });

      if (error) {
        // Não logar 'heartbeat' para não poluir o console
        if (action_type !== 'heartbeat') {
          safeLog.warn('Erro ao registrar atividade:', { error, action_type });
        }
      }
    } catch (err) {
      if (action_type !== 'heartbeat') {
        safeLog.error('Erro inesperado ao registrar atividade:', err);
      }
    }
  }, [sessionId]);

  useEffect(() => {
    if (currentUserRef.current) {
      registrarAtividade('tab_change', { tab: activeTabRef.current }, activeTabRef.current, filtersRef.current);
    }
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
    if (currentUserRef.current) {
      registrarAtividade('login', { dispositivo: 'web' }, activeTabRef.current, filtersRef.current);
      
      const heartbeatInterval = setInterval(() => {
        if (currentUserRef.current && isPageVisible) {
          registrarAtividade('heartbeat', {}, activeTabRef.current, filtersRef.current);
        }
      }, 60000); // A cada 1 minuto

      return () => clearInterval(heartbeatInterval);
    }
  }, [currentUser, isPageVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  return { sessionId, isPageVisible, registrarAtividade };
}
