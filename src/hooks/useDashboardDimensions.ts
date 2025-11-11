import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useDashboardDimensions() {
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [semanasDisponiveis, setSemanasDisponiveis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialDimensions = async () => {
      setLoading(true);
      try {
        const [anosResult, semanasResult] = await Promise.all([
          supabase.rpc('listar_anos_disponiveis'),
          supabase.rpc('listar_todas_semanas')
        ]);

        if (anosResult.error) throw anosResult.error;
        setAnosDisponiveis(anosResult.data || []);

        if (semanasResult.error) throw semanasResult.error;
        setSemanasDisponiveis(Array.isArray(semanasResult.data) ? semanasResult.data.map(s => String(s)) : []);

      } catch (err) {
        safeLog.error('Erro ao buscar dimensões iniciais:', err);
        setAnosDisponiveis([new Date().getFullYear()]);
        setSemanasDisponiveis([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialDimensions();
  }, []);

  return { anosDisponiveis, semanasDisponiveis, loadingDimensions: loading };
}
