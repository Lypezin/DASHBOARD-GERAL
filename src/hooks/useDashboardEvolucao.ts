import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { DELAYS } from '@/constants/config';
import type { FilterPayload } from '@/types/filters';

interface UseDashboardEvolucaoOptions {
  filterPayload: FilterPayload;
  anoEvolucao: number;
  activeTab: string;
}

export function useDashboardEvolucao({ filterPayload, anoEvolucao, activeTab }: UseDashboardEvolucaoOptions) {
  const [evolucaoMensal, setEvolucaoMensal] = useState<any>(null);
  const [evolucaoSemanal, setEvolucaoSemanal] = useState<any>(null);
  const [utrSemanal, setUtrSemanal] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Só buscar se a tab ativa precisar desses dados
    const needsEvolucao = activeTab === 'evolucao' || activeTab === 'dashboard' || activeTab === 'utr';

    if (!needsEvolucao) return;

    // Se ano não definido, não buscar
    if (!anoEvolucao) return;

    let mounted = true;

    const fetchEvolucao = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          p_ano: anoEvolucao,
          p_organization_id: filterPayload.p_organization_id,
          p_praca: filterPayload.p_praca,
          p_sub_praca: filterPayload.p_sub_praca,
          p_origem: filterPayload.p_origem,
          p_turno: filterPayload.p_turno,
          // Arrays
          p_sub_pracas: filterPayload.p_sub_pracas,
          p_origens: filterPayload.p_origens,
          p_turnos: filterPayload.p_turnos,
        };

        if (process.env.NODE_ENV === 'development') {
          safeLog.info('[useDashboardEvolucao] Buscando dados de evolução:', params);
        }

        const [mensalRes, semanalRes, utrRes] = await Promise.all([
          supabase.rpc('dashboard_evolucao_mensal', params),
          supabase.rpc('dashboard_evolucao_semanal', params),
          supabase.rpc('dashboard_utr_semanal', params)
        ]);

        if (!mounted) return;

        if (mensalRes.error) throw mensalRes.error;
        if (semanalRes.error) throw semanalRes.error;
        if (utrRes.error && activeTab === 'utr') throw utrRes.error; // UTR might be optional for other tabs

        setEvolucaoMensal(mensalRes.data);
        setEvolucaoSemanal(semanalRes.data);
        setUtrSemanal(utrRes.data);

      } catch (err: any) {
        if (mounted) {
          safeLog.error('[useDashboardEvolucao] Erro ao buscar evolução:', err);
          setError(err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchEvolucao, DELAYS.DEBOUNCE);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [
    activeTab,
    anoEvolucao,
    // Dependências de filtro (usar JSON.stringify se payload mudar referência)
    JSON.stringify(filterPayload)
  ]);

  return {
    evolucaoMensal,
    evolucaoSemanal,
    utrSemanal,
    loading,
    error
  };
}
