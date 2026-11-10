import { postAppApiData } from '@/utils/app/fetchAppApi';

export type EntregadorUltimaAparicao = {
  ultima_data_aparicao: string | null;
  cidades: string[];
  cidades_incompletas: boolean;
};

export async function fetchEntregadorUltimaAparicao(entregadorId: string, organizationId?: string | null) {
  const { data, error } = await postAppApiData<EntregadorUltimaAparicao>('/api/app/entregador-ultima-aparicao', {
    entregadorId,
    organizationId: organizationId || null,
  });
  if (error) throw new Error(error);
  if (!data || !Array.isArray(data.cidades) || !data.cidades.every((city) => typeof city === 'string')
    || typeof data.cidades_incompletas !== 'boolean'
    || (data.ultima_data_aparicao !== null && typeof data.ultima_data_aparicao !== 'string')) {
    throw new Error('Resposta inválida ao consultar o histórico do entregador.');
  }
  return data;
}
