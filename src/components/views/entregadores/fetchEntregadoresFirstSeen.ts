import { postAppApiData } from '@/utils/app/fetchAppApi';

const REQUEST_CHUNK_SIZE = 450;
const REQUEST_CONCURRENCY = 3;

export type EntregadorFirstSeenRow = {
  id_entregador: string;
  primeira_data_aparicao: string | null;
};

function chunkArray<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

async function fetchFirstSeenChunk(
  entregadorIds: string[],
  organizationId?: string | null,
) {
  const { data, error } = await postAppApiData<EntregadorFirstSeenRow[]>('/api/app/entregadores-first-seen', {
    entregadorIds,
    organizationId: organizationId || null,
  });

  if (error) {
    throw new Error(error);
  }

  return data || [];
}

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

  const firstSeenById = new Map<string, string | null>();
  const chunks = chunkArray(ids, REQUEST_CHUNK_SIZE);
  const errors: Error[] = [];
  let nextChunkIndex = 0;

  async function worker() {
    while (nextChunkIndex < chunks.length) {
      const currentIndex = nextChunkIndex;
      nextChunkIndex += 1;

      const chunk = chunks[currentIndex];
      if (!chunk) continue;

      try {
        const rows = await fetchFirstSeenChunk(chunk, organizationId);

        for (const row of rows) {
          if (!row.id_entregador) continue;
          firstSeenById.set(row.id_entregador, row.primeira_data_aparicao || null);
        }
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error('Erro ao buscar primeira aparicao.'));
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(REQUEST_CONCURRENCY, chunks.length) }, () => worker())
  );

  const hasAtLeastOneDate = Array.from(firstSeenById.values()).some(Boolean);

  if (errors.length > 0 && !hasAtLeastOneDate) {
    throw errors[0] || new Error('Erro ao buscar primeira aparicao.');
  }

  return firstSeenById;
}

export function formatFirstSeenDate(value?: string | null) {
  if (!value) return 'N/D';

  const [year, month, day] = value.slice(0, 10).split('-');
  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}
