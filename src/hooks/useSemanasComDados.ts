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
                // Busca semanas distintas que possuem dados na tabela dados_corridas
                // Usando data_do_periodo para extrair ano e semana ISO
                const { data, error } = await supabase
                    .from('dados_corridas')
                    .select('data_do_periodo')
                    .not('data_do_periodo', 'is', null);

                if (error) {
                    if (IS_DEV) safeLog.error('Erro ao buscar semanas com dados:', error);
                    setSemanas([]);
                    return;
                }

                if (data && data.length > 0) {
                    // Extrai ano e semana ISO a partir de data_do_periodo
                    const semanasDoAno = data
                        .map(row => {
                            if (!row.data_do_periodo) return null;
                            const date = new Date(row.data_do_periodo);
                            const dateYear = date.getFullYear();
                            // Só inclui se for do ano selecionado
                            if (dateYear !== ano) return null;
                            // Calcula semana ISO
                            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                            const dayNum = d.getUTCDay() || 7;
                            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
                            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                            const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
                            return weekNo;
                        })
                        .filter((s): s is number => typeof s === 'number' && !isNaN(s));

                    // Extrai semanas únicas e ordena (decrescente)
                    const semanasUnicas = [...new Set(semanasDoAno)].sort((a, b) => b - a);
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
