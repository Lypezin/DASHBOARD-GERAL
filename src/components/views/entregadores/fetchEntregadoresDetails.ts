
import { safeRpc } from '@/lib/rpcWrapper';
import { EntregadorMarketing } from '@/types';

export interface EntregadorDetailsParams {
    organizationId: string | null;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    type: 'MARKETING' | 'OPERATIONAL' | 'ALL';
    limit: number;
    offset: number;
    search?: string;
    praca?: string | null;
}

export interface EntregadorDetailsResult {
    data: EntregadorMarketing[];
    totalCount: number;
}

export async function fetchEntregadoresDetails(params: EntregadorDetailsParams): Promise<EntregadorDetailsResult> {
    try {
        const rpcParams = {
            p_organization_id: params.organizationId === '' ? null : params.organizationId,
            p_start_date: params.startDate || null,
            p_end_date: params.endDate || null,
            p_tipo: params.type,
            p_limit: params.limit,
            p_offset: params.offset,
            p_search: params.search || null,
            p_praca: params.praca || null
        };

        const { data, error } = await safeRpc<any[]>('get_entregadores_details', rpcParams, {
            validateParams: false
        });

        if (error) throw error;

        if (!data || data.length === 0) {
            return { data: [], totalCount: 0 };
        }

        // Map RPC result to EntregadorMarketing interface
        const resultData: EntregadorMarketing[] = data.map((row: any) => ({
            id_entregador: row.id_entregador,
            nome: row.nome,
            regiao_atuacao: row.regiao_atuacao || row.praca || null,
            total_segundos: Number(row.total_segundos),
            total_ofertadas: Number(row.total_ofertadas),
            total_aceitas: Number(row.total_aceitas),
            total_completadas: Number(row.total_completadas),
            total_rejeitadas: Number(row.total_rejeitadas),
            // Default fields not returned by RPC but required by interface
            ultima_data: null,
            dias_sem_rodar: null,
            rodando: null
        }));

        const totalCount = data.length > 0 ? Number(data[0].total_count) : 0;

        return { data: resultData, totalCount };

    } catch (err) {
        console.error('Error fetching entregadores details:', err);
        throw err;
    }
}
