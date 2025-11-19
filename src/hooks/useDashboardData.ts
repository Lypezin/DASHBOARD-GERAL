import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Totals, AderenciaSemanal, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem,
  FilterOption, Filters, DashboardResumoData, EvolucaoMensal, EvolucaoSemanal, UtrSemanal
} from '@/types';
import { buildFilterPayload, safeNumber } from '@/utils/helpers';
import { converterHorasParaDecimal } from '@/utils/formatters';
import { useDashboardDimensions } from './useDashboardDimensions';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useDashboardData(initialFilters: Filters, activeTab: string, anoEvolucao: number, currentUser?: { is_admin: boolean; assigned_pracas: string[] } | null) {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [aderenciaSemanal, setAderenciaSemanal] = useState<AderenciaSemanal[]>([]);
  const [aderenciaDia, setAderenciaDia] = useState<AderenciaDia[]>([]);
  const [aderenciaTurno, setAderenciaTurno] = useState<AderenciaTurno[]>([]);
  const [aderenciaSubPraca, setAderenciaSubPraca] = useState<AderenciaSubPraca[]>([]);
  const [aderenciaOrigem, setAderenciaOrigem] = useState<AderenciaOrigem[]>([]);
  
  const { anosDisponiveis, semanasDisponiveis } = useDashboardDimensions();

  const [pracas, setPracas] = useState<FilterOption[]>([]);
  const [subPracas, setSubPracas] = useState<FilterOption[]>([]);
  const [origens, setOrigens] = useState<FilterOption[]>([]);
  const [turnos, setTurnos] = useState<FilterOption[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [evolucaoMensal, setEvolucaoMensal] = useState<EvolucaoMensal[]>([]);
  const [evolucaoSemanal, setEvolucaoSemanal] = useState<EvolucaoSemanal[]>([]);
  const [utrSemanal, setUtrSemanal] = useState<UtrSemanal[]>([]);
  const [loadingEvolucao, setLoadingEvolucao] = useState(false);

  const cacheKeyRef = useRef<string>('');
  const cachedDataRef = useRef<DashboardResumoData | null>(null);
  const evolucaoCacheRef = useRef<Map<string, { mensal: EvolucaoMensal[]; semanal: EvolucaoSemanal[]; utrSemanal: UtrSemanal[]; timestamp: number }>>(new Map());
  const dashboardDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const filterPayload = useMemo(() => {
    return buildFilterPayload(initialFilters, currentUser);
  }, [initialFilters, currentUser]);

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
        const { data, error } = await safeRpc<DashboardResumoData>('dashboard_resumo', filterPayload, {
          timeout: 30000,
          validateParams: true
        });
        
        if (error) {
          const errorCode = (error as any)?.code || '';
          const errorMessage = String((error as any)?.message || '');
          
          // Verificar se é erro de cliente mock (placeholder)
          if (errorMessage.includes('placeholder.supabase.co') || 
              errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
              errorCode === 'ENOTFOUND') {
            safeLog.error(
              '[useDashboardData] ⚠️ Cliente Supabase está usando mock! ' +
              'Variáveis de ambiente não estão disponíveis. ' +
              'Verifique se NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão configuradas no Vercel ' +
              'e faça um NOVO BUILD (não apenas redeploy).'
            );
            setError(
              'Variáveis de ambiente do Supabase não estão configuradas. ' +
              'Após configurar no Vercel, faça um novo build.'
            );
            return;
          }
          
          safeLog.error('Erro ao carregar dashboard_resumo:', error);
          throw error;
        }
        
        if (!data) {
          safeLog.warn('dashboard_resumo retornou null');
          setError('Não foi possível carregar os dados do dashboard.');
          return;
        }

        cachedDataRef.current = data;
        cacheKeyRef.current = payloadKey;

        // Atualizar estados de forma otimizada
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

          if (currentUser && !currentUser.is_admin && currentUser.assigned_pracas.length > 0) {
            const pracasPermitidas = new Set(currentUser.assigned_pracas);
            pracasDisponiveis = pracasDisponiveis.filter((p) => pracasPermitidas.has(p.value));
          }

          setPracas(pracasDisponiveis);
          
          // Filtrar dimensões (sub-praças, turnos, origens) baseado nas praças permitidas do usuário
          // Se o usuário não é admin e tem praças atribuídas, buscar dimensões APENAS do banco
          if (currentUser && !currentUser.is_admin && currentUser.assigned_pracas.length > 0) {
            // Buscar todas as dimensões em paralelo para melhor performance
            try {
              const [subPracasResult, turnosResult, origensResult] = await Promise.all([
                safeRpc<Array<{ sub_praca: string }>>('get_subpracas_by_praca', { p_pracas: currentUser.assigned_pracas }, {
                  timeout: 10000,
                  validateParams: false
                }),
                safeRpc<Array<{ turno: string }>>('get_turnos_by_praca', { p_pracas: currentUser.assigned_pracas }, {
                  timeout: 10000,
                  validateParams: false
                }),
                safeRpc<Array<{ origem: string }>>('get_origens_by_praca', { p_pracas: currentUser.assigned_pracas }, {
                  timeout: 10000,
                  validateParams: false
                })
              ]);
              
              // Processar sub-praças
              let subPracasDisponiveis: FilterOption[] = [];
              if (!subPracasResult.error && subPracasResult.data && Array.isArray(subPracasResult.data)) {
                subPracasDisponiveis = subPracasResult.data.map((item: { sub_praca: string }) => ({
                  value: String(item.sub_praca),
                  label: String(item.sub_praca)
                }));
              } else {
                // Fallback: filtrar por nome
                if (IS_DEV) {
                  safeLog.warn('Erro ao buscar sub-praças do banco, usando fallback:', subPracasResult.error);
                }
                const subPracasDoDashboard = Array.isArray(data.dimensoes.sub_pracas) ? data.dimensoes.sub_pracas.map((p: any) => ({ value: String(p), label: String(p) })) : [];
                subPracasDisponiveis = subPracasDoDashboard.filter((sp) => {
                  const subPracaValue = sp.value.toUpperCase();
                  return currentUser.assigned_pracas.some((praca) => {
                    const pracaValue = praca.toUpperCase();
                    return subPracaValue.includes(pracaValue) || subPracaValue.startsWith(pracaValue);
                  });
                });
              }
              setSubPracas(subPracasDisponiveis);
              
              // Processar turnos
              let turnosDisponiveis: FilterOption[] = [];
              if (!turnosResult.error && turnosResult.data && Array.isArray(turnosResult.data)) {
                turnosDisponiveis = turnosResult.data.map((item: { turno: string }) => ({
                  value: String(item.turno),
                  label: String(item.turno)
                }));
              } else {
                // Fallback: usar do dashboard
                if (IS_DEV) {
                  safeLog.warn('Erro ao buscar turnos do banco, usando fallback:', turnosResult.error);
                }
                turnosDisponiveis = Array.isArray((data.dimensoes as any).turnos) ? (data.dimensoes as any).turnos.map((t: any) => ({ value: String(t), label: String(t) })) : [];
              }
              setTurnos(turnosDisponiveis);
              
              // Processar origens
              let origensDisponiveis: FilterOption[] = [];
              if (!origensResult.error && origensResult.data && Array.isArray(origensResult.data)) {
                origensDisponiveis = origensResult.data.map((item: { origem: string }) => ({
                  value: String(item.origem),
                  label: String(item.origem)
                }));
              } else {
                // Fallback: usar do dashboard
                if (IS_DEV) {
                  safeLog.warn('Erro ao buscar origens do banco, usando fallback:', origensResult.error);
                }
                origensDisponiveis = Array.isArray(data.dimensoes.origens) ? data.dimensoes.origens.map((p: any) => ({ value: String(p), label: String(p) })) : [];
              }
              setOrigens(origensDisponiveis);
              
            } catch (err) {
              // Em caso de erro geral, usar fallback para todas as dimensões
              if (IS_DEV) {
                safeLog.warn('Erro ao buscar dimensões do banco, usando fallback:', err);
              }
              const subPracasDoDashboard = Array.isArray(data.dimensoes.sub_pracas) ? data.dimensoes.sub_pracas.map((p: any) => ({ value: String(p), label: String(p) })) : [];
              const subPracasFiltradas = subPracasDoDashboard.filter((sp) => {
                const subPracaValue = sp.value.toUpperCase();
                return currentUser.assigned_pracas.some((praca) => {
                  const pracaValue = praca.toUpperCase();
                  return subPracaValue.includes(pracaValue) || subPracaValue.startsWith(pracaValue);
                });
              });
              setSubPracas(subPracasFiltradas);
              setTurnos(Array.isArray((data.dimensoes as any).turnos) ? (data.dimensoes as any).turnos.map((t: any) => ({ value: String(t), label: String(t) })) : []);
              setOrigens(Array.isArray(data.dimensoes.origens) ? data.dimensoes.origens.map((p: any) => ({ value: String(p), label: String(p) })) : []);
            }
          } else {
            // Se for admin ou não tiver restrições, usar todas as dimensões do dashboard_resumo
            setSubPracas(Array.isArray(data.dimensoes.sub_pracas) ? data.dimensoes.sub_pracas.map((p: any) => ({ value: String(p), label: String(p) })) : []);
            setTurnos(Array.isArray((data.dimensoes as any).turnos) ? (data.dimensoes as any).turnos.map((t: any) => ({ value: String(t), label: String(t) })) : []);
            setOrigens(Array.isArray(data.dimensoes.origens) ? data.dimensoes.origens.map((p: any) => ({ value: String(p), label: String(p) })) : []);
          }
        }
      } catch (err: any) {
        safeLog.error('Erro ao carregar dashboard_resumo:', err);
        const errorMessage = err?.message || err?.code || 'Não foi possível carregar os dados do dashboard.';
        setError(errorMessage);
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
    }, 100); // Reduzido de 150ms para 100ms para melhor responsividade

    return () => {
      if (dashboardDebounceRef.current) clearTimeout(dashboardDebounceRef.current);
    };
  }, [filterPayload, currentUser]);

  // Lógica de busca para a aba 'evolucao' (mantida aqui por enquanto)
  const evolucaoAbortControllerRef = useRef<AbortController | null>(null);
  const currentEvolucaoTabRef = useRef<string>(activeTab);
  
  useEffect(() => {
    currentEvolucaoTabRef.current = activeTab;
  }, [activeTab]);
  
  useEffect(() => {
    const fetchEvolucaoData = async () => {
      // Cancelar requisição anterior se existir
      if (evolucaoAbortControllerRef.current) {
        evolucaoAbortControllerRef.current.abort();
      }

      // Criar novo AbortController para esta requisição
      const abortController = new AbortController();
      evolucaoAbortControllerRef.current = abortController;
      
      // Verificar se ainda estamos na tab de evolução
      if (currentEvolucaoTabRef.current !== 'evolucao') {
        return;
      }
      
      const pracaFilter = (filterPayload as any).p_praca;
      const evolucaoCacheKey = `evolucao-${anoEvolucao}-${pracaFilter || 'all'}`;
      const cached = evolucaoCacheRef.current.get(evolucaoCacheKey);

      if (cached && Date.now() - cached.timestamp < 30000) {
        // Verificar se ainda estamos na tab de evolução antes de atualizar
        if (currentEvolucaoTabRef.current === 'evolucao' && !abortController.signal.aborted) {
          setEvolucaoMensal(cached.mensal);
          setEvolucaoSemanal(cached.semanal);
          setUtrSemanal(cached.utrSemanal);
          setLoadingEvolucao(false);
        }
        return;
      }
      
      // Verificar novamente antes de fazer requisição
      if (currentEvolucaoTabRef.current !== 'evolucao' || abortController.signal.aborted) {
        return;
      }
      
      setLoadingEvolucao(true);
      try {
        const [mensalRes, semanalRes] = await Promise.all([
          safeRpc<EvolucaoMensal[]>('listar_evolucao_mensal', { p_praca: pracaFilter, p_ano: anoEvolucao }, {
            timeout: 20000, // Reduzido para 20s
            validateParams: false // Desabilitar validação para evitar problemas
          }),
          safeRpc<EvolucaoSemanal[]>('listar_evolucao_semanal', { p_praca: pracaFilter || null, p_ano: anoEvolucao, p_limite_semanas: 60 }, {
            timeout: 20000, // Reduzido para 20s
            validateParams: false // Desabilitar validação para evitar problemas
          })
        ]);

        // Verificar se foi abortado durante a requisição
        if (abortController.signal.aborted || currentEvolucaoTabRef.current !== 'evolucao') {
          return;
        }

        // Tratar erros silenciosamente
        if (mensalRes.error) {
          const errorCode = (mensalRes.error as any)?.code || '';
          const errorMessage = String((mensalRes.error as any)?.message || '');
          const is500 = errorCode === 'PGRST301' || errorMessage.includes('500');
          if (is500 && IS_DEV) {
            safeLog.warn('Erro 500 ao carregar evolução mensal (ignorado):', mensalRes.error);
          } else if (!is500) {
            safeLog.error('Erro ao carregar evolução mensal:', mensalRes.error);
          }
        }
        
        if (semanalRes.error) {
          const errorCode = (semanalRes.error as any)?.code || '';
          const errorMessage = String((semanalRes.error as any)?.message || '');
          const is500 = errorCode === 'PGRST301' || errorMessage.includes('500');
          if (is500 && IS_DEV) {
            safeLog.warn('Erro 500 ao carregar evolução semanal (ignorado):', semanalRes.error);
          } else if (!is500) {
            safeLog.error('Erro ao carregar evolução semanal:', semanalRes.error);
          }
        }

        const mensal = mensalRes.data || [];
        const semanal = semanalRes.data || [];
        
        // Verificar se ainda estamos na tab de evolução antes de atualizar
        if (currentEvolucaoTabRef.current === 'evolucao' && !abortController.signal.aborted) {
          evolucaoCacheRef.current.set(evolucaoCacheKey, { mensal, semanal, utrSemanal: [], timestamp: Date.now() });
          setEvolucaoMensal(mensal);
          setEvolucaoSemanal(semanal);
          setUtrSemanal([]); // UTR desabilitado por ora
        }

      } catch (err) {
        // Ignorar erros de abort
        if ((err as any)?.name === 'AbortError' || abortController.signal.aborted) {
          return;
        }
        
        // Verificar se ainda estamos na tab de evolução antes de atualizar
        if (currentEvolucaoTabRef.current === 'evolucao') {
          safeLog.error('Erro ao carregar evolução:', err);
          setEvolucaoMensal([]);
          setEvolucaoSemanal([]);
          setUtrSemanal([]);
        }
      } finally {
        // Só atualizar loading se ainda estamos na tab de evolução
        if (currentEvolucaoTabRef.current === 'evolucao') {
          setLoadingEvolucao(false);
        }
      }
    };

    if (activeTab === 'evolucao') {
      // Adicionar pequeno delay para evitar requisições muito rápidas
      const timeoutId = setTimeout(() => {
        // Verificar novamente se ainda estamos na tab de evolução antes de fazer requisição
        if (currentEvolucaoTabRef.current === 'evolucao') {
          fetchEvolucaoData();
        }
      }, 300);
      
      return () => {
        clearTimeout(timeoutId);
        // Cancelar requisição se o componente desmontar ou tab mudar
        if (evolucaoAbortControllerRef.current) {
          evolucaoAbortControllerRef.current.abort();
          evolucaoAbortControllerRef.current = null;
        }
      };
    } else {
      // Se não é a tab de evolução, cancelar qualquer requisição pendente e limpar dados
      if (evolucaoAbortControllerRef.current) {
        evolucaoAbortControllerRef.current.abort();
        evolucaoAbortControllerRef.current = null;
      }
      setEvolucaoMensal([]);
      setEvolucaoSemanal([]);
      setUtrSemanal([]);
      setLoadingEvolucao(false);
    }
  }, [activeTab, anoEvolucao, filterPayload]);
  
  const aderenciaGeral = useMemo(() => {
    if (aderenciaSemanal.length === 0) return undefined;
    if (aderenciaSemanal.length === 1) return aderenciaSemanal[0];
    
    const { totalHorasAEntregar, totalHorasEntregues } = aderenciaSemanal.reduce(
      (acc, semana) => ({
        totalHorasAEntregar: acc.totalHorasAEntregar + converterHorasParaDecimal(semana.horas_a_entregar || '0'),
        totalHorasEntregues: acc.totalHorasEntregues + converterHorasParaDecimal(semana.horas_entregues || '0')
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
    evolucaoMensal, evolucaoSemanal, utrSemanal, loadingEvolucao,
    aderenciaGeral
  };
}
