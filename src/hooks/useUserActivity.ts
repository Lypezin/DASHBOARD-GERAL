import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useUserActivity(activeTab: string, filters: any, currentUser: { is_admin: boolean; assigned_pracas: string[] } | null, sessionId: string) {
  const [isPageVisible, setIsPageVisible] = useState(true);

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

  useEffect(() => {
    if (currentUser) {
      registrarAtividade('tab_change', { tab: activeTab }, activeTab, filters);
    }
  }, [activeTab, currentUser]);

  useEffect(() => {
    if (currentUser && Object.values(filters).some(v => v !== null)) {
      registrarAtividade('filter_change', { filters }, activeTab, filters);
    }
  }, [filters, currentUser]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);
      
      if (currentUser) {
        if (visible) {
          registrarAtividade('page_visible', {}, activeTab, filters);
        } else {
          registrarAtividade('page_hidden', {}, activeTab, filters);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, activeTab, filters]);

  useEffect(() => {
    if (currentUser) {
      registrarAtividade('login', { dispositivo: 'web' }, activeTab, filters);
      
      const heartbeatInterval = setInterval(() => {
        if (currentUser && isPageVisible) {
          registrarAtividade('heartbeat', {}, activeTab, filters);
        }
      }, 60000); // A cada 1 minuto

      return () => clearInterval(heartbeatInterval);
    }
  }, [currentUser, isPageVisible, activeTab, filters]);

  return { isPageVisible, registrarAtividade };
}
