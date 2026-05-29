import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';
import type { EntregadorMarketing } from '@/types';

export interface EntregadorDetailsParams {
  organizationId: string | null;
  startDate: string;
  endDate: string;
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

export async function fetchEntregadoresDetails(
  params: EntregadorDetailsParams
): Promise<EntregadorDetailsResult> {
  try {
    const rpcParams = {
      p_organization_id: params.organizationId === '' ? null : params.organizationId,
      p_start_date: params.startDate || null,
      p_end_date: params.endDate || null,
      p_tipo: params.type,
      p_limit: params.limit,
      p_offset: params.offset,
      p_search: params.search || null,
      p_praca: params.praca || null,
    };

    const { data, error } = await safeRpc<Record<string, unknown>[]>(
      'get_entregadores_details',
      rpcParams,
      { validateParams: false }
    );

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return { data: [], totalCount: 0 };
    }

    const resultData: EntregadorMarketing[] = data.map((row) => ({
      id_entregador: String(row.id_entregador ?? ''),
      nome: String(row.nome ?? ''),
      regiao_atuacao: String(row.regiao_atuacao ?? row.praca ?? '') || null,
      total_segundos: Number(row.total_segundos ?? 0),
      total_ofertadas: Number(row.total_ofertadas ?? 0),
      total_aceitas: Number(row.total_aceitas ?? 0),
      total_completadas: Number(row.total_completadas ?? 0),
      total_rejeitadas: Number(row.total_rejeitadas ?? 0),
      ultima_data: null,
      dias_sem_rodar: null,
      rodando: null,
    }));

    const totalCount = Number(data[0]?.total_count ?? 0);

    return { data: resultData, totalCount };
  } catch (error) {
    safeLog.error('Error fetching entregadores details:', error);
    throw error;
  }
}
