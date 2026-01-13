import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Hook que busca as semanas que possuem dados para um ano específico
 * Evita mostrar semanas sem dados no filtro
 * Usa a mesma fonte de dados que listar_todas_semanas() (mv_dashboard_resumo)
 */
export function useSemanasComDados(ano: number | null) {
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
                // Busca diretamente da view materializada mv_dashboard_resumo
                // que é a mesma fonte usada por listar_todas_semanas()
                // Filtra por ano_iso para pegar só semanas do ano selecionado
                const { data, error } = await supabase
                    .from('mv_dashboard_resumo')
                    .select('semana_iso, ano_iso')
                    .eq('ano_iso', ano)
                    .not('semana_iso', 'is', null)
                    .order('semana_iso', { ascending: false });

                if (error) {
                    if (IS_DEV) safeLog.error('Erro ao buscar semanas com dados:', error);
                    setSemanas([]);
                    return;
                }

                if (data && Array.isArray(data) && data.length > 0) {
                    // Extrai semanas únicas
                    const semanasUnicas = [...new Set(
                        data
                            .map((row: { semana_iso: number }) => row.semana_iso)
                            .filter((s): s is number => typeof s === 'number' && !isNaN(s))
                    )];

                    // Ordena decrescente (semana mais recente primeiro)
                    semanasUnicas.sort((a, b) => b - a);
                    setSemanas(semanasUnicas);
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
    }, [ano]);

    return { semanasComDados: semanas, loadingSemanasComDados: loading };
}
