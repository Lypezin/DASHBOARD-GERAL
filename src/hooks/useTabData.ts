import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { is500Error, isRateLimitError } from '@/lib/rpcErrorHandler';
import { UtrData, EntregadoresData, ValoresEntregador } from '@/types';
import { CacheEntry, isCacheValid, createCacheEntry } from '@/types/cache';

import { CACHE, DELAYS, RPC_TIMEOUTS, RATE_LIMIT } from '@/constants/config';

const IS_DEV = process.env.NODE_ENV === 'development';
const CACHE_TTL = CACHE.TAB_DATA_TTL;
const DEBOUNCE_MS = DELAYS.DEBOUNCE;

type TabData = UtrData | EntregadoresData | ValoresEntregador[] | null;

// Sistema global de fila para evitar requisições simultâneas
const requestQueue = new Map<string, { timestamp: number; count: number }>();

/**
 * Hook para gerenciar dados específicos de cada aba do dashboard
 * 
 * Busca dados específicos baseados na aba ativa (utr, entregadores, valores, prioridade).
 * Inclui sistema de cache, debounce, e cancelamento de requisições antigas.
 * 
 * @param {string} activeTab - Aba ativa ('utr', 'entregadores', 'valores', 'prioridade')
 * @param {object} filterPayload - Payload de filtros para a requisição RPC
 * @param {Object} [currentUser] - Usuário atual (para aplicar permissões)
 * @param {boolean} [currentUser.is_admin] - Se o usuário é administrador
 * @param {string[]} [currentUser.assigned_pracas] - Praças atribuídas ao usuário
 * @param {string} [currentUser.role] - Role do usuário ('admin', 'marketing', 'user')
 * @returns {Object} Objeto contendo dados da aba, estado de loading e erro
 * 
 * @example
 * ```typescript
 * const { data, loading } = useTabData('utr', filterPayload, currentUser);
 * ```
 */
export function useTabData(activeTab: string, filterPayload: object, currentUser?: { is_admin: boolean; assigned_pracas: string[]; role?: 'admin' | 'marketing' | 'user' } | null) {
  const [data, setData] = useState<TabData>(null);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Map<string, CacheEntry<TabData>>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentTabRef = useRef<string>(activeTab);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRequestPendingRef = useRef<boolean>(false);
  const lastFilterPayloadRef = useRef<string>('');
  const requestIdRef = useRef<number>(0);
  const lastSuccessfulTabRef = useRef<string>('');

  useEffect(() => {
    currentTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    // Limpar timeout anterior
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Verificar se o filterPayload realmente mudou
    const currentFilterPayloadStr = JSON.stringify(filterPayload);
    const filterPayloadChanged = lastFilterPayloadRef.current !== currentFilterPayloadStr;
    lastFilterPayloadRef.current = currentFilterPayloadStr;

    const fetchDataForTab = async (tab: string) => {
      // Verificar se a tab ainda é a mesma antes de começar
      if (currentTabRef.current !== tab) {
        isRequestPendingRef.current = false;
        return;
      }

      // Verificar se já há uma requisição pendente para evitar duplicatas
      if (isRequestPendingRef.current) {
        if (IS_DEV) {
          safeLog.warn(`Requisição já pendente para tab ${tab}, ignorando...`);
        }
        return;
      }

      // Verificar se há muitas requisições recentes para a mesma tab (rate limiting local mais suave)
      const queueKey = `${tab}-${JSON.stringify(filterPayload)}`;
      const queueEntry = requestQueue.get(queueKey);
      const now = Date.now();
      
      // Apenas bloquear se houve requisição muito recente para a mesma tab e payload
      if (queueEntry && (now - queueEntry.timestamp) < RATE_LIMIT.MIN_REQUEST_INTERVAL) {
        if (IS_DEV) {
          safeLog.warn(`Rate limit local: requisição muito recente para ${tab}, ignorando...`);
        }
        return;
      }

      // Registrar requisição na fila
      requestQueue.set(queueKey, { timestamp: now, count: (queueEntry?.count || 0) + 1 });
      
      // Limpar entradas antigas da fila
      // Otimizar: limitar iterações para evitar travamentos com filas muito grandes
      let cleanedCount = 0;
      for (const [key, entry] of requestQueue.entries()) {
        if (cleanedCount >= RATE_LIMIT.MAX_CLEANUP_ENTRIES) break; // Parar após limpar muitas entradas
        if (now - entry.timestamp > RATE_LIMIT.QUEUE_CLEANUP_INTERVAL) {
          requestQueue.delete(key);
          cleanedCount++;
        }
      }

      // Marcar como pendente
      isRequestPendingRef.current = true;

      // Cancelar requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Criar novo AbortController para esta requisição
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const cacheKey = `${tab}-${JSON.stringify(filterPayload)}`;
      const cached = cacheRef.current.get(cacheKey);

      // Cache imediato (igual ao Dashboard) - sem debounce quando há cache válido
      if (cached && isCacheValid(cached, CACHE_TTL)) {
        // Verificar novamente se a tab ainda é a mesma
        if (currentTabRef.current !== tab || abortController.signal.aborted) {
          isRequestPendingRef.current = false;
          return;
        }
        // Para valores, garantir que o cache retorne um array
        const cachedData = tab === 'valores' 
          ? (Array.isArray(cached.data) ? cached.data : [])
          : cached.data;
        setData(cachedData);
        setLoading(false);
        isRequestPendingRef.current = false;
        if (IS_DEV && tab === 'valores') {
          safeLog.info('📦 Dados carregados do cache (valores):', Array.isArray(cachedData) ? cachedData.length : 0);
        }
        return; // Retornar imediatamente quando há cache (igual ao Dashboard)
      }

      // Verificar novamente antes de setar loading
      if (currentTabRef.current !== tab || abortController.signal.aborted) {
        isRequestPendingRef.current = false;
        return;
      }

      setLoading(true);

      try {
        // Verificar se a tab mudou durante o carregamento
        if (abortController.signal.aborted || currentTabRef.current !== tab) {
          setLoading(false);
          isRequestPendingRef.current = false;
          return;
        }

        let result: { data: any, error: any } | null = null;
        let processedData: TabData = null;

        // Gerar ID único para esta requisição
        const currentRequestId = ++requestIdRef.current;
        
        switch (tab) {
          case 'utr':
            result = await safeRpc<UtrData>('calcular_utr', filterPayload as any, {
              timeout: RPC_TIMEOUTS.DEFAULT,
              validateParams: true
            });
            
            // Verificar se esta requisição ainda é a mais recente
            if (currentRequestId !== requestIdRef.current || abortController.signal.aborted || currentTabRef.current !== tab) {
              isRequestPendingRef.current = false;
              setLoading(false);
              return;
            }
            
            if (result && !result.error) processedData = result.data;
            break;

          case 'entregadores':
          case 'prioridade':
            // Verificar se foi abortado antes de fazer a requisição
            if (abortController.signal.aborted || currentTabRef.current !== tab) {
              isRequestPendingRef.current = false;
              setLoading(false);
              return;
            }
            
            const { p_ano, p_semana, p_praca, p_sub_praca, p_origem, p_data_inicial, p_data_final } = filterPayload as any;
            const listarEntregadoresPayload = { p_ano, p_semana, p_praca, p_sub_praca, p_origem, p_data_inicial, p_data_final };
            result = await safeRpc<EntregadoresData>('listar_entregadores', listarEntregadoresPayload, {
              timeout: RPC_TIMEOUTS.FAST,
              validateParams: false // Desabilitar validação para evitar problemas
            });
            
            // Verificar se esta requisição ainda é a mais recente
            if (currentRequestId !== requestIdRef.current) {
              isRequestPendingRef.current = false;
              setLoading(false);
              return;
            }
            
            // Verificar se foi abortado durante a requisição
            if (abortController.signal.aborted || currentTabRef.current !== tab) {
              isRequestPendingRef.current = false;
              setLoading(false);
              return;
            }
            
            // Verificar se é erro 500 ou rate limit e tratar adequadamente
            if (result?.error) {
              const is500 = is500Error(result.error);
              const isRateLimit = isRateLimitError(result.error);
              
              if (is500) {
                // Erro 500: aguardar um pouco antes de tentar novamente
                safeLog.warn('Erro 500 ao buscar entregadores. Aguardando antes de tentar novamente...');
                isRequestPendingRef.current = false;
                setLoading(false);
                
                // Tentar novamente após delay maior
                setTimeout(() => {
                  if (currentTabRef.current === tab && !abortController.signal.aborted) {
                    fetchDataForTab(tab);
                  }
                }, DELAYS.RETRY_ENTREGADORES);
                return;
              }
              
              if (isRateLimit) {
                safeLog.warn('Rate limit ao buscar entregadores. Aguardando...');
                isRequestPendingRef.current = false;
                setLoading(false);
                // Tentar novamente após delay, mas apenas se ainda estiver na mesma tab
                setTimeout(() => {
                  if (currentTabRef.current === tab && !abortController.signal.aborted && !isRequestPendingRef.current) {
                    isRequestPendingRef.current = false; // Garantir que não está pendente
                    fetchDataForTab(tab);
                  }
                }, DELAYS.RETRY_RATE_LIMIT);
                return;
              }
              
              safeLog.error('Erro ao buscar entregadores:', result.error);
              processedData = { entregadores: [], total: 0 };
            } else if (result && result.data) {
                // Garantir que sempre retornamos um objeto com estrutura válida
                let entregadores: any[] = [];
                let total = 0;
                
                if (Array.isArray(result.data)) {
                  entregadores = result.data;
                  total = entregadores.length;
                } else if (result.data && typeof result.data === 'object') {
                  // A função retorna { entregadores: [...], total: number }
                  entregadores = Array.isArray(result.data.entregadores) 
                    ? result.data.entregadores 
                    : (Array.isArray(result.data.data) ? result.data.data : []);
                  // Usar o total retornado pela função, ou calcular se não existir
                  total = typeof result.data.total === 'number' 
                    ? result.data.total 
                    : entregadores.length;
                }
                
                processedData = { 
                  entregadores: Array.isArray(entregadores) ? entregadores : [], 
                  total: total
                };
            } else {
              // Sem dados retornados
              processedData = { entregadores: [], total: 0 };
            }
            break;

          case 'valores':
            // Verificar se foi abortado antes de fazer a requisição
            if (abortController.signal.aborted || currentTabRef.current !== tab) {
              isRequestPendingRef.current = false;
              setLoading(false);
              return;
            }
            
            const { p_ano: v_ano, p_semana: v_semana, p_praca: v_praca, p_sub_praca: v_sub_praca, p_origem: v_origem, p_data_inicial: v_data_inicial, p_data_final: v_data_final } = filterPayload as any;
            const listarValoresPayload = { p_ano: v_ano, p_semana: v_semana, p_praca: v_praca, p_sub_praca: v_sub_praca, p_origem: v_origem, p_data_inicial: v_data_inicial, p_data_final: v_data_final };
            
            // Log removido em produção para melhor performance
            
            result = await safeRpc<ValoresEntregador[]>('listar_valores_entregadores', listarValoresPayload, {
              timeout: RPC_TIMEOUTS.FAST,
              validateParams: false // Desabilitar validação para evitar problemas
            });
            
            // Verificar se esta requisição ainda é a mais recente
            if (currentRequestId !== requestIdRef.current) {
              isRequestPendingRef.current = false;
              setLoading(false);
              return;
            }
            
            // Verificar se foi abortado durante a requisição
            if (abortController.signal.aborted || currentTabRef.current !== tab) {
              isRequestPendingRef.current = false;
              setLoading(false);
              return;
            }
            
            // Verificar se é erro 500 ou rate limit e tratar adequadamente
            if (result?.error) {
              const is500 = is500Error(result.error);
              const isRateLimit = isRateLimitError(result.error);
              
              if (is500) {
                // Erro 500: aguardar um pouco antes de tentar novamente
                safeLog.warn('Erro 500 ao buscar valores. Aguardando antes de tentar novamente...');
                isRequestPendingRef.current = false;
                setLoading(false);
                
                // Tentar novamente após delay maior, mas apenas se ainda estiver na mesma tab
                setTimeout(() => {
                  if (currentTabRef.current === tab && !abortController.signal.aborted && !isRequestPendingRef.current) {
                    isRequestPendingRef.current = false; // Garantir que não está pendente
                    fetchDataForTab(tab);
                  }
                }, DELAYS.RETRY_500);
                return;
              }
              
              if (isRateLimit) {
                safeLog.warn('Rate limit ao buscar valores. Aguardando...');
                isRequestPendingRef.current = false;
                setLoading(false);
                // Tentar novamente após delay, mas apenas se ainda estiver na mesma tab
                setTimeout(() => {
                  if (currentTabRef.current === tab && !abortController.signal.aborted && !isRequestPendingRef.current) {
                    isRequestPendingRef.current = false; // Garantir que não está pendente
                    fetchDataForTab(tab);
                  }
                }, DELAYS.RETRY_RATE_LIMIT);
                return;
              }
              
              safeLog.error('Erro ao buscar valores:', result.error);
              processedData = [];
            } else if (result && result.data !== null && result.data !== undefined) {
                // A função retorna { entregadores: [...] } como JSONB
                // Supabase pode retornar como objeto ou string JSON
                let dataObj: any = result.data;
                
                // Log detalhado removido em produção para melhor performance
                
                // Tentar parsear se for string
                if (typeof dataObj === 'string') {
                  try {
                    dataObj = JSON.parse(dataObj);
                  } catch (e) {
                    safeLog.error('Erro ao parsear JSON de valores:', e);
                    dataObj = null;
                  }
                }
                
                // Extrair o array de entregadores
                if (dataObj !== null && dataObj !== undefined) {
                  if (Array.isArray(dataObj)) {
                    // Se já é um array, usar diretamente
                    processedData = dataObj;
                    // Log removido em produção
                  } else if (dataObj && typeof dataObj === 'object' && 'entregadores' in dataObj) {
                    // Se é objeto com propriedade entregadores
                    const entregadores = dataObj.entregadores;
                    if (Array.isArray(entregadores)) {
                      processedData = entregadores;
                      // Log removido em produção
                    } else {
                      if (IS_DEV) {
                        safeLog.warn('entregadores não é um array:', { tipo: typeof entregadores, valor: entregadores });
                      }
                      processedData = [];
                    }
                  } else {
                    // Estrutura inesperada - tentar acessar propriedades comuns
                    const possibleKeys = ['valores', 'data', 'items', 'results'];
                    let found = false;
                    for (const key of possibleKeys) {
                      if (dataObj && typeof dataObj === 'object' && key in dataObj && Array.isArray(dataObj[key])) {
                        processedData = dataObj[key];
                        // Log removido em produção
                        found = true;
                        break;
                      }
                    }
                    
                    if (!found) {
                      if (IS_DEV) {
                        safeLog.warn('❌ Estrutura inesperada nos dados de valores:', {
                          tipo: typeof dataObj,
                          keys: Object.keys(dataObj || {}),
                          sample: JSON.stringify(dataObj).substring(0, 500)
                        });
                      }
                      processedData = [];
                    }
                  }
                } else {
                  if (IS_DEV) {
                    safeLog.warn('❌ dataObj é null ou undefined');
                  }
                  processedData = [];
                }
            } else {
              // Sem dados retornados
              if (IS_DEV) {
                safeLog.warn('❌ Nenhum dado retornado da função listar_valores_entregadores', { 
                  hasResult: !!result,
                  hasData: !!(result && result.data),
                  resultKeys: result ? Object.keys(result) : null
                });
              }
              processedData = [];
            }
            break;
        }

        // Não lançar erro aqui se já foi tratado no case específico
        // if (result && result.error) {
        //   throw result.error;
        // }

        // Garantir que processedData seja sempre um array para valores
        if (tab === 'valores') {
          processedData = Array.isArray(processedData) ? processedData : [];
        }
        
        // Verificar se ainda estamos na mesma tab antes de atualizar estado
        if (currentTabRef.current === tab && !abortController.signal.aborted && currentRequestId === requestIdRef.current) {
          setData(processedData);
          cacheRef.current.set(cacheKey, createCacheEntry(processedData, CACHE_TTL));
          
          lastSuccessfulTabRef.current = tab;
          
          // Log removido em produção
        }
        
        // Marcar requisição como concluída
        isRequestPendingRef.current = false;

      } catch (err: any) {
        // Marcar requisição como concluída mesmo em caso de erro
        isRequestPendingRef.current = false;
        
        // Ignorar erros de abort (quando tab muda)
        if (err?.name === 'AbortError' || abortController.signal.aborted) {
          return;
        }

        // Verificar se é erro de rate limit
        const isRateLimit = isRateLimitError(err);

        if (isRateLimit) {
          safeLog.warn(`Rate limit atingido para aba ${tab}. Aguardando...`);
          // Tentar novamente após um delay, mas apenas se ainda estiver na mesma tab
          setTimeout(() => {
            if (currentTabRef.current === tab && !abortController.signal.aborted && !isRequestPendingRef.current) {
              isRequestPendingRef.current = false; // Garantir que não está pendente
              fetchDataForTab(tab);
            }
          }, DELAYS.RETRY_RATE_LIMIT);
          return;
        }

        safeLog.error(`Erro ao carregar dados para a aba ${tab}:`, err);
        
        // Verificar se ainda estamos na mesma tab antes de atualizar estado
        if (currentTabRef.current === tab) {
          // Para valores, manter como array vazio em caso de erro, não null
          if (tab === 'valores') {
            setData([]);
          } else {
            setData(null);
          }
        }
      } finally {
        // Só atualizar loading se ainda estamos na mesma tab
        if (currentTabRef.current === tab) {
          setLoading(false);
        }
        // Garantir que flag seja resetada
        isRequestPendingRef.current = false;
      }
    };

    if (['utr', 'entregadores', 'valores', 'prioridade'].includes(activeTab)) {
        // Usar debounce fixo de 100ms (igual ao Dashboard) para consistência e melhor performance
        debounceTimeoutRef.current = setTimeout(() => {
          if (currentTabRef.current === activeTab && !isRequestPendingRef.current) {
            fetchDataForTab(activeTab);
          }
        }, DEBOUNCE_MS);
        
        return () => {
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
            debounceTimeoutRef.current = null;
          }
          // Cancelar requisição se o componente desmontar ou tab mudar
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
          }
        };
    } else {
      // Se não é uma tab que precisa de dados, limpar dados anteriores
      setData(null);
      setLoading(false);
    }
  }, [activeTab, filterPayload, currentUser]);

  return { data, loading };
}
