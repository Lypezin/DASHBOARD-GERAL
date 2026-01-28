/**
 * Hook para buscar dados dos atendentes
 */

import { useState, useCallback } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { MarketingDateFilter } from '@/types';
import { AtendenteData } from '@/components/views/resultados/AtendenteCard';
import { useOrganization } from '@/contexts/OrganizationContext';
import { processRpcData, fetchFallbackData } from '@/hooks/marketing/utils/atendentesDataUtils';

interface TotaisData {
  totalEnviado: number;
  totalLiberado: number;
}

export function useAtendentesData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { organizationId, isLoading: isOrgLoading } = useOrganization();

  const fetchAtendentesData = useCallback(async (
    filters: {
      filtroLiberacao: MarketingDateFilter;
      filtroEnviados: MarketingDateFilter;
    }
  ): Promise<{ atendentes: AtendenteData[]; totais: TotaisData }> => {
    // Se ainda está carregando a organização, retorna vazio mas setado como carregando para quem chama saber
    if (isOrgLoading) {
      return { atendentes: [], totais: { totalEnviado: 0, totalLiberado: 0 } };
    }

    setLoading(true);
    setError(null);

    try {
      // Tentar usar RPC primeiro
      const { data: rpcData, error: rpcError } = await safeRpc<Array<{
        responsavel: string;
        enviado: number;
        liberado: number;
        cidade: string;
        cidade_enviado: number;
        cidade_liberado: number;
      }>>('get_marketing_atendentes_data', {
        data_envio_inicial: filters.filtroEnviados.dataInicial || null,
        data_envio_final: filters.filtroEnviados.dataFinal || null,
        data_liberacao_inicial: filters.filtroLiberacao.dataInicial || null,
        data_liberacao_final: filters.filtroLiberacao.dataFinal || null,
        p_organization_id: organizationId,
      }, { validateParams: false });

      if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
        return processRpcData(rpcData);
      }

      // Fallback para queries diretas
      return await fetchFallbackData(filters);

    } catch (err: any) {
      safeLog.error('Erro ao buscar dados dos atendentes:', err);
      setError(err.message || 'Erro ao buscar dados dos atendentes');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [organizationId, isOrgLoading]);

  return {
    fetchAtendentesData,
    loading: loading || isOrgLoading,
    error,
  };
}
