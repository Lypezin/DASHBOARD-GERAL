import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Totals, AderenciaSemanal, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem,
  FilterOption, Filters, DimensoesDashboard, DashboardResumoData, UtrData, EntregadoresData,
  ValoresEntregador, EvolucaoMensal, EvolucaoSemanal, UtrSemanal
} from '@/types';
import { buildFilterPayload, safeNumber } from '@/utils/helpers';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useDashboardData(initialFilters: Filters, activeTab: string, anoEvolucao: number, currentUser?: { is_admin: boolean; assigned_pracas: string[] } | null) {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [aderenciaSemanal, setAderenciaSemanal] = useState<AderenciaSemanal[]>([]);
  const [aderenciaDia, setAderenciaDia] = useState<AderenciaDia[]>([]);
  const [aderenciaTurno, setAderenciaTurno] = useState<AderenciaTurno[]>([]);
  const [aderenciaSubPraca, setAderenciaSubPraca] = useState<AderenciaSubPraca[]>([]);
  const [aderenciaOrigem, setAderenciaOrigem] = useState<AderenciaOrigem[]>([]);
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [semanasDisponiveis, setSemanasDisponiveis] = useState<string[]>([]);
  const [pracas, setPracas] = useState<FilterOption[]>([]);
  const [subPracas, setSubPracas] = useState<FilterOption[]>([]);
  const [origens, setOrigens] = useState<FilterOption[]>([]);
  const [turnos, setTurnos] = useState<FilterOption[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [utrData, setUtrData] = useState<UtrData | null>(null);
  const [loadingUtr, setLoadingUtr] = useState(false);
  const [entregadoresData, setEntregadoresData] = useState<EntregadoresData | null>(null);
  const [loadingEntregadores, setLoadingEntregadores] = useState(false);
  const [prioridadeData, setPrioridadeData] = useState<EntregadoresData | null>(null);
  const [loadingPrioridade, setLoadingPrioridade] = useState(false);
  const [valoresData, setValoresData] = useState<ValoresEntregador[]>([]);
  const [loadingValores, setLoadingValores] = useState(false);
  const [evolucaoMensal, setEvolucaoMensal] = useState<EvolucaoMensal[]>([]);
  const [evolucaoSemanal, setEvolucaoSemanal] = useState<EvolucaoSemanal[]>([]);
  const [utrSemanal, setUtrSemanal] = useState<UtrSemanal[]>([]);
  const [loadingEvolucao, setLoadingEvolucao] = useState(false);

  const cacheKeyRef = useRef<string>('');
  const cachedDataRef = useRef<DashboardResumoData | null>(null);
  const evolucaoCacheRef = useRef<Map<string, { mensal: EvolucaoMensal[]; semanal: EvolucaoSemanal[]; utrSemanal: UtrSemanal[] }>>(new Map());
  const dashboardDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const filterPayload = useMemo(() => {
    const payload = buildFilterPayload(initialFilters, currentUser);
    if (IS_DEV) {
      console.log('FilterPayload gerado:', payload);
      console.log('CurrentUser:', currentUser);
      console.log('InitialFilters:', initialFilters);
      
      // Verificar se o usuário tem restrições
      if (currentUser && !currentUser.is_admin && currentUser.assigned_pracas.length > 0) {
        console.log('Usuário restrito detectado. Praças permitidas:', currentUser.assigned_pracas);
        console.log('Praça no payload:', payload.p_praca);
      }
    }
    return payload;
  }, [initialFilters, currentUser]);

  // Buscar anos e semanas disponíveis
  useEffect(() => {
    const fetchInitialDimensions = async () => {
      try {
        const { data: anosData, error: anosError } = await supabase.rpc('listar_anos_disponiveis');
        if (anosError) throw anosError;
        setAnosDisponiveis(anosData || []);

        const { data: semanasData, error: semanasError } = await supabase.rpc('listar_todas_semanas');
        if (semanasError) throw semanasError;
        setSemanasDisponiveis(Array.isArray(semanasData) ? semanasData.map(s => String(s)) : []);
      } catch (err) {
        if (IS_DEV) console.error('Erro ao buscar dimensões iniciais:', err);
        setAnosDisponiveis([new Date().getFullYear()]);
        setSemanasDisponiveis([]);
      }
    };
    fetchInitialDimensions();
  }, []);

  // Buscar dados principais do Dashboard
  useEffect(() => {
    if (dashboardDebounceRef.current) clearTimeout(dashboardDebounceRef.current);

    const payloadKey = JSON.stringify(filterPayload);
    if (cacheKeyRef.current === payloadKey && cachedDataRef.current) {
      const cached = cachedDataRef.current;
        setTotals({
            ofertadas: safeNumber(cached.totais?.corridas_ofertadas ?? 0),
            aceitas: safeNumber(cached.totais?.corridas_aceitas ?? 0),
            rejeitadas: safeNumber(cached.totais?.corridas_rejeitadas ?? 0),
            completadas: safeNumber(cached.totais?.corridas_completadas ?? 0),
        });
      setAderenciaSemanal(Array.isArray(cached.semanal) ? cached.semanal : []);
      setAderenciaDia(Array.isArray(cached.dia) ? cached.dia : []);
      setAderenciaTurno(Array.isArray(cached.turno) ? cached.turno : []);
      setAderenciaSubPraca(Array.isArray(cached.sub_praca) ? cached.sub_praca : []);
      setAderenciaOrigem(Array.isArray(cached.origem) ? cached.origem : []);
      return;
    }

    dashboardDebounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.rpc('dashboard_resumo', filterPayload as any);
        if (error) {
          if (IS_DEV) console.error('Erro ao carregar dashboard_resumo:', error);
          throw error;
        }
        
        cachedDataRef.current = data;
        cacheKeyRef.current = payloadKey;

        setTotals({
            ofertadas: safeNumber(data.totais?.corridas_ofertadas ?? 0),
            aceitas: safeNumber(data.totais?.corridas_aceitas ?? 0),
            rejeitadas: safeNumber(data.totais?.corridas_rejeitadas ?? 0),
            completadas: safeNumber(data.totais?.corridas_completadas ?? 0),
        });
        setAderenciaSemanal(Array.isArray(data.semanal) ? data.semanal : []);
        setAderenciaDia(Array.isArray(data.dia) ? data.dia : []);
        setAderenciaTurno(Array.isArray(data.turno) ? data.turno : []);
        setAderenciaSubPraca(Array.isArray(data.sub_praca) ? data.sub_praca : []);
        setAderenciaOrigem(Array.isArray(data.origem) ? data.origem : []);

        if (data.dimensoes) {
          let pracasDisponiveis: FilterOption[] = Array.isArray(data.dimensoes.pracas) ? data.dimensoes.pracas.map((p: any) => ({ value: String(p), label: String(p) })) : [];

          // Filtrar praças se o usuário não for admin
          if (currentUser && !currentUser.is_admin && currentUser.assigned_pracas.length > 0) {
            const pracasPermitidas = new Set(currentUser.assigned_pracas);
            pracasDisponiveis = pracasDisponiveis.filter((p) => pracasPermitidas.has(p.value));
          }

          setPracas(pracasDisponiveis);
          setSubPracas(Array.isArray(data.dimensoes.sub_pracas) ? data.dimensoes.sub_pracas.map((p: any) => ({ value: String(p), label: String(p) })) : []);
          setOrigens(Array.isArray(data.dimensoes.origens) ? data.dimensoes.origens.map((p: any) => ({ value: String(p), label: String(p) })) : []);
          if (Array.isArray((data.dimensoes as any).turnos)) {
            setTurnos((data.dimensoes as any).turnos.map((t: any) => ({ value: String(t), label: String(t) })));
          }
        }
      } catch (err: any) {
        if (IS_DEV) console.error('Erro ao carregar dashboard_resumo:', err);
        const errorMessage = err?.message || err?.code || 'Não foi possível carregar os dados do dashboard.';
        setError(errorMessage);
        // Manter dados anteriores em cache se houver erro
        if (!cachedDataRef.current) {
          setTotals({ ofertadas: 0, aceitas: 0, rejeitadas: 0, completadas: 0 });
          setAderenciaSemanal([]);
          setAderenciaDia([]);
          setAderenciaTurno([]);
          setAderenciaSubPraca([]);
          setAderenciaOrigem([]);
        }
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      if (dashboardDebounceRef.current) clearTimeout(dashboardDebounceRef.current);
    };
  }, [filterPayload, currentUser]);

  // Cache para dados de abas específicas
  const tabDataCacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map());
  const CACHE_TTL = 30000; // 30 segundos

  // Fetch data for specific tabs
  useEffect(() => {
    const fetchDataForTab = async (tab: string) => {
      const cacheKey = `${tab}-${JSON.stringify(filterPayload)}`;
      const cached = tabDataCacheRef.current.get(cacheKey);
      
      // Usar cache se ainda válido
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        switch (tab) {
          case 'utr':
            setUtrData(cached.data);
            setLoadingUtr(false);
            break;
          case 'entregadores':
            setEntregadoresData(cached.data);
            setLoadingEntregadores(false);
            break;
          case 'valores':
            setValoresData(cached.data);
            setLoadingValores(false);
            break;
          case 'prioridade':
            setPrioridadeData(cached.data);
            setLoadingPrioridade(false);
            break;
        }
        return;
      }

      switch (tab) {
        case 'utr':
          setLoadingUtr(true);
          try {
            const { data, error } = await supabase.rpc('calcular_utr', filterPayload as any);
            if (error) throw error;
            setUtrData(data);
            tabDataCacheRef.current.set(cacheKey, { data, timestamp: Date.now() });
          } catch (err: any) {
            if (IS_DEV) console.error('Erro ao carregar UTR:', err);
            setUtrData(null);
          } finally {
            setLoadingUtr(false);
          }
          break;
        case 'entregadores':
            setLoadingEntregadores(true);
            try {
              // Tentar listar_entregadores primeiro, se falhar usar pesquisar_entregadores
              if (IS_DEV) {
                console.log('Chamando listar_entregadores com filterPayload:', filterPayload);
                console.log('CurrentUser:', currentUser);
              }
              
              let result = await supabase.rpc('listar_entregadores', filterPayload as any);
              
              // Se a função não existir (404), tentar a função antiga
              if (result.error && (result.error.code === '42883' || result.error.message?.includes('does not exist'))) {
                if (IS_DEV) console.log('listar_entregadores não existe, tentando pesquisar_entregadores');
                result = await supabase.rpc('pesquisar_entregadores', { termo_busca: '' });
              }
              
              const { data, error } = result;
              
              if (error) {
                if (IS_DEV) console.error('Erro ao carregar entregadores:', error);
                throw error;
              }
              
              if (IS_DEV) {
                console.log('Dados retornados de listar_entregadores:', data);
                console.log('Tipo dos dados:', typeof data);
                if (data && typeof data === 'object') {
                  console.log('Propriedades do objeto:', Object.keys(data));
                }
              }
              
              // A função retorna JSONB com estrutura { entregadores: [...] }
              let entregadores: any[] = [];
              if (data) {
                if (Array.isArray(data)) {
                  entregadores = data;
                } else if (data && typeof data === 'object') {
                  // Verificar se tem a propriedade entregadores
                  if (Array.isArray(data.entregadores)) {
                    entregadores = data.entregadores;
                  }
                  // Se não tem entregadores, mas é um objeto, pode ser que seja o próprio array
                  else if (Object.keys(data).length > 0) {
                    // Tentar converter o objeto em array se tiver propriedades numéricas
                    const keys = Object.keys(data);
                    if (keys.every(k => !isNaN(Number(k)))) {
                      entregadores = Object.values(data);
                    }
                  }
                } else if (typeof data === 'string') {
                  try {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed)) {
                      entregadores = parsed;
                    } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.entregadores)) {
                      entregadores = parsed.entregadores;
                    }
                  } catch (e) {
                    if (IS_DEV) console.warn('Não foi possível fazer parse do JSON:', e);
                  }
                }
              }
              
              const entregadoresData = { entregadores: Array.isArray(entregadores) ? entregadores : [], total: Array.isArray(entregadores) ? entregadores.length : 0 };
              
              if (IS_DEV) {
                console.log('Entregadores processados:', entregadoresData);
              }
              
              setEntregadoresData(entregadoresData);
              tabDataCacheRef.current.set(cacheKey, { data: entregadoresData, timestamp: Date.now() });
            } catch (err: any) {
              if (IS_DEV) console.error('Erro ao carregar entregadores:', err);
              setEntregadoresData({ entregadores: [], total: 0 });
            } finally {
              setLoadingEntregadores(false);
            }
            break;
        case 'valores':
            setLoadingValores(true);
            try {
              // Tentar listar_valores_entregadores primeiro, se falhar usar pesquisar_valores_entregadores
              if (IS_DEV) {
                console.log('Chamando listar_valores_entregadores com filterPayload:', filterPayload);
                console.log('CurrentUser:', currentUser);
              }
              
              let result = await supabase.rpc('listar_valores_entregadores', filterPayload as any);
              
              // Se a função não existir (404), tentar a função antiga
              if (result.error && (result.error.code === '42883' || result.error.message?.includes('does not exist'))) {
                if (IS_DEV) console.log('listar_valores_entregadores não existe, tentando pesquisar_valores_entregadores');
                result = await supabase.rpc('pesquisar_valores_entregadores', { termo_busca: '' });
              }
              
              const { data, error } = result;
              
              if (error) {
                if (IS_DEV) console.error('Erro ao carregar valores:', error);
                throw error;
              }
              
              if (IS_DEV) {
                console.log('Dados retornados de listar_valores_entregadores:', data);
                console.log('Tipo dos dados valores:', typeof data);
                if (data && typeof data === 'object') {
                  console.log('Propriedades do objeto valores:', Object.keys(data));
                }
              }
              
              // A função retorna JSONB, então precisa acessar o array interno
              let valores: any[] = [];
              if (data) {
                if (Array.isArray(data)) {
                  // Se for array direto
                  valores = data;
                } else if (typeof data === 'object') {
                  // Se for objeto, tentar diferentes propriedades
                  if (Array.isArray(data.valores)) {
                    valores = data.valores;
                  } else if (Array.isArray(data.entregadores)) {
                    // Mapear de entregadores para valores
                    valores = data.entregadores.map((e: any) => ({
                      id_entregador: e.id_entregador || e.id_da_pessoa_entregadora,
                      nome_entregador: e.nome_entregador || e.pessoa_entregadora,
                      total_taxas: e.total_taxas || e.soma_das_taxas_das_corridas_aceitas || 0,
                      numero_corridas_aceitas: e.numero_corridas_aceitas || e.numero_de_corridas_aceitas || 0,
                      taxa_media: e.taxa_media || (e.total_taxas && e.numero_corridas_aceitas ? e.total_taxas / e.numero_corridas_aceitas : 0)
                    }));
                  }
                  // Se não tem valores nem entregadores, mas é um objeto, pode ser que seja o próprio array
                  else if (Object.keys(data).length > 0) {
                    // Tentar converter o objeto em array se tiver propriedades numéricas
                    const keys = Object.keys(data);
                    if (keys.every(k => !isNaN(Number(k)))) {
                      valores = Object.values(data);
                    }
                  }
                } else if (typeof data === 'string') {
                  // Se for string JSON, tentar fazer parse
                  try {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed)) {
                      valores = parsed;
                    } else if (parsed && typeof parsed === 'object') {
                      if (Array.isArray(parsed.valores)) {
                        valores = parsed.valores;
                      } else if (Array.isArray(parsed.entregadores)) {
                        valores = parsed.entregadores.map((e: any) => ({
                          id_entregador: e.id_entregador || e.id_da_pessoa_entregadora,
                          nome_entregador: e.nome_entregador || e.pessoa_entregadora,
                          total_taxas: e.total_taxas || e.soma_das_taxas_das_corridas_aceitas || 0,
                          numero_corridas_aceitas: e.numero_corridas_aceitas || e.numero_de_corridas_aceitas || 0,
                          taxa_media: e.taxa_media || (e.total_taxas && e.numero_corridas_aceitas ? e.total_taxas / e.numero_corridas_aceitas : 0)
                        }));
                      }
                    }
                  } catch (e) {
                    if (IS_DEV) console.warn('Não foi possível fazer parse do JSON:', e);
                  }
                }
              }
              
              // Se ainda não temos dados e usamos a função antiga, aplicar filtro manual
              if (valores.length === 0 && error && (error as any)?.code === '42883' && currentUser && !currentUser.is_admin && currentUser.assigned_pracas.length > 0) {
                if (IS_DEV) console.log('Aplicando filtro manual de praças para valores');
                // Não temos dados porque a função antiga não filtra por praça
                // Retornar array vazio para usuários restritos
              }
              
              if (IS_DEV) {
                console.log('Valores processados:', valores.length, valores);
              }
              
              setValoresData(valores);
              tabDataCacheRef.current.set(cacheKey, { data: valores, timestamp: Date.now() });
            } catch (err: any) {
              if (IS_DEV) console.error('Erro ao carregar valores:', err);
              setValoresData([]);
            } finally {
              setLoadingValores(false);
            }
            break;
        case 'prioridade':
            setLoadingPrioridade(true);
            try {
              // Tentar listar_entregadores primeiro, se falhar usar pesquisar_entregadores
              if (IS_DEV) {
                console.log('Chamando listar_entregadores (prioridade) com filterPayload:', filterPayload);
                console.log('CurrentUser:', currentUser);
              }
              
              let result = await supabase.rpc('listar_entregadores', filterPayload as any);
              
              // Se a função não existir (404), tentar a função antiga
              if (result.error && (result.error.code === '42883' || result.error.message?.includes('does not exist'))) {
                if (IS_DEV) console.log('listar_entregadores não existe para prioridade, tentando pesquisar_entregadores');
                result = await supabase.rpc('pesquisar_entregadores', { termo_busca: '' });
              }
              
              const { data, error } = result;
              
              if (error) {
                if (IS_DEV) console.error('Erro ao carregar prioridade/promo:', error);
                throw error;
              }
              
              if (IS_DEV) {
                console.log('Dados retornados de listar_entregadores (prioridade):', data);
                console.log('Tipo dos dados prioridade:', typeof data);
                if (data && typeof data === 'object') {
                  console.log('Propriedades do objeto prioridade:', Object.keys(data));
                }
              }
              
              // A função retorna JSONB com estrutura { entregadores: [...] }
              let entregadores: any[] = [];
              if (data) {
                if (Array.isArray(data)) {
                  entregadores = data;
                } else if (data && typeof data === 'object') {
                  // Verificar se tem a propriedade entregadores
                  if (Array.isArray(data.entregadores)) {
                    entregadores = data.entregadores;
                  }
                  // Se não tem entregadores, mas é um objeto, pode ser que seja o próprio array
                  else if (Object.keys(data).length > 0) {
                    // Tentar converter o objeto em array se tiver propriedades numéricas
                    const keys = Object.keys(data);
                    if (keys.every(k => !isNaN(Number(k)))) {
                      entregadores = Object.values(data);
                    }
                  }
                } else if (typeof data === 'string') {
                  try {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed)) {
                      entregadores = parsed;
                    } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.entregadores)) {
                      entregadores = parsed.entregadores;
                    }
                  } catch (e) {
                    if (IS_DEV) console.warn('Não foi possível fazer parse do JSON (prioridade):', e);
                  }
                }
              }
              
              const prioridadeData = { entregadores: Array.isArray(entregadores) ? entregadores : [], total: Array.isArray(entregadores) ? entregadores.length : 0 };
              
              if (IS_DEV) {
                console.log('Prioridade processada:', prioridadeData);
              }
              
              setPrioridadeData(prioridadeData);
              tabDataCacheRef.current.set(cacheKey, { data: prioridadeData, timestamp: Date.now() });
            } catch (err: any) {
              if (IS_DEV) console.error('Erro ao carregar prioridade/promo:', err);
              setPrioridadeData({ entregadores: [], total: 0 });
            } finally {
              setLoadingPrioridade(false);
            }
            break;
        case 'evolucao':
          // Cache key apenas com o ano, já que evolução não usa outros filtros
          const evolucaoCacheKey = `evolucao-${anoEvolucao}`;
          if (evolucaoCacheRef.current.has(evolucaoCacheKey)) {
            const cached = evolucaoCacheRef.current.get(evolucaoCacheKey)!;
            setEvolucaoMensal(cached.mensal);
            setEvolucaoSemanal(cached.semanal);
            setUtrSemanal(cached.utrSemanal);
            setLoadingEvolucao(false);
            return;
          }
          setLoadingEvolucao(true);
          try {
            // Carregar dados de evolução - usar apenas p_ano, não outros filtros
            if (IS_DEV) {
              console.log('Carregando evolução para ano:', anoEvolucao);
            }
            
            const [mensalRes, semanalRes, utrSemanalRes] = await Promise.all([
              supabase.rpc('listar_evolucao_mensal', { p_ano: anoEvolucao }).catch(err => {
                if (IS_DEV) console.error('Erro em listar_evolucao_mensal:', err);
                return { data: [], error: err };
              }),
              supabase.rpc('listar_evolucao_semanal', { p_ano: anoEvolucao }).catch(err => {
                if (IS_DEV) console.error('Erro em listar_evolucao_semanal:', err);
                return { data: [], error: err };
              }),
              supabase.rpc('listar_utr_semanal', { p_ano: anoEvolucao }).catch(err => {
                if (IS_DEV) console.error('Erro em listar_utr_semanal:', err);
                return { data: [], error: err };
              })
            ]);
            
            // Verificar erros em cada resposta
            if (mensalRes.error) {
              if (IS_DEV) console.error('Erro ao carregar evolução mensal:', mensalRes.error);
            }
            if (semanalRes.error) {
              if (IS_DEV) console.error('Erro ao carregar evolução semanal:', semanalRes.error);
            }
            if (utrSemanalRes.error) {
              if (IS_DEV) console.error('Erro ao carregar UTR semanal:', utrSemanalRes.error);
            }
            
            // Processar dados retornados - podem ser arrays diretos ou objetos JSONB
            let mensal: any[] = [];
            let semanal: any[] = [];
            let utr: any[] = [];
            
            // Processar mensal
            if (mensalRes.data) {
              if (Array.isArray(mensalRes.data)) {
                mensal = mensalRes.data;
              } else if (typeof mensalRes.data === 'object' && mensalRes.data.mensal) {
                mensal = Array.isArray(mensalRes.data.mensal) ? mensalRes.data.mensal : [];
              } else if (typeof mensalRes.data === 'string') {
                try {
                  const parsed = JSON.parse(mensalRes.data);
                  mensal = Array.isArray(parsed) ? parsed : (parsed.mensal || []);
                } catch (e) {
                  if (IS_DEV) console.warn('Erro ao fazer parse de mensal:', e);
                }
              }
            }
            
            // Processar semanal
            if (semanalRes.data) {
              if (Array.isArray(semanalRes.data)) {
                semanal = semanalRes.data;
              } else if (typeof semanalRes.data === 'object' && semanalRes.data.semanal) {
                semanal = Array.isArray(semanalRes.data.semanal) ? semanalRes.data.semanal : [];
              } else if (typeof semanalRes.data === 'string') {
                try {
                  const parsed = JSON.parse(semanalRes.data);
                  semanal = Array.isArray(parsed) ? parsed : (parsed.semanal || []);
                } catch (e) {
                  if (IS_DEV) console.warn('Erro ao fazer parse de semanal:', e);
                }
              }
            }
            
            // Processar UTR
            if (utrSemanalRes.data) {
              if (Array.isArray(utrSemanalRes.data)) {
                utr = utrSemanalRes.data;
              } else if (typeof utrSemanalRes.data === 'object' && utrSemanalRes.data.utr) {
                utr = Array.isArray(utrSemanalRes.data.utr) ? utrSemanalRes.data.utr : [];
              } else if (typeof utrSemanalRes.data === 'string') {
                try {
                  const parsed = JSON.parse(utrSemanalRes.data);
                  utr = Array.isArray(parsed) ? parsed : (parsed.utr || []);
                } catch (e) {
                  if (IS_DEV) console.warn('Erro ao fazer parse de utr:', e);
                }
              }
            }
            
            if (IS_DEV) {
              console.log('Evolução carregada:', { mensal: mensal.length, semanal: semanal.length, utr: utr.length });
              console.log('Ano solicitado:', anoEvolucao);
              if (mensal.length > 0) console.log('Primeiro item mensal:', mensal[0]);
              if (semanal.length > 0) console.log('Primeiro item semanal:', semanal[0]);
              if (utr.length > 0) console.log('Primeiro item utr:', utr[0]);
              
              // Verificar se há dados para o ano solicitado
              const mensalAno = mensal.filter(m => m.ano === anoEvolucao);
              const semanalAno = semanal.filter(s => s.ano === anoEvolucao);
              const utrAno = utr.filter(u => u.ano === anoEvolucao);
              console.log('Dados filtrados por ano:', { 
                mensalAno: mensalAno.length, 
                semanalAno: semanalAno.length, 
                utrAno: utrAno.length 
              });
            }
            
            evolucaoCacheRef.current.set(evolucaoCacheKey, { mensal, semanal, utrSemanal: utr });
            setEvolucaoMensal(mensal);
            setEvolucaoSemanal(semanal);
            setUtrSemanal(utr);
          } catch (err) {
            if (IS_DEV) console.error('Erro ao carregar evolução:', err);
            setEvolucaoMensal([]);
            setEvolucaoSemanal([]);
            setUtrSemanal([]);
          } finally {
            setLoadingEvolucao(false);
          }
          break;
      }
    };

    // Delay de 200ms para evitar múltiplas requisições ao trocar de aba
    const timeoutId = setTimeout(() => fetchDataForTab(activeTab), 200);
    return () => clearTimeout(timeoutId);
  }, [activeTab, filterPayload, anoEvolucao, currentUser]);
  
  const aderenciaGeral = useMemo(() => {
    if (aderenciaSemanal.length === 0) return undefined;
    if (aderenciaSemanal.length === 1) return aderenciaSemanal[0];
    
    const { totalHorasAEntregar, totalHorasEntregues } = aderenciaSemanal.reduce(
      (acc, semana) => ({
        totalHorasAEntregar: acc.totalHorasAEntregar + parseFloat(semana.horas_a_entregar || '0'),
        totalHorasEntregues: acc.totalHorasEntregues + parseFloat(semana.horas_entregues || '0')
      }),
      { totalHorasAEntregar: 0, totalHorasEntregues: 0 }
    );
    
    const aderenciaPercentual = totalHorasAEntregar > 0 
      ? (totalHorasEntregues / totalHorasAEntregar) * 100 
      : 0;
    
    return {
      semana_ano: 'Geral',
      horas_a_entregar: totalHorasAEntregar.toFixed(2),
      horas_entregues: totalHorasEntregues.toFixed(2),
      aderencia_percentual: aderenciaPercentual
    };
  }, [aderenciaSemanal]);

  return {
    totals, aderenciaSemanal, aderenciaDia, aderenciaTurno, aderenciaSubPraca, aderenciaOrigem,
    anosDisponiveis, semanasDisponiveis, pracas, subPracas, origens, turnos, loading, error,
    utrData, loadingUtr, entregadoresData, loadingEntregadores, prioridadeData, loadingPrioridade,
    valoresData, loadingValores, evolucaoMensal, evolucaoSemanal, utrSemanal, loadingEvolucao,
    aderenciaGeral
  };
}
