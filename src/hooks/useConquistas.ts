import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  
  // Refs para controlar atualizações
  const rankingLastUpdateRef = useRef<number>(0);
  const rankingUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const conquistasLastUpdateRef = useRef<number>(0);
  const rankingUpdateQueueRef = useRef<boolean>(false); // Flag para evitar múltiplas atualizações simultâneas

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
        conquistasLastUpdateRef.current = Date.now();
        
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

  // Carregar ranking de usuários (REFATORADO - sem cache bloqueante quando force=true)
  const carregarRanking = useCallback(async (force: boolean = false) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - rankingLastUpdateRef.current;
    
    // Se não for forçado e foi atualizado há menos de 30 segundos, não atualizar
    // MAS: se force=true, SEMPRE atualizar independente do cache
    if (!force && timeSinceLastUpdate < 30000) {
      if (IS_DEV) {
        safeLog.info('Ranking ainda atualizado, pulando recarregamento');
      }
      return;
    }

    // Evitar múltiplas chamadas simultâneas
    if (rankingUpdateQueueRef.current) {
      if (IS_DEV) {
        safeLog.info('Ranking já está sendo atualizado, aguardando...');
      }
      return;
    }

    rankingUpdateQueueRef.current = true;
    setLoadingRanking(true);
    
    try {
      if (IS_DEV) {
        safeLog.info(`Carregando ranking (force=${force})...`);
      }

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
        } else if (IS_DEV) {
          safeLog.warn('Função ranking_conquistas não disponível:', error);
        }
        setRanking([]);
        return;
      }

      if (data) {
        // A função pode retornar array ou objeto único
        if (Array.isArray(data)) {
          // Atualizar estado usando função de callback para garantir que sempre pega o valor mais recente
          setRanking(prevRanking => {
            // Comparar se os dados realmente mudaram antes de atualizar
            const dataChanged = JSON.stringify(prevRanking) !== JSON.stringify(data);
            
            if (dataChanged || force) {
              if (IS_DEV) {
                safeLog.info(`Ranking atualizado com ${data.length} usuários (force=${force}, changed=${dataChanged})`);
              }
              rankingLastUpdateRef.current = Date.now();
              return data;
            } else {
              if (IS_DEV) {
                safeLog.info('Ranking não mudou, mantendo estado anterior');
              }
              return prevRanking;
            }
          });
        } else if (data && typeof data === 'object') {
          // Se for objeto, tentar extrair array
          const rankingArray = (data as any).ranking || (data as any).data || [data];
          const finalArray = Array.isArray(rankingArray) ? rankingArray : [];
          
          setRanking(prevRanking => {
            const dataChanged = JSON.stringify(prevRanking) !== JSON.stringify(finalArray);
            
            if (dataChanged || force) {
              rankingLastUpdateRef.current = Date.now();
              return finalArray;
            }
            return prevRanking;
          });
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
      rankingUpdateQueueRef.current = false;
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
        const errorMessage = String(error.message || '');
        const errorCode = String(error.code || '');
        const is400Error = 
          errorMessage.includes('400') || 
          errorMessage.includes('Bad Request') ||
          errorCode === 'PGRST204' || // Bad Request do PostgREST
          errorMessage.includes('structure of query does not match'); // Erro de tipo de retorno
        
        // Silenciar completamente erros 400 em produção E desenvolvimento
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

      let hasNewConquistas = false;
      
      if (data && Array.isArray(data) && data.length > 0) {
        // Filtrar conquistas que já estão na lista de notificações para evitar duplicatas
        setConquistasNovas(prev => {
          const codigosExistentes = new Set(prev.map(c => c.conquista_codigo));
          const novas = data as ConquistaNova[];
          const realmenteNovas = novas.filter(c => c && c.conquista_codigo && !codigosExistentes.has(c.conquista_codigo));
          
          if (realmenteNovas.length > 0) {
            hasNewConquistas = true;
          }
          
          // Retornar apenas as realmente novas
          return [...prev, ...realmenteNovas];
        });
      }
      
      // SEMPRE recarregar conquistas após verificar (pode ter atualizado progresso)
      try {
        await carregarConquistas();
      } catch (err) {
        if (IS_DEV) {
          safeLog.warn('Erro ao recarregar conquistas após verificação:', err);
        }
      }
      
      // SEMPRE atualizar ranking após verificar conquistas (forçar atualização)
      // Aguardar um pouco para garantir que as conquistas foram salvas no banco
      // Usar Promise para garantir que a atualização aconteça
      await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 segundos de delay
      
      try {
        // Resetar cache para forçar atualização
        rankingLastUpdateRef.current = 0;
        await carregarRanking(true); // Forçar atualização
      } catch (err) {
        if (IS_DEV) {
          safeLog.warn('Erro ao recarregar ranking após verificação:', err);
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
        validateParams: false // Desabilitar validação para evitar problemas
      });
      
      if (error) {
        // Silenciar erros 404 (função não encontrada) em produção
        const errorCode = (error as any)?.code;
        const errorMessage = String((error as any)?.message || '');
        const is404 = errorCode === 'PGRST116' || errorCode === '42883' || 
                      errorCode === 'PGRST204' ||
                      errorMessage.includes('404') || 
                      errorMessage.includes('not found');
        
        if (!is404) {
          safeLog.error('Erro ao marcar conquista:', error);
        } else if (IS_DEV) {
          safeLog.warn('Função marcar_conquista_visualizada não disponível:', error);
        }
        return false;
      }

      // Atualizar estado local
      setConquistas(prev =>
        prev.map(c =>
          c.conquista_id === conquistaId ? { ...c, visualizada: true } : c
        )
      );

      // Atualizar ranking após marcar como visualizada (pode ter mudado posições)
      // Aguardar um pouco e forçar atualização
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        rankingLastUpdateRef.current = 0; // Resetar cache
        await carregarRanking(true); // Forçar atualização
      } catch (err) {
        // Silenciar erro silenciosamente
      }

      return true;
    } catch (err) {
      safeLog.error('Erro inesperado ao marcar conquista:', err);
      return false;
    }
  }, [carregarRanking]);

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

      let hasNewConquistas = false;
      
      if (data && Array.isArray(data) && data.length > 0) {
        // Filtrar conquistas que já estão na lista de notificações para evitar duplicatas
        setConquistasNovas(prev => {
          const codigosExistentes = new Set(prev.map(c => c.conquista_codigo));
          const novas = data as ConquistaNova[];
          const realmenteNovas = novas.filter(c => c && c.conquista_codigo && !codigosExistentes.has(c.conquista_codigo));
          
          if (realmenteNovas.length > 0) {
            hasNewConquistas = true;
          }
          
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
        // Aguardar para garantir que as conquistas foram salvas
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        try {
          // Resetar cache para forçar atualização
          rankingLastUpdateRef.current = 0;
          await carregarRanking(true); // Sempre forçar quando há novas conquistas
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
    
    // Carregar ranking inicial após um delay para garantir que tudo está pronto
    const timeoutId = setTimeout(() => {
      carregarRanking(true); // Forçar atualização inicial
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [carregarConquistas, carregarRanking]);

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

  // Atualizar ranking periodicamente (a cada 1 minuto)
  // Isso garante que o ranking está sempre atualizado, mesmo quando outras pessoas ganham conquistas
  useEffect(() => {
    // Limpar intervalo anterior se existir
    if (rankingUpdateIntervalRef.current) {
      clearInterval(rankingUpdateIntervalRef.current);
    }
    
    // Atualizar ranking periodicamente
    rankingUpdateIntervalRef.current = setInterval(() => {
      // Atualizar ranking apenas se não estiver carregando
      if (!loadingRanking && !rankingUpdateQueueRef.current) {
        // Verificar se passou tempo suficiente desde a última atualização
        const now = Date.now();
        const timeSinceLastUpdate = now - rankingLastUpdateRef.current;
        
        // Se passou mais de 30 segundos, atualizar (não forçar para não sobrecarregar)
        if (timeSinceLastUpdate >= 30000) {
          carregarRanking(false);
        }
      }
    }, 60000); // 1 minuto (mais frequente para garantir atualização)

    return () => {
      if (rankingUpdateIntervalRef.current) {
        clearInterval(rankingUpdateIntervalRef.current);
        rankingUpdateIntervalRef.current = null;
      }
    };
  }, [carregarRanking, loadingRanking]);

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
