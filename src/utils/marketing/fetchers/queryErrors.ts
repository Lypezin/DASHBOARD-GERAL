import { safeLog } from '@/lib/errorHandler';

export { isMissingRpcFunctionError } from '@/lib/rpc/errors';

export function throwMarketingQueryError(context: string, error: unknown): never {
    safeLog.error(context, error);
    throw new Error(context);
}

export function requireMarketingRows<T>(
    context: string,
    data: T[] | null,
    error: unknown
): T[] {
    if (error) throwMarketingQueryError(context, error);
    if (!Array.isArray(data)) {
        throw new Error(`${context}: resposta inválida do banco.`);
    }
    return data;
}

export function requireMarketingCount(
    context: string,
    count: number | null,
    error: unknown
): number {
    if (error) throwMarketingQueryError(context, error);
    if (typeof count !== 'number' || !Number.isFinite(count)) {
        throw new Error(`${context}: contagem inválida do banco.`);
    }
    return count;
}

type MarketingPage<T> = {
    data: T[] | null;
    error: unknown;
    count?: number | null;
};

const POSTGREST_RANGE_SIZE = 1000;
const MAX_MARKETING_ROWS = 100_000;
const MARKETING_PAGE_CONCURRENCY = 4;

export async function fetchAllMarketingRows<T>(
    context: string,
    fetchPage: (from: number, to: number, includeExactCount: boolean) => PromiseLike<MarketingPage<T>>
): Promise<T[]> {
    const firstPage = await fetchPage(0, POSTGREST_RANGE_SIZE - 1, true);
    const firstItems = requireMarketingRows(context, firstPage.data, firstPage.error);

    if (typeof firstPage.count !== 'number' || !Number.isFinite(firstPage.count)) {
        throw new Error(`${context}: o total de registros não foi informado pelo banco.`);
    }
    if (firstPage.count > MAX_MARKETING_ROWS) {
        throw new Error(`${context}: o relatório excede o limite seguro de ${MAX_MARKETING_ROWS.toLocaleString('pt-BR')} registros.`);
    }

    const totalRows = firstPage.count;
    if (totalRows <= firstItems.length) {
        return firstItems;
    }

    if (firstItems.length === 0) {
        throw new Error(`${context}: a paginação terminou antes de carregar todos os registros.`);
    }

    const offsets: number[] = [];
    for (let offset = firstItems.length; offset < totalRows; offset += POSTGREST_RANGE_SIZE) {
        offsets.push(offset);
    }

    const pageResults: T[][] = new Array(offsets.length);
    let nextIndex = 0;

    await Promise.all(
        Array.from({ length: Math.min(MARKETING_PAGE_CONCURRENCY, offsets.length) }, async () => {
            while (nextIndex < offsets.length) {
                const index = nextIndex;
                nextIndex += 1;
                const offset = offsets[index];
                const to = Math.min(offset + POSTGREST_RANGE_SIZE - 1, totalRows - 1);
                const page = await fetchPage(offset, to, false);
                const items = requireMarketingRows(context, page.data, page.error);
                if (items.length === 0) {
                    throw new Error(`${context}: a paginação terminou antes de carregar todos os registros.`);
                }
                pageResults[index] = items;
            }
        })
    );

    const rows = [...firstItems];
    for (const chunk of pageResults) {
        rows.push(...chunk);
    }

    if (rows.length < totalRows) {
        throw new Error(`${context}: a paginação terminou antes de carregar todos os registros.`);
    }

    return rows;
}
