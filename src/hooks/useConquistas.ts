import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Conquista, ConquistaNova } from '@/types/conquistas';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

export interface RankingUsuario {
  posicao: number;
  user_id: string;
  nome_usuario: string;
  total_conquistas: number;
  total_pontos: number;
  conquistas_recentes: string[];
  avatar_url: string | null;
}

export function useConquistas() {
  const [conquistas, setConquistas] = useState<Conquista[]>([]);
  const [conquistasNovas, setConquistasNovas] = useState<ConquistaNova[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPontos, setTotalPontos] = useState(0);
  const [ranking, setRanking] = useState<RankingUsuario[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);

  // Carregar conquistas do usuário
  const carregarConquistas = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('listar_conquistas_usuario');
      
      if (error) {
        safeLog.error('Erro ao carregar conquistas:', error);
        setConquistas([]);
        return;
      }

      if (data) {
        setConquistas(data as Conquista[]);
        
        // Calcular total de pontos
        const pontos = (data as Conquista[])
          .filter(c => c.conquistada)
          .reduce((sum, c) => sum + c.pontos, 0);
        setTotalPontos(pontos);
      }
    } catch (err) {
      safeLog.error('Erro inesperado ao carregar conquistas:', err);
      setConquistas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Verificar novas conquistas (com tratamento de erro silencioso)
  const verificarConquistas = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('verificar_conquistas');
      
      if (error) {
        // Silenciar erros 400 (Bad Request) e outros erros esperados
        // Erros 400 podem ocorrer quando a função não encontra dados ou quando há problemas de permissão
        const errorMessage = error.message || '';
        const isExpectedError = 
          errorMessage.includes('400') || 
          errorMessage.includes('Bad Request') ||
          error.code === 'P0001' ||
          error.code === '42803'; // Erro de tipo de dados
        
        if (!isExpectedError && IS_DEV) {
          safeLog.warn('Erro ao verificar conquistas:', error);
        }
        return;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        setConquistasNovas(data as ConquistaNova[]);
        // Recarregar lista de conquistas
        await carregarConquistas();
      }
    } catch (err) {
      // Silenciar erros em produção, apenas logar em desenvolvimento
      if (IS_DEV) {
        safeLog.error('Erro inesperado ao verificar conquistas:', err);
      }
    }
  }, [carregarConquistas]);

  // Marcar conquista como visualizada
  const marcarVisualizada = useCallback(async (conquistaId: string) => {
    try {
      const { error } = await supabase.rpc('marcar_conquista_visualizada', {
        p_conquista_id: conquistaId
      });
      
      if (error) {
        safeLog.error('Erro ao marcar conquista:', error);
        return false;
      }

      // Atualizar estado local
      setConquistas(prev =>
        prev.map(c =>
          c.conquista_id === conquistaId ? { ...c, visualizada: true } : c
        )
      );

      return true;
    } catch (err) {
      safeLog.error('Erro inesperado ao marcar conquista:', err);
      return false;
    }
  }, []);

  // Remover conquista nova da lista de notificações
  const removerConquistaNova = useCallback((codigo: string) => {
    setConquistasNovas(prev => prev.filter(c => c.conquista_codigo !== codigo));
  }, []);

  // Verificar conquistas baseadas em dados do dashboard
  const verificarConquistasDashboard = useCallback(async (
    aderenciaGeral?: number,
    taxaCompletude?: number,
    utrGeral?: number
  ) => {
    try {
      const { data, error } = await supabase.rpc('verificar_conquistas_dashboard', {
        p_aderencia_geral: aderenciaGeral ?? null,
        p_taxa_completude: taxaCompletude ?? null,
        p_utr_geral: utrGeral ?? null
      });
      
      if (error) {
        safeLog.warn('Erro ao verificar conquistas do dashboard:', error);
        return;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        setConquistasNovas(prev => [...prev, ...(data as ConquistaNova[])]);
        // Recarregar lista de conquistas
        await carregarConquistas();
      }
    } catch (err) {
      safeLog.error('Erro inesperado ao verificar conquistas do dashboard:', err);
    }
  }, [carregarConquistas]);

  // Carregar ranking de usuários
  const carregarRanking = useCallback(async () => {
    setLoadingRanking(true);
    try {
      const { data, error } = await supabase.rpc('ranking_conquistas');
      
      if (error) {
        safeLog.error('Erro ao carregar ranking:', error);
        setRanking([]);
        return;
      }

      if (data) {
        setRanking(data as RankingUsuario[]);
      }
    } catch (err) {
      safeLog.error('Erro inesperado ao carregar ranking:', err);
      setRanking([]);
    } finally {
      setLoadingRanking(false);
    }
  }, []);

  // Carregar conquistas ao montar
  useEffect(() => {
    carregarConquistas();
  }, [carregarConquistas]);

  // Verificar conquistas periodicamente (a cada 5 minutos para reduzir carga)
  useEffect(() => {
    // Verificar uma vez ao montar com delay para não sobrecarregar na inicialização
    const initialTimeout = setTimeout(() => {
      verificarConquistas();
    }, 5000); // Delay de 5 segundos na inicialização
    
    const interval = setInterval(() => {
      verificarConquistas();
    }, 300000); // 5 minutos (300 segundos) - reduzido de 60 segundos

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Estatísticas (memoizadas para evitar recálculos desnecessários)
  const stats = useMemo(() => {
    const conquistadas = conquistas.filter(c => c.conquistada).length;
    return {
      total: conquistas.length,
      conquistadas,
      pontos: totalPontos,
      progresso: conquistas.length > 0 
        ? Math.round((conquistadas / conquistas.length) * 100)
        : 0
    };
  }, [conquistas, totalPontos]);

  return {
    conquistas,
    conquistasNovas,
    loading,
    stats,
    ranking,
    loadingRanking,
    carregarConquistas,
    verificarConquistas,
    verificarConquistasDashboard,
    marcarVisualizada,
    removerConquistaNova,
    carregarRanking
  };
}

