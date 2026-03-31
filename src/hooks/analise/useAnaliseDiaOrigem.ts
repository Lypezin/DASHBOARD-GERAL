/**
 * Hook dedicado para buscar dados de Dia x Origem diretamente da view `mv_dashboard_resumo`.
 * Não depende da função RPC `dashboard_resumo` para funcionar.
 */
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import type { FilterPayload } from '@/types/filters';
import type { AderenciaDiaOrigem } from '@/types';

const DIAS_SEMANA_ORDEM = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const DIA_ISO_MAP: Record<string, number> = {
    'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4,
    'Sexta': 5, 'Sábado': 6, 'Domingo': 7
};

interface MvRow {
    dia_da_semana: string;
    dia_iso: number;
    origem: string;
    segundos_planejados: number;
    segundos_realizados: number;
    corridas_ofertadas: number;
    corridas_aceitas: number;
    corridas_rejeitadas: number;
    corridas_completadas: number;
}

export function useAnaliseDiaOrigem({
    filterPayload,
    enabled = true,
}: {
    filterPayload: FilterPayload;
    enabled?: boolean;
}) {
    const [data, setData] = useState<AderenciaDiaOrigem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const filterKey = useMemo(() => JSON.stringify(filterPayload), [filterPayload]);

    useEffect(() => {
        if (!enabled) return;

        const { p_organization_id, p_ano, p_semana, p_semanas, p_praca, p_sub_praca, p_sub_pracas,
            p_origem, p_origens, p_turno, p_turnos, p_filtro_modo, p_data_inicial, p_data_final } = filterPayload;

        // Deve ter ao menos um filtro de tempo para evitar trazer tudo
        const hasTimeFilter = p_ano != null || p_data_inicial != null;
        if (!hasTimeFilter) return;

        let mounted = true;
        const controller = new AbortController();

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                let query = supabase
                    .from('mv_dashboard_resumo')
                    .select('data_do_periodo, origem, segundos_planejados, segundos_realizados, total_ofertadas, total_aceitas, total_rejeitadas, total_completadas');

                // Filtros de organização
                if (p_organization_id) query = query.eq('organization_id', p_organization_id);

                // Filtros de tempo
                if ((p_filtro_modo === 'data' || p_filtro_modo === 'intervalo') && p_data_inicial && p_data_final) {
                    query = query.gte('data_do_periodo', p_data_inicial).lte('data_do_periodo', p_data_final);
                } else {
                    if (p_ano != null) query = query.eq('ano_iso', p_ano);
                    if (p_semana != null) query = query.eq('semana_iso', p_semana);
                    if (p_semanas && p_semanas.length > 0) query = query.in('semana_iso', p_semanas);
                }

                // Filtros dimensionais
                if (p_praca) query = query.eq('praca', p_praca);
                if (p_sub_praca) query = query.eq('sub_praca', p_sub_praca);
                if (p_sub_pracas && p_sub_pracas.length > 0) query = query.in('sub_praca', p_sub_pracas);
                if (p_origem) query = query.eq('origem', p_origem);
                if (p_origens && p_origens.length > 0) query = query.in('origem', p_origens);
                if (p_turno) query = query.eq('turno', p_turno);
                if (p_turnos && p_turnos.length > 0) query = query.in('turno', p_turnos);

                const { data: rows, error: dbError } = await query;

                if (!mounted) return;

                if (dbError) {
                    safeLog.error('[useAnaliseDiaOrigem] Erro:', dbError);
                    setError(dbError.message);
                    return;
                }

                if (!rows || rows.length === 0) {
                    setData([]);
                    return;
                }

                // Agrupar por dia_da_semana + origem e somar os segundos
                const grouped = new Map<string, any>();
                const diasSemanaNomes = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

                (rows as any[]).forEach(row => {
                    // Derivar dia da semana da data_do_periodo
                    const dataObj = new Date(row.data_do_periodo + 'T12:00:00'); // Meio dia para evitar timezone issues
                    const diaNome = diasSemanaNomes[dataObj.getDay()] || 'N/D';
                    const diaIso = dataObj.getDay() === 0 ? 7 : dataObj.getDay();
                    
                    const origem = row.origem || 'N/D';
                    const key = `${diaNome}||${origem}`;

                    if (grouped.has(key)) {
                        const existing = grouped.get(key)!;
                        existing.segundos_planejados += Number(row.segundos_planejados || 0);
                        existing.segundos_realizados += Number(row.segundos_realizados || 0);
                        existing.corridas_ofertadas += Number(row.total_ofertadas || 0);
                        existing.corridas_aceitas += Number(row.total_aceitas || 0);
                        existing.corridas_rejeitadas += Number(row.total_rejeitadas || 0);
                        existing.corridas_completadas += Number(row.total_completadas || 0);
                    } else {
                        grouped.set(key, {
                            dia: diaNome,
                            dia_iso: diaIso,
                            origem,
                            segundos_planejados: Number(row.segundos_planejados || 0),
                            segundos_realizados: Number(row.segundos_realizados || 0),
                            corridas_ofertadas: Number(row.total_ofertadas || 0),
                            corridas_aceitas: Number(row.total_aceitas || 0),
                            corridas_rejeitadas: Number(row.total_rejeitadas || 0),
                            corridas_completadas: Number(row.total_completadas || 0),
                        });
                    }
                });

                // Converter para o formato AderenciaDiaOrigem e ordenar
                const result: AderenciaDiaOrigem[] = Array.from(grouped.values())
                    .map(row => ({
                        ...row,
                        aderencia_percentual: row.segundos_planejados > 0
                            ? (row.segundos_realizados / row.segundos_planejados) * 100
                            : 0,
                    }))
                    .sort((a, b) => {
                        const orderA = a.dia_iso;
                        const orderB = b.dia_iso;
                        if (orderA !== orderB) return orderA - orderB;
                        return a.origem.localeCompare(b.origem);
                    });

                if (process.env.NODE_ENV === 'development') {
                    safeLog.info(`[useAnaliseDiaOrigem] ${result.length} registros - sample:`, result[0]);
                }

                setData(result);
            } catch (err) {
                if (mounted) {
                    safeLog.error('[useAnaliseDiaOrigem] Erro inesperado:', err);
                    setError('Erro ao carregar dados de Dia x Origem');
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchData();

        return () => {
            mounted = false;
            controller.abort();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterKey, enabled]);

    return { data, loading, error };
}
