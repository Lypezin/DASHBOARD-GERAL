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
        // Filtrar conquistas que já estão na lista de notificações para evitar duplicatas
        setConquistasNovas(prev => {
          const codigosExistentes = new Set(prev.map(c => c.conquista_codigo));
          const novas = data as ConquistaNova[];
          const realmenteNovas = novas.filter(c => !codigosExistentes.has(c.conquista_codigo));
          
          // Retornar apenas as realmente novas
          return [...prev, ...realmenteNovas];
        });
        
        // Recarregar lista de conquistas
        await carregarConquistas();
        // Recarregar ranking para atualizar posições (sempre recarregar quando há nova conquista)
        await carregarRanking();
      }
    } catch (err) {
      // Silenciar erros em produção, apenas logar em desenvolvimento
      if (IS_DEV) {
        safeLog.error('Erro inesperado ao verificar conquistas:', err);
      }
    }
  }, [carregarConquistas, carregarRanking]);

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

  // Limpar conquistas já visualizadas do estado local (para evitar que apareçam após F5)
  useEffect(() => {
    // Quando as conquistas são carregadas, remover da lista de notificações as que já foram visualizadas
    // Isso garante que após F5, apenas conquistas realmente novas apareçam
    if (conquistas.length > 0 && conquistasNovas.length > 0) {
      setConquistasNovas(prev => {
        const codigosVisualizadas = new Set(
          conquistas
            .filter(c => c.visualizada)
            .map(c => c.codigo)
        );
        const filtradas = prev.filter(c => !codigosVisualizadas.has(c.conquista_codigo));
        
        // Se houve mudança, retornar as filtradas, senão retornar as anteriores (evitar re-render desnecessário)
        if (filtradas.length !== prev.length) {
          return filtradas;
        }
        return prev;
      });
    }
  }, [conquistas]);

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
        // Filtrar conquistas que já estão na lista de notificações para evitar duplicatas
        setConquistasNovas(prev => {
          const codigosExistentes = new Set(prev.map(c => c.conquista_codigo));
          const novas = data as ConquistaNova[];
          const realmenteNovas = novas.filter(c => !codigosExistentes.has(c.conquista_codigo));
          
          // Retornar apenas as realmente novas
          return [...prev, ...realmenteNovas];
        });
        
        // Recarregar lista de conquistas
        await carregarConquistas();
        // Recarregar ranking para atualizar posições (sempre recarregar quando há nova conquista)
        await carregarRanking();
      }
    } catch (err) {
      safeLog.error('Erro inesperado ao verificar conquistas do dashboard:', err);
    }
  }, [carregarConquistas, carregarRanking]);

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
    // Limpar notificações ao montar (após F5, não deve mostrar conquistas já visualizadas)
    // Isso garante que após refresh, apenas conquistas realmente novas apareçam
    setConquistasNovas([]);
  }, [carregarConquistas]);

  // Verificar conquistas periodicamente (a cada 5 minutos para reduzir carga)
  useEffect(() => {
    // Verificar uma vez ao montar com delay menor para não sobrecarregar na inicialização
    const initialTimeout = setTimeout(() => {
      verificarConquistas();
    }, 2000); // Delay de 2 segundos na inicialização (reduzido de 5s)
    
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

