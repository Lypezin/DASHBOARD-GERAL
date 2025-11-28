import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { ensureDateFilter, validateDateFilter } from '@/utils/queryOptimization';
import { UtrData, UtrGeral, UtrPorPraca } from '@/types';
import { QUERY_LIMITS } from '@/constants/config';
import type { FilterPayload } from '@/types/filters';

/**
 * Fallback: Busca dados de UTR diretamente da tabela dados_corridas
 */
export async function fetchUtrFallback(payload: FilterPayload): Promise<UtrData | null> {
    try {
        validateDateFilter(payload, 'fetchUtrFallback');
        const safePayload = ensureDateFilter(payload);

        let query = supabase
            .from('dados_corridas')
            .select('tempo_disponivel_escalado, numero_de_corridas_aceitas, praca, sub_praca, origem, periodo');

        if (safePayload.p_semana && safePayload.p_ano) {
            const dataInicio = new Date(safePayload.p_ano, 0, 1);
            const diaSemana = dataInicio.getDay();
            const diasParaSegunda = (diaSemana === 0 ? -6 : 1) - diaSemana;
            const primeiraSegunda = new Date(dataInicio);
            primeiraSegunda.setDate(primeiraSegunda.getDate() + diasParaSegunda);
            const semanaInicio = new Date(primeiraSegunda);
            semanaInicio.setDate(semanaInicio.getDate() + (safePayload.p_semana - 1) * 7);
            const semanaFim = new Date(semanaInicio);
            semanaFim.setDate(semanaFim.getDate() + 6);

            query = query.gte('data_do_periodo', semanaInicio.toISOString().split('T')[0])
                .lte('data_do_periodo', semanaFim.toISOString().split('T')[0]);
        } else if (payload.p_ano) {
            const anoInicio = `${payload.p_ano}-01-01`;
            const anoFim = `${payload.p_ano}-12-31`;
            query = query.gte('data_do_periodo', anoInicio).lte('data_do_periodo', anoFim);
        }

        if (payload.p_data_inicial) {
            query = query.gte('data_do_periodo', payload.p_data_inicial);
        }

        if (payload.p_data_final) {
            query = query.lte('data_do_periodo', payload.p_data_final);
        }

        if (payload.p_praca) {
            const pracas = Array.isArray(payload.p_praca)
                ? payload.p_praca.map((p) => String(p).trim())
                : payload.p_praca.split(',').map((p: string) => p.trim());
            if (pracas.length === 1) {
                query = query.eq('praca', pracas[0]);
            } else {
                query = query.in('praca', pracas);
            }
        }

        if (payload.p_sub_praca) {
            const subPracas = Array.isArray(payload.p_sub_praca)
                ? payload.p_sub_praca.map((p) => String(p).trim())
                : payload.p_sub_praca.split(',').map((p: string) => p.trim());
            if (subPracas.length === 1) {
                query = query.eq('sub_praca', subPracas[0]);
            } else {
                query = query.in('sub_praca', subPracas);
            }
        }

        if (payload.p_origem) {
            const origens = Array.isArray(payload.p_origem)
                ? payload.p_origem.map((o) => String(o).trim())
                : payload.p_origem.split(',').map((o: string) => o.trim());
            if (origens.length === 1) {
                query = query.eq('origem', origens[0]);
            } else {
                query = query.in('origem', origens);
            }
        }

        query = query.limit(QUERY_LIMITS.AGGREGATION_MAX);

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            return {
                geral: { tempo_horas: 0, corridas: 0, utr: 0 },
                praca: [],
                sub_praca: [],
                origem: [],
                turno: []
            };
        }

        let totalTempoSegundos = 0;
        let totalCorridas = 0;

        for (const row of data) {
            const tempoStr = row.tempo_disponivel_escalado || '0:00:00';
            const [hours, minutes, seconds] = tempoStr.split(':').map(Number);
            totalTempoSegundos += (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
            totalCorridas += Number(row.numero_de_corridas_aceitas) || 0;
        }

        const tempoHoras = totalTempoSegundos / 3600;
        const utrGeral: UtrGeral = {
            tempo_horas: tempoHoras,
            corridas: totalCorridas,
            utr: tempoHoras > 0 ? totalCorridas / tempoHoras : 0
        };

        const pracaMap = new Map<string, { tempo: number; corridas: number }>();
        for (const row of data) {
            const praca = row.praca || 'Não especificada';
            const tempoStr = row.tempo_disponivel_escalado || '0:00:00';
            const [hours, minutes, seconds] = tempoStr.split(':').map(Number);
            const tempo = (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
            const corridas = Number(row.numero_de_corridas_aceitas) || 0;

            if (pracaMap.has(praca)) {
                const existing = pracaMap.get(praca)!;
                existing.tempo += tempo;
                existing.corridas += corridas;
            } else {
                pracaMap.set(praca, { tempo, corridas });
            }
        }

        const utrPorPraca: UtrPorPraca[] = Array.from(pracaMap.entries()).map(([praca, data]) => ({
            praca,
            tempo_horas: data.tempo / 3600,
            corridas: data.corridas,
            utr: data.tempo > 0 ? data.corridas / (data.tempo / 3600) : 0
        }));

        return {
            geral: utrGeral,
            praca: utrPorPraca,
            sub_praca: [],
            origem: [],
            turno: []
        };
    } catch (error) {
        safeLog.error('Erro no fallback fetchUtrFallback:', error);
        throw error;
    }
}
