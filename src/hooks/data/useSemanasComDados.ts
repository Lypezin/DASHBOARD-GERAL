import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

import { useOrganization } from '@/contexts/OrganizationContext';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Hook que busca as semanas que possuem dados para um ano específico
 * Evita mostrar semanas sem dados no filtro
 * Usa a mesma fonte de dados que listar_todas_semanas() (mv_dashboard_resumo)
 */
export function useSemanasComDados(ano: number | null) {
    const { organization } = useOrganization();
    const [semanas, setSemanas] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!ano) {
            setSemanas([]);
            return;
        }

        const fetchSemanasComDados = async () => {
            setLoading(true);
            try {
                // Usa RPC otimizado que já retorna apenas as semanas distintas e ordenadas
                // Evita trafegar dados desnecessários de toda a view
                const { data, error } = await supabase
                    .rpc('get_available_weeks', {
                        p_ano_iso: ano,
                        p_organization_id: organization?.id
                    });

                if (error) {
                    if (IS_DEV) safeLog.error('Erro ao buscar semanas com dados:', error);
                    setSemanas([]);
                    return;
                }

                if (data && Array.isArray(data) && data.length > 0) {
                    // O RPC já retorna [{ semana_iso: 52 }, ...] ordenado
                    const semanasOtimizadas = data.map((d: { semana_iso: number }) => d.semana_iso);
                    setSemanas(semanasOtimizadas);
                } else {
                    setSemanas([]);
                }
            } catch (err) {
                if (IS_DEV) safeLog.error('Erro ao buscar semanas com dados:', err);
                setSemanas([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSemanasComDados();
    }, [ano, organization?.id]);

    return { semanasComDados: semanas, loadingSemanasComDados: loading };
}
