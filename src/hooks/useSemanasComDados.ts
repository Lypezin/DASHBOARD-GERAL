import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Hook que busca as semanas que possuem dados para um ano específico
 * Evita mostrar semanas sem dados no filtro
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
                // Busca semanas distintas que possuem dados na tabela dados_consolidados
                const { data, error } = await supabase
                    .from('dados_consolidados')
                    .select('semana_iso')
                    .eq('ano_iso', ano)
                    .not('semana_iso', 'is', null);

                if (error) {
                    if (IS_DEV) safeLog.error('Erro ao buscar semanas com dados:', error);
                    setSemanas([]);
                    return;
                }

                if (data && data.length > 0) {
                    // Extrai semanas únicas e ordena
                    const semanasUnicas = [...new Set(
                        data
                            .map(row => row.semana_iso)
                            .filter((s): s is number => typeof s === 'number' && !isNaN(s))
                    )].sort((a, b) => b - a); // Ordem decrescente (mais recente primeiro)

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
