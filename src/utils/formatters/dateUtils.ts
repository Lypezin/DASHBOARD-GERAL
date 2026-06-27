import { safeLog } from '@/lib/errorHandler';
import { IS_DEV } from '@/constants/environment';

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

    if (typeof dateStr === 'number') {
        try {
            return excelSerialToISODate(dateStr);
        } catch (e) {
            safeLog.warn('Erro ao converter número para data:', { dateStr, error: e });
            return null;
        }
    }

    if (typeof dateStr !== 'string') return null;

    const cleaned = dateStr.trim();
    if (cleaned === '' || cleaned === 'null' || cleaned === 'NULL') return null;

    const ddmmyyyyMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (ddmmyyyyMatch) {
        const [, day, month, year] = ddmmyyyyMatch;
        const [dayNum, monthNum, yearNum] = [parseInt(day, 10), parseInt(month, 10), parseInt(year, 10)];
        if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= 2100) {
            return `${yearNum}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }

    const ddmmyyyyMatch2 = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
    if (ddmmyyyyMatch2) {
        const [, day, month, year] = ddmmyyyyMatch2;
        const [dayNum, monthNum, yearNum] = [parseInt(day, 10), parseInt(month, 10), parseInt(year, 10)];
        if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= 2100) {
            return `${yearNum}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }

    const yyyymmddMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (yyyymmddMatch) {
        return cleaned.split('T')[0];
    }

    try {
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

        const date = new Date(cleaned);
        if (!isNaN(date.getTime())) {
            const [y, m, d] = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')];
            return `${y}-${m}-${d}`;
        }
    } catch (e) {
        // Ignore error
    }

    if (IS_DEV) {
        safeLog.warn('Não foi possível converter data:', { dateStr, type: typeof dateStr });
    }

    return null;
}

/**
 * Extrai o número da semana de uma string ISO (ex: "2023-W05" -> "05")
 */
export function extractWeekNumber(isoWeek: string) {
  if (!isoWeek) return '';
  return isoWeek.split('-W')[1] || isoWeek;
}

/**
 * Calcula o intervalo de datas (inicio e fim) a partir do ano e numero da semana
 */
export function getDateRangeFromWeek(year: number, week: number) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dayOfWeek = simple.getDay();
  const isoWeekStart = simple;
  if (dayOfWeek <= 4)
    isoWeekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
    isoWeekStart.setDate(simple.getDate() + 8 - simple.getDay());

  const isoWeekEnd = new Date(isoWeekStart);
  isoWeekEnd.setDate(isoWeekStart.getDate() + 6);

  return {
    start: isoWeekStart.toISOString().split('T')[0],
    end: isoWeekEnd.toISOString().split('T')[0]
  };
}

/**
 * Formata o label da semana (ex: "2023-W05" -> "Semana 05")
 */
export function formatWeekLabel(semana: string) {
  const match = semana.match(/^(\d{4})-W(\d+)$/);
  if (match) {
    return `Semana ${match[2]}`;
  }
  return semana.replace(/^(\d{2})(\d{2})-W(\d+)$/, 'Semana $3');
}
