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

export async function fetchAllMarketingRows<T>(
    context: string,
    fetchPage: (from: number, to: number, includeExactCount: boolean) => PromiseLike<MarketingPage<T>>
): Promise<T[]> {
    const rows: T[] = [];
    let totalRows: number | null = null;
    let offset = 0;

    while (totalRows === null || rows.length < totalRows) {
        const page = await fetchPage(offset, offset + POSTGREST_RANGE_SIZE - 1, offset === 0);
        const items = requireMarketingRows(context, page.data, page.error);

        if (offset === 0) {
            if (typeof page.count !== 'number' || !Number.isFinite(page.count)) {
                throw new Error(`${context}: o total de registros não foi informado pelo banco.`);
            }
            if (page.count > MAX_MARKETING_ROWS) {
                throw new Error(`${context}: o relatório excede o limite seguro de ${MAX_MARKETING_ROWS.toLocaleString('pt-BR')} registros.`);
            }
            totalRows = page.count;
        }

        if (items.length === 0 && totalRows !== null && rows.length < totalRows) {
            throw new Error(`${context}: a paginação terminou antes de carregar todos os registros.`);
        }

        rows.push(...items);
        offset += items.length;

        if (items.length === 0) break;
    }

    return rows;
}
