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
        setData(cached.data);
        setLoading(false);
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
            if (result && result.data) {
                const entregadores = Array.isArray(result.data) ? result.data : (result.data.entregadores || []);
                processedData = { entregadores, total: entregadores.length };
            }
            break;

          case 'valores':
            const { p_ano: v_ano, p_semana: v_semana, p_praca: v_praca, p_sub_praca: v_sub_praca, p_origem: v_origem } = filterPayload as any;
            const listarValoresPayload = { p_ano: v_ano, p_semana: v_semana, p_praca: v_praca, p_sub_praca: v_sub_praca, p_origem: v_origem };
            result = await supabase.rpc('listar_valores_entregadores', listarValoresPayload);
            if (result && result.data) {
                processedData = Array.isArray(result.data) ? result.data : (result.data.valores || []);
            }
            break;
        }

        if (result && result.error) {
          throw result.error;
        }

        setData(processedData);
        cacheRef.current.set(cacheKey, { data: processedData, timestamp: Date.now() });

      } catch (err: any) {
        safeLog.error(`Erro ao carregar dados para a aba ${tab}:`, err);
        setData(null);
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
