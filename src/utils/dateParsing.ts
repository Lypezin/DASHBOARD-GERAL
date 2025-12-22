import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Converte um número serial do Excel para data ISO (YYYY-MM-DD)
 * @param serial Número serial do Excel (dias desde 1900-01-01)
 * @returns Data no formato YYYY-MM-DD
 */
export function excelSerialToISODate(serial: number): string {
    const utc_days = Math.floor(serial - 25569);
    const date_info = new Date(utc_days * 86400 * 1000);
    const year = date_info.getUTCFullYear();
    const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date_info.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Converte data no formato DD/MM/YYYY para YYYY-MM-DD (formato PostgreSQL)
 * Também aceita números (serial do Excel) e outros formatos
 * @param dateStr String de data, número serial do Excel, ou null/undefined
 * @returns Data no formato YYYY-MM-DD ou null se inválida
 */
export function convertDDMMYYYYToDate(dateStr: string | number | null | undefined): string | null {
    if (dateStr === null || dateStr === undefined || dateStr === '') return null;

    // Se for número (serial do Excel), converter primeiro
    if (typeof dateStr === 'number') {
        try {
            return excelSerialToISODate(dateStr);
        } catch (e) {
            safeLog.warn('Erro ao converter número para data:', { dateStr, error: e });
            return null;
        }
    }

    if (typeof dateStr !== 'string') return null;

    // Remover espaços e tentar diferentes formatos
    const cleaned = dateStr.trim();
    if (cleaned === '' || cleaned === 'null' || cleaned === 'NULL') return null;

    // Formato DD/MM/YYYY
    const ddmmyyyyMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
        const [, day, month, year] = ddmmyyyyMatch;
        const dayNum = parseInt(day, 10);
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);

        // Validar data
        if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= 2100) {
            return `${yearNum}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }

    // Formato DD-MM-YYYY
    const ddmmyyyyMatch2 = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyyMatch2) {
        const [, day, month, year] = ddmmyyyyMatch2;
        const dayNum = parseInt(day, 10);
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);

        if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= 2100) {
            return `${yearNum}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }

    // Se já estiver no formato YYYY-MM-DD, retornar como está
    const yyyymmddMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (yyyymmddMatch) {
        return cleaned.split('T')[0]; // Remove hora se houver
    }

    // Tentar parsear como Date se for um formato conhecido
    try {
        // Tentar formato brasileiro primeiro (DD/MM/YYYY)
        const brDateMatch = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (brDateMatch) {
            const [, day, month, year] = brDateMatch;
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            if (!isNaN(date.getTime())) {
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
            }
        }

        // Tentar parse direto
        const date = new Date(cleaned);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    } catch (e) {
        // Ignorar erro
    }

    if (IS_DEV) {
        safeLog.warn('Não foi possível converter data:', { dateStr, type: typeof dateStr });
    }

    return null;
}
