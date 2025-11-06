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
          setPracas(Array.isArray(data.dimensoes.pracas) ? data.dimensoes.pracas.map((p: any) => ({ value: String(p), label: String(p) })) : []);
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
  }, [filterPayload]);

  // Fetch data for specific tabs
  useEffect(() => {
    const fetchDataForTab = async (tab: string) => {
      switch (tab) {
        case 'utr':
          setLoadingUtr(true);
          try {
            const { data, error } = await supabase.rpc('calcular_utr', filterPayload as any);
            if (error) throw error;
            setUtrData(data);
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
              // Tentar listar_entregadores primeiro (nova função)
              let result = await supabase.rpc('listar_entregadores', filterPayload as any);
              
              // Se não funcionar, tentar pesquisar_entregadores (função antiga)
              if (result.error) {
                result = await supabase.rpc('pesquisar_entregadores', { termo_busca: '' });
              }
              
              if (result.error) throw result.error;
              const entregadores = Array.isArray(result.data) ? result.data : (result.data?.entregadores || []);
              setEntregadoresData({ entregadores: Array.isArray(entregadores) ? entregadores : [], total: Array.isArray(entregadores) ? entregadores.length : 0 });
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
              // Usar listar_valores_entregadores (nome correto da função)
              const { data, error } = await supabase.rpc('listar_valores_entregadores', filterPayload as any);
              
              if (error) throw error;
              
              // A função retorna JSONB, então precisa acessar o array interno
              let valores = [];
              if (data && typeof data === 'object') {
                // Pode ser array direto ou {valores: [...]}
                if (Array.isArray(data)) {
                  valores = data;
                } else if (Array.isArray(data.valores)) {
                  valores = data.valores;
                } else if (Array.isArray(data.entregadores)) {
                  // Mapear de entregadores para valores
                  valores = data.entregadores.map((e: any) => ({
                    id_entregador: e.id_entregador,
                    nome_entregador: e.nome_entregador,
                    total_taxas: e.total_taxas || 0,
                    numero_corridas_aceitas: e.numero_corridas_aceitas || 0,
                    taxa_media: e.taxa_media || 0
                  }));
                }
              }
              setValoresData(valores);
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
              // Tentar listar_entregadores primeiro (nova função)
              let result = await supabase.rpc('listar_entregadores', filterPayload as any);
              
              // Se não funcionar, tentar pesquisar_entregadores (função antiga)
              if (result.error) {
                result = await supabase.rpc('pesquisar_entregadores', { termo_busca: '' });
              }
              
              if (result.error) throw result.error;
              const entregadores = Array.isArray(result.data) ? result.data : (result.data?.entregadores || []);
              setPrioridadeData({ entregadores: Array.isArray(entregadores) ? entregadores : [], total: Array.isArray(entregadores) ? entregadores.length : 0 });
            } catch (err: any) {
              if (IS_DEV) console.error('Erro ao carregar prioridade/promo:', err);
              setPrioridadeData({ entregadores: [], total: 0 });
            } finally {
              setLoadingPrioridade(false);
            }
            break;
        case 'evolucao':
          const cacheKey = `${JSON.stringify(filterPayload)}-${anoEvolucao}`;
          if (evolucaoCacheRef.current.has(cacheKey)) {
            const cached = evolucaoCacheRef.current.get(cacheKey)!;
            setEvolucaoMensal(cached.mensal);
            setEvolucaoSemanal(cached.semanal);
            setUtrSemanal(cached.utrSemanal);
            setLoadingEvolucao(false);
            return;
          }
          setLoadingEvolucao(true);
          try {
            // Carregar dados de evolução - usar apenas p_ano, não outros filtros
            const [mensalRes, semanalRes, utrSemanalRes] = await Promise.all([
              supabase.rpc('listar_evolucao_mensal', { p_ano: anoEvolucao } as any),
              supabase.rpc('listar_evolucao_semanal', { p_ano: anoEvolucao } as any),
              supabase.rpc('listar_utr_semanal', { p_ano: anoEvolucao } as any)
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
            
            const mensal = Array.isArray(mensalRes.data) ? mensalRes.data : [];
            const semanal = Array.isArray(semanalRes.data) ? semanalRes.data : [];
            const utr = Array.isArray(utrSemanalRes.data) ? utrSemanalRes.data : [];
            
            if (IS_DEV) {
              console.log('Evolução carregada:', { mensal: mensal.length, semanal: semanal.length, utr: utr.length });
            }
            
            evolucaoCacheRef.current.set(cacheKey, { mensal, semanal, utrSemanal: utr });
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
  }, [activeTab, filterPayload, anoEvolucao]);
  
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
