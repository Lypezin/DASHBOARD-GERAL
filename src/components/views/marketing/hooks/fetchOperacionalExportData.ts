
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

export interface OperacionalExportRow {
    id_entregador: string;
    nome: string;
    praca: string | null;
    total_segundos: number;
    total_ofertadas: number;
    total_aceitas: number;
    total_completadas: number;
    total_rejeitadas: number;
}

export interface FetchOperacionalExportParams {
    organizationId: string | null;
    startDate: string;
    endDate: string;
    praca?: string | null;
}

/**
 * Fetches aggregated data from dados_corridas for Operacional export
 * This function queries dados_corridas directly to get praca information
 * which is not returned by get_entregadores_details for OPERATIONAL type
 */
export async function fetchOperacionalExportData(
    params: FetchOperacionalExportParams
): Promise<OperacionalExportRow[]> {
    try {
        let query = supabase
            .from('dados_corridas')
            .select(`
                id_da_pessoa_entregadora,
                pessoa_entregadora,
                praca,
                tempo_disponivel_absoluto,
                numero_de_corridas_ofertadas,
                numero_de_corridas_aceitas,
                numero_de_corridas_completadas,
                numero_de_corridas_rejeitadas
            `)
            .gte('data_do_periodo', params.startDate)
            .lte('data_do_periodo', params.endDate);

        if (params.organizationId) {
            query = query.eq('organization_id', params.organizationId);
        }

        if (params.praca) {
            query = query.eq('praca', params.praca);
        }

        const { data, error } = await query;

        if (error) {
            safeLog.error('Error fetching operacional export data:', error);
            throw error;
        }

        if (!data || data.length === 0) {
            return [];
        }

        // Aggregate by entregador
        const aggregated: Record<string, OperacionalExportRow> = {};

        for (const row of data) {
            const id = row.id_da_pessoa_entregadora || 'unknown';

            if (!aggregated[id]) {
                aggregated[id] = {
                    id_entregador: id,
                    nome: row.pessoa_entregadora || '',
                    praca: row.praca || null,
                    total_segundos: 0,
                    total_ofertadas: 0,
                    total_aceitas: 0,
                    total_completadas: 0,
                    total_rejeitadas: 0
                };
            }

            // Parse tempo_disponivel_absoluto to seconds
            if (row.tempo_disponivel_absoluto) {
                const timeParts = String(row.tempo_disponivel_absoluto).split(':');
                if (timeParts.length >= 2) {
                    const hours = parseInt(timeParts[0]) || 0;
                    const minutes = parseInt(timeParts[1]) || 0;
                    const seconds = timeParts[2] ? parseInt(timeParts[2]) : 0;
                    aggregated[id].total_segundos += (hours * 3600) + (minutes * 60) + seconds;
                }
            }

            aggregated[id].total_ofertadas += Number(row.numero_de_corridas_ofertadas) || 0;
            aggregated[id].total_aceitas += Number(row.numero_de_corridas_aceitas) || 0;
            aggregated[id].total_completadas += Number(row.numero_de_corridas_completadas) || 0;
            aggregated[id].total_rejeitadas += Number(row.numero_de_corridas_rejeitadas) || 0;

            // Update praca if not set (use the first non-null praca found)
            if (!aggregated[id].praca && row.praca) {
                aggregated[id].praca = row.praca;
            }
        }

        return Object.values(aggregated);

    } catch (err) {
        safeLog.error('Error in fetchOperacionalExportData:', err);
        throw err;
    }
}
