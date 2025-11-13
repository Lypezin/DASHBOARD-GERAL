import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Conquista, ConquistaNova } from '@/types/conquistas';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';

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
      // Verificar se o usuário está autenticado antes de tentar carregar conquistas
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        if (IS_DEV) {
          safeLog.warn('Tentativa de carregar conquistas sem usuário autenticado');
        }
        setConquistas([]);
        setLoading(false);
        return;
      }

      const { data, error } = await safeRpc<Conquista[]>('listar_conquistas_usuario', {}, {
        timeout: 30000,
        validateParams: false
      });
      
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

  // Carregar ranking de usuários
  const carregarRanking = useCallback(async () => {
    setLoadingRanking(true);
    try {
      const { data, error } = await safeRpc<RankingUsuario[]>('ranking_conquistas', {}, {
        timeout: 30000,
        validateParams: false
      });
      
      if (error) {
        // Tratar erros 400/404 silenciosamente, mas logar outros erros
        const errorCode = (error as any)?.code;
        const errorMessage = String((error as any)?.message || '');
        const is400or404 = errorCode === 'PGRST116' || errorCode === '42883' || 
                          errorCode === 'PGRST204' ||
                          errorMessage.includes('400') ||
                          errorMessage.includes('404') ||
                          errorMessage.includes('not found');
        
        if (!is400or404) {
          safeLog.error('Erro ao carregar ranking:', error);
        } else if (process.env.NODE_ENV === 'development') {
          safeLog.warn('Função ranking_conquistas não disponível:', error);
        }
        setRanking([]);
        return;
      }

      if (data) {
        // A função pode retornar array ou objeto único
        if (Array.isArray(data)) {
          setRanking(data);
        } else if (data && typeof data === 'object') {
          // Se for objeto, tentar extrair array
          const rankingArray = (data as any).ranking || (data as any).data || [data];
          setRanking(Array.isArray(rankingArray) ? rankingArray : []);
        } else {
          setRanking([]);
        }
      } else {
        // Se data for null, pode ser que a função não retornou dados
        // Mas não é necessariamente um erro - pode ser que não há usuários ainda
        setRanking([]);
      }
    } catch (err) {
      safeLog.error('Erro inesperado ao carregar ranking:', err);
      setRanking([]);
    } finally {
      setLoadingRanking(false);
    }
  }, []);

  // Verificar novas conquistas (com tratamento de erro silencioso)
  const verificarConquistas = useCallback(async () => {
    try {
      // Primeiro verificar se o usuário está autenticado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        if (IS_DEV) {
          safeLog.warn('Tentativa de verificar conquistas sem usuário autenticado');
        }
        return;
      }

      const { data, error } = await safeRpc<ConquistaNova[]>('verificar_conquistas', {}, {
        timeout: 30000,
        validateParams: false
      });
      
      if (error) {
        // Silenciar TODOS os erros 400 - são esperados e não devem aparecer no console
        // Erros 400 podem ocorrer por vários motivos legítimos:
        // - Função retornando estrutura vazia
        // - Problemas temporários de RLS
        // - Usuário não autenticado ainda
        const errorMessage = String(error.message || '');
        const errorCode = String(error.code || '');
        const is400Error = 
          errorMessage.includes('400') || 
          errorMessage.includes('Bad Request') ||
          errorCode === 'PGRST204' || // Bad Request do PostgREST
          errorMessage.includes('structure of query does not match'); // Erro de tipo de retorno
        
        // Silenciar completamente erros 400 em produção E desenvolvimento
        // Não logar nada para não poluir o console
        if (is400Error) {
          return; // Silenciar completamente
        }
        
        // Para outros erros, apenas logar em desenvolvimento
        const isExpectedError = 
          errorCode === 'P0001' ||
          errorCode === '42803' || // Erro de tipo de dados
          errorCode === 'PGRST116' || // Função não encontrada
          errorCode === '42883' || // Função não existe
          errorCode === '23502' || // NOT NULL violation
          errorMessage.includes('null value') ||
          errorMessage.includes('violates not-null constraint');
        
        if (!isExpectedError && IS_DEV) {
          safeLog.warn('Erro inesperado ao verificar conquistas:', error);
        }
        return;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        // Filtrar conquistas que já estão na lista de notificações para evitar duplicatas
        setConquistasNovas(prev => {
          const codigosExistentes = new Set(prev.map(c => c.conquista_codigo));
          const novas = data as ConquistaNova[];
          const realmenteNovas = novas.filter(c => c && c.conquista_codigo && !codigosExistentes.has(c.conquista_codigo));
          
          // Retornar apenas as realmente novas
          return [...prev, ...realmenteNovas];
        });
        
        // Recarregar lista de conquistas com tratamento de erro
        try {
          await carregarConquistas();
        } catch (err) {
          if (IS_DEV) {
            safeLog.warn('Erro ao recarregar conquistas após verificação:', err);
          }
        }
        
        // Recarregar ranking para atualizar posições (sempre recarregar quando há nova conquista)
        try {
          await carregarRanking();
        } catch (err) {
          if (IS_DEV) {
            safeLog.warn('Erro ao recarregar ranking após verificação:', err);
          }
        }
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
      const { error } = await safeRpc('marcar_conquista_visualizada', {
        p_conquista_id: conquistaId
      }, {
        timeout: 30000,
        validateParams: true
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conquistas]); // conquistasNovas.length não precisa estar nas dependências pois verificamos dentro do useEffect

  // Verificar conquistas baseadas em dados do dashboard
  const verificarConquistasDashboard = useCallback(async (
    aderenciaGeral?: number,
    taxaCompletude?: number,
    utrGeral?: number
  ) => {
    try {
      const { data, error } = await safeRpc<ConquistaNova[]>('verificar_conquistas_dashboard', {
        p_aderencia_geral: aderenciaGeral ?? null,
        p_taxa_completude: taxaCompletude ?? null,
        p_utr_geral: utrGeral ?? null
      }, {
        timeout: 30000,
        validateParams: true
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
          const realmenteNovas = novas.filter(c => c && c.conquista_codigo && !codigosExistentes.has(c.conquista_codigo));
          
          // Retornar apenas as realmente novas
          return [...prev, ...realmenteNovas];
        });
        
        // Recarregar lista de conquistas com tratamento de erro
        try {
          await carregarConquistas();
        } catch (err) {
          if (IS_DEV) {
            safeLog.warn('Erro ao recarregar conquistas após verificação do dashboard:', err);
          }
        }
        
        // Recarregar ranking para atualizar posições (sempre recarregar quando há nova conquista)
        try {
          await carregarRanking();
        } catch (err) {
          if (IS_DEV) {
            safeLog.warn('Erro ao recarregar ranking após verificação do dashboard:', err);
          }
        }
      }
    } catch (err) {
      safeLog.error('Erro inesperado ao verificar conquistas do dashboard:', err);
    }
  }, [carregarConquistas, carregarRanking]);

  // Carregar conquistas ao montar
  useEffect(() => {
    carregarConquistas();
    // Limpar notificações ao montar (após F5, não deve mostrar conquistas já visualizadas)
    // Isso garante que após refresh, apenas conquistas realmente novas apareçam
    setConquistasNovas([]);
  }, [carregarConquistas]);

  // Verificar conquistas periodicamente (a cada 5 minutos para reduzir carga)
  useEffect(() => {
    // Verificar uma vez ao montar com delay maior para garantir que a sessão está estabelecida
    const initialTimeout = setTimeout(() => {
      verificarConquistas();
    }, 5000); // Delay de 5 segundos na inicialização para garantir que a sessão está pronta
    
    const interval = setInterval(() => {
      verificarConquistas();
    }, 300000); // 5 minutos (300 segundos)

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [verificarConquistas]); // Adicionar verificarConquistas como dependência

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

