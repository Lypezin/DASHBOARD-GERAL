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
                // Usa a versão sobrecarregada de listar_todas_semanas com parâmetro de ano
                // Isso retorna diretamente os números das semanas que têm dados
                const { data, error } = await supabase
                    .rpc('listar_todas_semanas', { ano_param: ano });

                if (error) {
                    if (IS_DEV) safeLog.error('Erro ao buscar semanas com dados:', error);
                    setSemanas([]);
                    return;
                }

                if (data && Array.isArray(data) && data.length > 0) {
                    // A RPC já retorna {semana: number}[], extraímos os números
                    const semanasNumeros = data
                        .map((row: { semana: number }) => row.semana)
                        .filter((s): s is number => typeof s === 'number' && !isNaN(s));

                    // Ordena decrescente (semana mais recente primeiro)
                    semanasNumeros.sort((a, b) => b - a);
                    setSemanas(semanasNumeros);
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

