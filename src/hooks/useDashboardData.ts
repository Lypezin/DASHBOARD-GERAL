import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Totals, AderenciaSemanal, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem,
  FilterOption, Filters, DashboardResumoData, EvolucaoMensal, EvolucaoSemanal, UtrSemanal
} from '@/types';
import { buildFilterPayload, safeNumber } from '@/utils/helpers';
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
          safeLog.error('Erro ao carregar dashboard_resumo:', error);
          throw error;
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
          setSubPracas(Array.isArray(data.dimensoes.sub_pracas) ? data.dimensoes.sub_pracas.map((p: any) => ({ value: String(p), label: String(p) })) : []);
          setOrigens(Array.isArray(data.dimensoes.origens) ? data.dimensoes.origens.map((p: any) => ({ value: String(p), label: String(p) })) : []);
          if (Array.isArray((data.dimensoes as any).turnos)) {
            setTurnos((data.dimensoes as any).turnos.map((t: any) => ({ value: String(t), label: String(t) })));
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
  useEffect(() => {
    const fetchEvolucaoData = async () => {
      const pracaFilter = (filterPayload as any).p_praca;
      const evolucaoCacheKey = `evolucao-${anoEvolucao}-${pracaFilter || 'all'}`;
      const cached = evolucaoCacheRef.current.get(evolucaoCacheKey);

      if (cached && Date.now() - cached.timestamp < 30000) {
        setEvolucaoMensal(cached.mensal);
        setEvolucaoSemanal(cached.semanal);
        setUtrSemanal(cached.utrSemanal);
        setLoadingEvolucao(false);
        return;
      }
      
      setLoadingEvolucao(true);
      try {
        const [mensalRes, semanalRes] = await Promise.all([
          safeRpc<EvolucaoMensal[]>('listar_evolucao_mensal', { p_praca: pracaFilter, p_ano: anoEvolucao }, {
            timeout: 30000,
            validateParams: true
          }),
          safeRpc<EvolucaoSemanal[]>('listar_evolucao_semanal', { p_praca: pracaFilter || null, p_ano: anoEvolucao, p_limite_semanas: 60 }, {
            timeout: 30000,
            validateParams: true
          })
        ]);

        if (mensalRes.error) safeLog.error('Erro ao carregar evolução mensal:', mensalRes.error);
        if (semanalRes.error) safeLog.error('Erro ao carregar evolução semanal:', semanalRes.error);

        const mensal = mensalRes.data || [];
        const semanal = semanalRes.data || [];
        
        evolucaoCacheRef.current.set(evolucaoCacheKey, { mensal, semanal, utrSemanal: [], timestamp: Date.now() });
        setEvolucaoMensal(mensal);
        setEvolucaoSemanal(semanal);
        setUtrSemanal([]); // UTR desabilitado por ora

      } catch (err) {
        safeLog.error('Erro ao carregar evolução:', err);
        setEvolucaoMensal([]);
        setEvolucaoSemanal([]);
        setUtrSemanal([]);
      } finally {
        setLoadingEvolucao(false);
      }
    };

    if (activeTab === 'evolucao') {
      fetchEvolucaoData();
    }
  }, [activeTab, anoEvolucao, filterPayload]);
  
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
    evolucaoMensal, evolucaoSemanal, utrSemanal, loadingEvolucao,
    aderenciaGeral
  };
}
