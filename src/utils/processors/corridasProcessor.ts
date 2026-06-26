/**
 * Processador para planilhas de dados de corridas
 */

import { validateString } from '@/lib/validate';
import { COLUMN_MAP } from '@/constants/upload';
import { excelSerialToISODate, convertDDMMYYYYToDate } from '@/utils/dateParsing';
import { convertSecondsToHHMMSS, convertFractionToHHMMSS } from '@/utils/timeFormatters';

const COLUMN_ALIASES: Record<string, string[]> = {
  data_do_periodo: ['data', 'data do periodo'],
  periodo: ['turno'],
  duracao_do_periodo: ['duracao do periodo'],
  id_da_pessoa_entregadora: [
    'id entregador',
    'id do entregador',
    'id da pessoa entregadora',
    'id pessoa entregadora',
  ],
  pessoa_entregadora: ['entregador', 'nome entregador', 'pessoa entregadora'],
  praca: ['cidade'],
  sub_praca: [
    'subpraca',
    'sub praca',
    'sub-praca',
    'sub praca 2.0',
    'subpraca 2.0',
    'sub_praca_2_0',
  ],
  origem: ['loja', 'restaurante', 'merchant'],
  tempo_disponivel_escalado: ['tempo disponivel escalado'],
  tempo_disponivel_absoluto: ['tempo disponivel absoluto'],
  numero_de_corridas_ofertadas: ['corridas ofertadas', 'ofertadas'],
  numero_de_corridas_aceitas: ['corridas aceitas', 'aceitas'],
  numero_de_corridas_rejeitadas: ['corridas rejeitadas', 'rejeitadas'],
  numero_de_corridas_completadas: ['corridas completadas', 'completadas', 'concluidas'],
  numero_de_corridas_canceladas_pela_pessoa_entregadora: [
    'corridas canceladas pela pessoa entregadora',
    'canceladas pela pessoa entregadora',
    'canceladas',
  ],
  numero_de_pedidos_aceitos_e_concluidos: [
    'pedidos aceitos e concluidos',
  ],
  soma_das_taxas_das_corridas_aceitas: [
    'taxas das corridas aceitas',
    'soma das taxas aceitas',
    'valor corridas aceitas',
  ],
};

function normalizeColumnName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function isFilled(value: unknown) {
  return value !== null && value !== undefined && value !== '';
}

function buildNormalizedRow(rowObj: Record<string, unknown>) {
  const normalizedRow = new Map<string, unknown>();

  for (const [key, value] of Object.entries(rowObj)) {
    const normalizedKey = normalizeColumnName(key);
    const currentValue = normalizedRow.get(normalizedKey);

    if (!normalizedRow.has(normalizedKey) || (!isFilled(currentValue) && isFilled(value))) {
      normalizedRow.set(normalizedKey, value);
    }
  }

  return normalizedRow;
}

function getColumnValue(
  rowObj: Record<string, unknown>,
  normalizedRow: Map<string, unknown>,
  excelCol: string,
  dbCol: string
) {
  const directValue = rowObj[excelCol];
  if (isFilled(directValue)) return directValue;

  const candidates = [excelCol, dbCol, ...(COLUMN_ALIASES[dbCol] || [])];

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeColumnName(candidate);
    const value = normalizedRow.get(normalizedCandidate);

    if (isFilled(value)) return value;
  }

  return directValue;
}

function validateCorridasImportQuality(rows: Record<string, unknown>[]) {
  const rowsWithPraca = rows.filter((row) => isFilled(row.praca));
  if (rowsWithPraca.length === 0) return;

  const rowsMissingSubPraca = rowsWithPraca.filter((row) => !isFilled(row.sub_praca));

  if (rowsMissingSubPraca.length === rowsWithPraca.length) {
    throw new Error(
      'A coluna Sub Praca nao foi encontrada ou veio vazia em todas as linhas. Corrija o cabecalho/arquivo antes de importar para evitar divergencias na Comparacao.'
    );
  }
}

/**
 * Processa uma planilha de dados de corridas
 * @param file Arquivo Excel a ser processado
 * @returns Array de objetos sanitizados prontos para inserção no banco
 */
export async function processCorridasFile(file: File): Promise<Record<string, unknown>[]> {
  const arrayBuffer = await file.arrayBuffer();
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(arrayBuffer, { raw: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

  const sanitizedData = rawData
    .map((row: unknown) => {
      const rowObj = row as Record<string, unknown>;
      const normalizedRow = buildNormalizedRow(rowObj);
      const sanitized: Record<string, unknown> = {};
      for (const excelCol in COLUMN_MAP) {
        const dbCol = COLUMN_MAP[excelCol];
        let value = getColumnValue(rowObj, normalizedRow, excelCol, dbCol);

        // Sanitizar strings para prevenir SQL injection e XSS
        if (typeof value === 'string' && dbCol !== 'data_do_periodo' && dbCol !== 'duracao_do_periodo' && dbCol !== 'tempo_disponivel_escalado' && dbCol !== 'tempo_disponivel_absoluto') {
          try {
            // Validar e limitar tamanho de strings
            value = validateString(value, 500, dbCol, true);
          } catch (e) {
            // Se validação falhar, truncar e sanitizar
            value = String(value).substring(0, 500).replace(/[<>'"]/g, '');
          }
        }

        if (dbCol === 'data_do_periodo') {
          if (typeof value === 'number') {
            value = excelSerialToISODate(value);
          } else if (value instanceof Date) {
            const yyyy = value.getFullYear();
            const mm = String(value.getMonth() + 1).padStart(2, '0');
            const dd = String(value.getDate()).padStart(2, '0');
            value = `${yyyy}-${mm}-${dd}`;
          } else if (typeof value === 'string') {
            const converted = convertDDMMYYYYToDate(value);
            if (converted) {
              value = converted;
            }
          }
        }

        if (dbCol === 'tempo_disponivel_escalado') {
          if (typeof value === 'number') {
            value = convertSecondsToHHMMSS(value);
          }
        }

        if (dbCol === 'duracao_do_periodo' || dbCol === 'tempo_disponivel_absoluto') {
          if (typeof value === 'number') {
            value = convertFractionToHHMMSS(value);
          } else if (value instanceof Date) {
            const h = value.getHours();
            const m = value.getMinutes();
            const s = value.getSeconds();
            value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
          } else if (typeof value === 'string' && value.includes('T')) {
            const timeMatch = value.match(/T(\d{2}):(\d{2}):(\d{2})/);
            if (timeMatch) {
              value = `${timeMatch[1]}:${timeMatch[2]}:${timeMatch[3]}`;
            }
          }
        }

        sanitized[dbCol] = value === null || value === undefined || value === '' ? null : value;
      }
      return sanitized;
    })
    .filter((row: Record<string, unknown>) => {
      const hasData = Object.values(row).some((v) => v !== null && v !== undefined && v !== '');
      return hasData;
    });

  validateCorridasImportQuality(sanitizedData);

  return sanitizedData;
}

