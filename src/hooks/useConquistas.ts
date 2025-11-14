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
  const conquistasLoadingRef = useRef<boolean>(false); // Flag para evitar múltiplas cargas simultâneas
  const conquistasVerifyingRef = useRef<boolean>(false); // Flag para evitar múltiplas verificações simultâneas
  const conquistasUpdateLockRef = useRef<string | null>(null); // Lock com ID único para garantir ordem de atualizações
  const conquistasVersionRef = useRef<number>(0); // Versão para detectar atualizações concorrentes

  // Carregar conquistas do usuário
  const carregarConquistas = useCallback(async (retryCount = 0, force = false) => {
    const MAX_RETRIES = 2;
    
    // Evitar múltiplas cargas simultâneas (exceto se forçado)
    if (!force && conquistasLoadingRef.current) {
      if (IS_DEV) {
        safeLog.info('[useConquistas] Carregamento de conquistas já em andamento, ignorando...');
      }
      return;
    }

    // Se não for forçado e foi atualizado há menos de 5 segundos, não atualizar
    const now = Date.now();
    const timeSinceLastUpdate = now - conquistasLastUpdateRef.current;
    if (!force && timeSinceLastUpdate < 5000) {
      if (IS_DEV) {
        safeLog.info('[useConquistas] Conquistas ainda atualizadas, pulando recarregamento');
      }
      return;
    }
    
    conquistasLoadingRef.current = true;
    setLoading(true);
    
    try {
      // Verificar se o usuário está autenticado antes de tentar carregar conquistas
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        if (IS_DEV) {
          safeLog.warn('[useConquistas] Erro ao obter sessão:', sessionError);
        }
        // Se for erro de cliente mock, tentar recriar
        const errorMessage = String(sessionError.message || '');
        if (errorMessage.includes('placeholder.supabase.co') || errorMessage.includes('ERR_NAME_NOT_RESOLVED')) {
          if (typeof (supabase as any)._recreate === 'function') {
            (supabase as any)._recreate();
            // Tentar novamente após recriar
            if (retryCount < MAX_RETRIES) {
              conquistasLoadingRef.current = false;
              setTimeout(() => carregarConquistas(retryCount + 1, force), 1000);
              return;
            }
          }
        }
      }
      
      if (!session?.user?.id) {
        if (IS_DEV) {
          safeLog.warn('[useConquistas] Tentativa de carregar conquistas sem usuário autenticado');
        }
        setConquistas([]);
        setTotalPontos(0);
        setLoading(false);
        conquistasLoadingRef.current = false;
        return;
      }

      if (IS_DEV) {
        safeLog.info('[useConquistas] Carregando conquistas...');
      }

      const { data, error } = await safeRpc<Conquista[]>('listar_conquistas_usuario', {}, {
        timeout: 30000,
        validateParams: false
      });
      
      if (error) {
        const errorMessage = String((error as any)?.message || '');
        const errorCode = String((error as any)?.code || '');
        
        // Se for erro de cliente mock, tentar recriar e retry
        if ((errorMessage.includes('placeholder.supabase.co') || errorMessage.includes('ERR_NAME_NOT_RESOLVED')) && retryCount < MAX_RETRIES) {
          if (typeof (supabase as any)._recreate === 'function') {
            if (IS_DEV) {
              safeLog.warn('[useConquistas] Cliente mock detectado, recriando e tentando novamente...');
            }
            (supabase as any)._recreate();
            conquistasLoadingRef.current = false;
            setTimeout(() => carregarConquistas(retryCount + 1, force), 1000);
            return;
          }
        }
        
        safeLog.error('[useConquistas] Erro ao carregar conquistas:', error);
        setConquistas([]);
        setTotalPontos(0);
        setLoading(false);
        conquistasLoadingRef.current = false;
        return;
      }

      // Validar dados antes de atualizar estado
      if (data && Array.isArray(data)) {
        // Validar que cada conquista tem a estrutura correta
        const conquistasValidas = data.filter((c: any) => {
          return c && 
                 typeof c.conquistada === 'boolean' &&
                 typeof c.pontos === 'number' &&
                 typeof c.progresso === 'number';
        });

        if (IS_DEV) {
          safeLog.info(`[useConquistas] ✅ ${conquistasValidas.length} conquistas carregadas (${data.length} total, ${data.length - conquistasValidas.length} inválidas)`);
        }

        // Validação adicional de consistência: garantir que conquistada=true só existe quando progresso >= 100
        const conquistasConsistentes = conquistasValidas.map((c: any) => {
          // Se está marcada como conquistada mas progresso < 100, corrigir
          if (c.conquistada === true && (c.progresso < 100 || !c.conquistada_em)) {
            if (IS_DEV) {
              safeLog.warn(`[useConquistas] ⚠️ Inconsistência detectada na conquista ${c.codigo}: conquistada=true mas progresso=${c.progresso}`);
            }
            return { ...c, conquistada: false };
          }
          return c;
        });
        
        // Atualizar estado com dados validados e consistentes
        setConquistas(conquistasConsistentes as Conquista[]);
        conquistasLastUpdateRef.current = Date.now();
        
        // Calcular total de pontos - confiar na função SQL que já valida corretamente
        // A função SQL retorna conquistada = true apenas quando progresso >= 100 AND conquistada_em IS NOT NULL
        // Validação adicional: garantir que apenas conquistas realmente completas sejam contadas
        const conquistasCompletas = conquistasConsistentes.filter((c: any) => 
          c.conquistada === true && 
          c.progresso >= 100 && 
          c.conquistada_em !== null && 
          c.conquistada_em !== undefined
        );
        
        const pontos = conquistasCompletas.reduce((sum: number, c: any) => sum + (c.pontos || 0), 0);
        
        setTotalPontos(pontos);
        
        if (IS_DEV) {
          safeLog.info(`[useConquistas] 📊 Estatísticas: ${conquistasCompletas.length} conquistadas (de ${conquistasConsistentes.length} total), ${pontos} pontos`);
        }
      } else {
        if (IS_DEV) {
          safeLog.warn('[useConquistas] Nenhuma conquista retornada ou dados inválidos');
        }
        setConquistas([]);
        setTotalPontos(0);
      }
    } catch (err) {
      safeLog.error('[useConquistas] Erro inesperado ao carregar conquistas:', err);
      setConquistas([]);
      setTotalPontos(0);
    } finally {
      setLoading(false);
      conquistasLoadingRef.current = false;
    }
  }, []);

  // Carregar ranking de usuários (REFATORADO - sem cache bloqueante quando force=true)
  const carregarRanking = useCallback(async (force: boolean = false, retryCount = 0) => {
    const MAX_RETRIES = 2;
    const now = Date.now();
    const timeSinceLastUpdate = now - rankingLastUpdateRef.current;
    
    // Se não for forçado e foi atualizado há menos de 30 segundos, não atualizar
    // MAS: se force=true, SEMPRE atualizar independente do cache
    if (!force && timeSinceLastUpdate < 30000) {
      if (IS_DEV) {
        safeLog.info('[useConquistas] Ranking ainda atualizado, pulando recarregamento');
      }
      return;
    }

    // Evitar múltiplas chamadas simultâneas
    if (rankingUpdateQueueRef.current) {
      if (IS_DEV) {
        safeLog.info('[useConquistas] Ranking já está sendo atualizado, aguardando...');
      }
      return;
    }

    rankingUpdateQueueRef.current = true;
    setLoadingRanking(true);
    
    try {
      if (IS_DEV) {
        safeLog.info(`[useConquistas] Carregando ranking (force=${force})...`);
      }

      const { data, error } = await safeRpc<RankingUsuario[]>('ranking_conquistas', {}, {
        timeout: 30000,
        validateParams: false
      });
      
      if (error) {
        const errorMessage = String((error as any)?.message || '');
        const errorCode = String((error as any)?.code || '');
        
        // Se for erro de cliente mock, tentar recriar e retry
        if ((errorMessage.includes('placeholder.supabase.co') || errorMessage.includes('ERR_NAME_NOT_RESOLVED')) && retryCount < MAX_RETRIES) {
          if (typeof (supabase as any)._recreate === 'function') {
            if (IS_DEV) {
              safeLog.warn('[useConquistas] Cliente mock detectado no ranking, recriando e tentando novamente...');
            }
            rankingUpdateQueueRef.current = false;
            (supabase as any)._recreate();
            setTimeout(() => carregarRanking(force, retryCount + 1), 1000);
            return;
          }
        }
        
        // Tratar erros 400/404 silenciosamente, mas logar outros erros
        const is400or404 = errorCode === 'PGRST116' || errorCode === '42883' || 
                          errorCode === 'PGRST204' ||
                          errorMessage.includes('400') ||
                          errorMessage.includes('404') ||
                          errorMessage.includes('not found');
        
        if (!is400or404) {
          safeLog.error('[useConquistas] Erro ao carregar ranking:', error);
        } else if (IS_DEV) {
          safeLog.warn('[useConquistas] Função ranking_conquistas não disponível:', error);
        }
        setRanking([]);
        rankingUpdateQueueRef.current = false;
        setLoadingRanking(false);
        return;
      }

      if (data) {
        if (IS_DEV) {
          safeLog.info(`[useConquistas] ✅ Ranking carregado: ${Array.isArray(data) ? data.length : 'objeto'} itens`);
        }
        
        // A função pode retornar array ou objeto único
        if (Array.isArray(data)) {
          // Atualizar estado usando função de callback para garantir que sempre pega o valor mais recente
          setRanking(prevRanking => {
            // Comparar se os dados realmente mudaram antes de atualizar
            const dataChanged = JSON.stringify(prevRanking) !== JSON.stringify(data);
            
            if (dataChanged || force) {
              if (IS_DEV) {
                safeLog.info(`[useConquistas] Ranking atualizado com ${data.length} usuários (force=${force}, changed=${dataChanged})`);
              }
              rankingLastUpdateRef.current = Date.now();
              return data;
            } else {
              if (IS_DEV) {
                safeLog.info('[useConquistas] Ranking não mudou, mantendo estado anterior');
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
    // Evitar múltiplas verificações simultâneas
    if (conquistasVerifyingRef.current) {
      if (IS_DEV) {
        safeLog.info('[useConquistas] Verificação de conquistas já em andamento, ignorando...');
      }
      return;
    }

    conquistasVerifyingRef.current = true;

    try {
      // Primeiro verificar se o usuário está autenticado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        if (IS_DEV) {
          safeLog.warn('Tentativa de verificar conquistas sem usuário autenticado');
        }
        conquistasVerifyingRef.current = false;
        return;
      }

      if (IS_DEV) {
        safeLog.info('🔍 Verificando novas conquistas...');
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
            if (IS_DEV) {
              safeLog.info(`🎉 ${realmenteNovas.length} nova(s) conquista(s) encontrada(s):`, realmenteNovas.map(c => c.conquista_nome));
            }
          }
          
          // Retornar apenas as realmente novas
          return [...prev, ...realmenteNovas];
        });
      } else if (IS_DEV && data && Array.isArray(data) && data.length === 0) {
        safeLog.info('Nenhuma conquista nova encontrada (todas já foram visualizadas ou não há conquistas completas)');
      }
      
      // SEMPRE recarregar conquistas após verificar (pode ter atualizado progresso)
      // MAS: Aguardar um pouco para não marcar como visualizada antes da notificação aparecer
      // Se houver novas conquistas, aguardar mais tempo antes de recarregar
      const delayRecarregar = hasNewConquistas ? 3000 : 1000; // 3 segundos se houver novas, 1 segundo se não
      
      setTimeout(async () => {
        try {
          // Forçar recarregamento para garantir dados frescos
          await carregarConquistas(0, true);
        } catch (err) {
          if (IS_DEV) {
            safeLog.warn('Erro ao recarregar conquistas após verificação:', err);
          }
        }
      }, delayRecarregar);
      
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
    } finally {
      conquistasVerifyingRef.current = false;
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
  // IMPORTANTE: Adicionar delay para não remover notificações que acabaram de aparecer
  useEffect(() => {
    // Quando as conquistas são carregadas, remover da lista de notificações as que já foram visualizadas
    // Isso garante que após F5, apenas conquistas realmente novas apareçam
    // MAS: Adicionar delay para não remover notificações que acabaram de aparecer
    if (conquistas.length > 0 && conquistasNovas.length > 0) {
      // Aguardar 2 segundos antes de limpar, para dar tempo da notificação aparecer
      const timeoutId = setTimeout(() => {
        setConquistasNovas(prev => {
          const codigosVisualizadas = new Set(
            conquistas
              .filter(c => c.visualizada)
              .map(c => c.codigo)
          );
          const filtradas = prev.filter(c => !codigosVisualizadas.has(c.conquista_codigo));
          
          // Se houve mudança, retornar as filtradas, senão retornar as anteriores (evitar re-render desnecessário)
          if (filtradas.length !== prev.length) {
            if (IS_DEV) {
              safeLog.info(`Removendo ${prev.length - filtradas.length} conquistas visualizadas das notificações`);
            }
            return filtradas;
          }
          return prev;
        });
      }, 2000); // 2 segundos de delay
      
      return () => clearTimeout(timeoutId);
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
        // Usar lock para evitar race conditions
        const updateId = `dashboard-${Date.now()}-${Math.random()}`;
        if (conquistasUpdateLockRef.current !== null) {
          if (IS_DEV) {
            safeLog.info('[useConquistas] Atualização já em andamento, aguardando...');
          }
          // Aguardar um pouco e tentar novamente
          await new Promise(resolve => setTimeout(resolve, 500));
          if (conquistasUpdateLockRef.current !== null) {
            if (IS_DEV) {
              safeLog.warn('[useConquistas] Lock ainda ativo, pulando atualização');
            }
            return;
          }
        }
        
        conquistasUpdateLockRef.current = updateId;
        conquistasVersionRef.current += 1;
        const currentVersion = conquistasVersionRef.current;
        
        try {
          // Forçar recarregamento para garantir dados frescos
          await carregarConquistas(0, true);
          
          // Verificar se a versão ainda é a mesma (não houve atualização concorrente)
          if (currentVersion === conquistasVersionRef.current && conquistasUpdateLockRef.current === updateId) {
            // Aguardar um pouco para garantir que o banco processou
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Recarregar ranking apenas se ainda estamos na mesma versão
            if (currentVersion === conquistasVersionRef.current && conquistasUpdateLockRef.current === updateId) {
              rankingLastUpdateRef.current = 0;
              await carregarRanking(true);
            }
          }
        } catch (err) {
          if (IS_DEV) {
            safeLog.warn('Erro ao recarregar conquistas após verificação do dashboard:', err);
          }
        } finally {
          // Liberar lock apenas se ainda é nosso
          if (conquistasUpdateLockRef.current === updateId) {
            conquistasUpdateLockRef.current = null;
          }
        }
      }
    } catch (err) {
      safeLog.error('Erro inesperado ao verificar conquistas do dashboard:', err);
    }
  }, [carregarConquistas, carregarRanking]);

  // Carregar conquistas ao montar
  useEffect(() => {
    if (IS_DEV) {
      safeLog.info('[useConquistas] Hook montado, verificando sessão antes de carregar...');
    }
    
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Verificar se há sessão antes de carregar
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        if (IS_DEV) {
          safeLog.warn('[useConquistas] Erro ao verificar sessão:', sessionError);
        }
        setLoading(false);
        return;
      }
      
      if (session?.user?.id) {
        if (IS_DEV) {
          safeLog.info('[useConquistas] Sessão encontrada, carregando conquistas...');
        }
        // Forçar carregamento inicial para garantir dados frescos após F5
        carregarConquistas(0, true);
        // Limpar notificações ao montar (após F5, não deve mostrar conquistas já visualizadas)
        // Isso garante que após refresh, apenas conquistas realmente novas apareçam
        setConquistasNovas([]);
        
        // Carregar ranking inicial após um delay para garantir que tudo está pronto
        timeoutId = setTimeout(() => {
          carregarRanking(true); // Forçar atualização inicial
        }, 2000);
      } else {
        if (IS_DEV) {
          safeLog.warn('[useConquistas] Nenhuma sessão encontrada ao montar hook');
        }
        setLoading(false);
      }
    }).catch((err) => {
      if (IS_DEV) {
        safeLog.error('[useConquistas] Erro ao verificar sessão ao montar:', err);
      }
      setLoading(false);
    });
    
    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remover dependências para evitar loops infinitos - carregar apenas uma vez ao montar

  // Log de debug para notificações
  useEffect(() => {
    if (IS_DEV && conquistasNovas.length > 0) {
      safeLog.info(`📢 ${conquistasNovas.length} notificação(ões) de conquista ativa(s):`, conquistasNovas.map(c => c.conquista_nome));
    }
  }, [conquistasNovas]);

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
  // IMPORTANTE: Calcular apenas conquistas realmente completas (progresso >= 100 E conquistada_em IS NOT NULL)
  const stats = useMemo(() => {
    // Validação adicional de consistência: garantir que apenas conquistas realmente completas sejam contadas
    const conquistadasCompletas = conquistas.filter(c => 
      c.conquistada === true && 
      c.progresso >= 100 && 
      c.conquistada_em !== null && 
      c.conquistada_em !== undefined
    );
    
    const totalConquistadas = conquistadasCompletas.length;
    
    // Validar consistência: se totalPontos não bate com as conquistas completas, recalcular
    const pontosCalculados = conquistadasCompletas.reduce((sum, c) => sum + (c.pontos || 0), 0);
    const pontosFinais = pontosCalculados === totalPontos ? totalPontos : pontosCalculados;
    
    if (IS_DEV && pontosFinais !== totalPontos) {
      safeLog.warn(`[useConquistas] ⚠️ Inconsistência de pontos detectada: totalPontos=${totalPontos}, calculado=${pontosCalculados}. Corrigindo...`);
    }
    
    return {
      total: conquistas.length,
      conquistadas: totalConquistadas, // Usar apenas conquistas realmente completas
      pontos: pontosFinais, // Garantir consistência
      progresso: conquistas.length > 0 
        ? Math.round((totalConquistadas / conquistas.length) * 100)
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
