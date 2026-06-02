import { postAppApiData } from '@/utils/app/fetchAppApi';

export type EntregadorFirstSeenRow = {
  id_entregador: string;
  primeira_data_aparicao: string | null;
};

export async function fetchEntregadoresFirstSeen(
  entregadorIds: string[],
  organizationId?: string | null,
) {
  const ids = Array.from(new Set(
    entregadorIds
      .map((id) => String(id || '').trim())
      .filter(Boolean)
  ));

  if (ids.length === 0) {
    return new Map<string, string | null>();
  }

  const { data, error } = await postAppApiData<EntregadorFirstSeenRow[]>('/api/app/entregadores-first-seen', {
    entregadorIds: ids,
    organizationId: organizationId || null,
  });

  if (error) {
    throw new Error(error);
  }

  const firstSeenById = new Map<string, string | null>();

  for (const row of data || []) {
    if (!row.id_entregador) continue;
    firstSeenById.set(row.id_entregador, row.primeira_data_aparicao || null);
  }

  return firstSeenById;
}

export function formatFirstSeenDate(value?: string | null) {
  if (!value) return 'N/D';

  const [year, month, day] = value.slice(0, 10).split('-');
  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}
