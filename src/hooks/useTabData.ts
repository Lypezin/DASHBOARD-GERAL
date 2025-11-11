import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { UtrData, EntregadoresData, ValoresEntregador } from '@/types';

const IS_DEV = process.env.NODE_ENV === 'development';
const CACHE_TTL = 30000; // 30 segundos

type TabData = UtrData | EntregadoresData | ValoresEntregador[] | null;

export function useTabData(activeTab: string, filterPayload: object, currentUser?: { is_admin: boolean; assigned_pracas: string[] } | null) {
  const [data, setData] = useState<TabData>(null);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map());

  useEffect(() => {
    const fetchDataForTab = async (tab: string) => {
      const cacheKey = `${tab}-${JSON.stringify(filterPayload)}`;
      const cached = cacheRef.current.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        // Para valores, garantir que o cache retorne um array
        const cachedData = tab === 'valores' 
          ? (Array.isArray(cached.data) ? cached.data : [])
          : cached.data;
        setData(cachedData);
        setLoading(false);
        if (IS_DEV && tab === 'valores') {
          safeLog.info('📦 Dados carregados do cache (valores):', Array.isArray(cachedData) ? cachedData.length : 0);
        }
        return;
      }

      setLoading(true);

      try {
        let result: { data: any, error: any } | null = null;
        let processedData: TabData = null;

        switch (tab) {
          case 'utr':
            result = await supabase.rpc('calcular_utr', filterPayload as any);
            if (result && !result.error) processedData = result.data;
            break;

          case 'entregadores':
          case 'prioridade':
            const { p_ano, p_semana, p_praca, p_sub_praca, p_origem } = filterPayload as any;
            const listarEntregadoresPayload = { p_ano, p_semana, p_praca, p_sub_praca, p_origem };
            result = await supabase.rpc('listar_entregadores', listarEntregadoresPayload);
            if (result?.error) {
              safeLog.error('Erro ao buscar entregadores:', result.error);
              processedData = { entregadores: [], total: 0 };
            } else if (result && result.data) {
                // Garantir que sempre retornamos um objeto com estrutura válida
                let entregadores: any[] = [];
                
                if (Array.isArray(result.data)) {
                  entregadores = result.data;
                } else if (result.data && typeof result.data === 'object') {
                  // Pode ser { entregadores: [...] } ou outro formato
                  entregadores = Array.isArray(result.data.entregadores) 
                    ? result.data.entregadores 
                    : (Array.isArray(result.data.data) ? result.data.data : []);
                }
                
                processedData = { 
                  entregadores: Array.isArray(entregadores) ? entregadores : [], 
                  total: Array.isArray(entregadores) ? entregadores.length : 0 
                };
            } else {
              // Sem dados retornados
              processedData = { entregadores: [], total: 0 };
            }
            break;

          case 'valores':
            const { p_ano: v_ano, p_semana: v_semana, p_praca: v_praca, p_sub_praca: v_sub_praca, p_origem: v_origem } = filterPayload as any;
            const listarValoresPayload = { p_ano: v_ano, p_semana: v_semana, p_praca: v_praca, p_sub_praca: v_sub_praca, p_origem: v_origem };
            
            if (IS_DEV) {
              safeLog.info('Buscando valores com payload:', listarValoresPayload);
            }
            
            result = await supabase.rpc('listar_valores_entregadores', listarValoresPayload);
            
            if (result?.error) {
              safeLog.error('Erro ao buscar valores:', result.error);
              processedData = [];
            } else if (result && result.data !== null && result.data !== undefined) {
                // A função retorna { entregadores: [...] } como JSONB
                // Supabase pode retornar como objeto ou string JSON
                let dataObj: any = result.data;
                
                if (IS_DEV) {
                  safeLog.info('Dados brutos recebidos:', {
                    tipo: typeof dataObj,
                    isArray: Array.isArray(dataObj),
                    isNull: dataObj === null,
                    isUndefined: dataObj === undefined,
                    keys: dataObj && typeof dataObj === 'object' && !Array.isArray(dataObj) ? Object.keys(dataObj) : null,
                    hasEntregadores: dataObj && typeof dataObj === 'object' && 'entregadores' in dataObj,
                    sample: typeof dataObj === 'string' 
                      ? dataObj.substring(0, 200) 
                      : (dataObj ? JSON.stringify(dataObj).substring(0, 200) : 'null/undefined')
                  });
                }
                
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
                    if (IS_DEV) {
                      safeLog.info('✅ Dados processados como array direto:', dataObj.length, 'entregadores');
                    }
                  } else if (dataObj && typeof dataObj === 'object' && 'entregadores' in dataObj) {
                    // Se é objeto com propriedade entregadores
                    const entregadores = dataObj.entregadores;
                    if (Array.isArray(entregadores)) {
                      processedData = entregadores;
                      if (IS_DEV) {
                        safeLog.info('✅ Dados processados de objeto.entregadores:', entregadores.length, 'entregadores');
                      }
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
                        if (IS_DEV) {
                          safeLog.info(`✅ Dados encontrados em ${key}:`, processedData.length);
                        }
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
        
        setData(processedData);
        cacheRef.current.set(cacheKey, { data: processedData, timestamp: Date.now() });
        
        if (IS_DEV && tab === 'valores') {
          safeLog.info('✅ Dados finais setados para valores:', {
            tipo: typeof processedData,
            isArray: Array.isArray(processedData),
            length: Array.isArray(processedData) ? processedData.length : 0
          });
        }

      } catch (err: any) {
        safeLog.error(`Erro ao carregar dados para a aba ${tab}:`, err);
        // Para valores, manter como array vazio em caso de erro, não null
        if (tab === 'valores') {
          setData([]);
        } else {
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    if (['utr', 'entregadores', 'valores', 'prioridade'].includes(activeTab)) {
        const timeoutId = setTimeout(() => fetchDataForTab(activeTab), 200);
        return () => clearTimeout(timeoutId);
    }
  }, [activeTab, filterPayload, currentUser]);

  return { data, loading };
}
