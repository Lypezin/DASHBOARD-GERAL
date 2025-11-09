import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

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

  const registrarAtividade = async (actionType: string, actionDetails: any = {}, tabName: string | null = null, filtersApplied: any = {}) => {
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
      const nomeAba = tabNames[tabName || activeTab] || tabName || activeTab;

      switch (actionType) {
        case 'filter_change':
          const filtros: string[] = [];
          if (filtersApplied.semana) filtros.push(`Semana ${filtersApplied.semana}`);
          if (filtersApplied.praca) filtros.push(`Praça: ${filtersApplied.praca}`);
          if (filtersApplied.sub_praca) filtros.push(`Sub-Praça: ${filtersApplied.sub_praca}`);
          if (filtersApplied.origem) filtros.push(`Origem: ${filtersApplied.origem}`);
          if (filtersApplied.turno) filtros.push(`Turno: ${filtersApplied.turno}`);
          
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
          descricaoDetalhada = typeof actionDetails === 'string' ? actionDetails : `${actionType} na aba ${nomeAba}`;
      }
      
      await supabase.rpc('registrar_atividade', {
        p_action_type: actionType,
        p_action_details: descricaoDetalhada,
        p_tab_name: tabName || activeTab,
        p_filters_applied: filtersApplied,
        p_session_id: sessionId
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code !== '42883') {
        if (IS_DEV) console.error('Erro ao registrar atividade:', error);
      }
    }
  };

  // Usar refs para evitar dependências desnecessárias
  const activeTabRef = useRef(activeTab);
  const filtersRef = useRef(filters);
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    activeTabRef.current = activeTab;
    filtersRef.current = filters;
    currentUserRef.current = currentUser;
  }, [activeTab, filters, currentUser]);

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
