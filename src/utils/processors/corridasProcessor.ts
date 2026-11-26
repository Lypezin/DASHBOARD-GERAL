/**
 * Processador para planilhas de dados de corridas
 */

import { validateString } from '@/lib/validate';
import { COLUMN_MAP } from '@/constants/upload';
import { excelSerialToISODate, convertDDMMYYYYToDate } from '@/utils/formatters/dateUtils';
import { convertSecondsToHHMMSS, convertFractionToHHMMSS } from '@/utils/formatters/timeUtils';

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

const COLUMN_ENTRIES = Object.entries(COLUMN_MAP).map(([excelCol, dbCol]) => ({
  excelCol,
  dbCol,
  normalizedCandidates: [
    normalizeColumnName(excelCol),
    normalizeColumnName(dbCol),
    ...(COLUMN_ALIASES[dbCol] || []).map(normalizeColumnName),
  ],
  isStringSanitizable:
    dbCol !== 'data_do_periodo' &&
    dbCol !== 'duracao_do_periodo' &&
    dbCol !== 'tempo_disponivel_escalado' &&
    dbCol !== 'tempo_disponivel_absoluto',
  isFractionTime: dbCol === 'duracao_do_periodo' || dbCol === 'tempo_disponivel_absoluto',
}));

function resolveWorksheetColumnMapping(rawData: Record<string, unknown>[]) {
  const rawKeys: string[] = [];
  const seenKeys = new Set<string>();

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || typeof row !== 'object') continue;
    for (const key in row) {
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        rawKeys.push(key);
      }
    }
  }

  const normalizedKeyGroups = new Map<string, string[]>();
  for (let i = 0; i < rawKeys.length; i++) {
    const rawKey = rawKeys[i];
    const normalizedKey = normalizeColumnName(rawKey);
    const group = normalizedKeyGroups.get(normalizedKey);
    if (group) {
      group.push(rawKey);
    } else {
      normalizedKeyGroups.set(normalizedKey, [rawKey]);
    }
  }

  return COLUMN_ENTRIES.map((entry) => {
    const sourceKeys: string[] = [];
    const addedKeys = new Set<string>();

    if (seenKeys.has(entry.excelCol)) {
      addedKeys.add(entry.excelCol);
      sourceKeys.push(entry.excelCol);
    }

    for (let i = 0; i < entry.normalizedCandidates.length; i++) {
      const group = normalizedKeyGroups.get(entry.normalizedCandidates[i]);
      if (!group) continue;
      for (let j = 0; j < group.length; j++) {
        const rawKey = group[j];
        if (!addedKeys.has(rawKey)) {
          addedKeys.add(rawKey);
          sourceKeys.push(rawKey);
        }
      }
    }

    return {
      dbCol: entry.dbCol,
      sourceKeys,
      isStringSanitizable: entry.isStringSanitizable,
      isFractionTime: entry.isFractionTime,
    };
  });
}

function getMappedColumnValue(rowObj: Record<string, unknown>, sourceKeys: string[]) {
  for (let i = 0; i < sourceKeys.length; i++) {
    const value = rowObj[sourceKeys[i]];
    if (isFilled(value)) return value;
  }
  return undefined;
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
 * @returns Linhas sanitizadas e impressão digital do arquivo original
 */
export async function processCorridasFile(file: File): Promise<{ rows: Record<string, unknown>[]; fileHash: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const fileHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const XLSX = await import('xlsx-js-style');
  const workbook = XLSX.read(arrayBuffer, { raw: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: null }) as Record<string, unknown>[];
  const columnMapping = resolveWorksheetColumnMapping(rawData);

  const sanitizedData: Record<string, unknown>[] = [];
  for (let i = 0; i < rawData.length; i++) {
    const rowObj = rawData[i];
    const sanitized: Record<string, unknown> = {};
    let hasData = false;

    for (let j = 0; j < columnMapping.length; j++) {
      const col = columnMapping[j];
      const dbCol = col.dbCol;
      let value = getMappedColumnValue(rowObj, col.sourceKeys);

      // Sanitizar strings para prevenir SQL injection e XSS
      if (typeof value === 'string' && col.isStringSanitizable) {
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

      if (col.isFractionTime) {
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

      const normalizedValue = value === null || value === undefined || value === '' ? null : value;
      if (normalizedValue !== null) {
        hasData = true;
      }
      sanitized[dbCol] = normalizedValue;
    }

    if (hasData) {
      sanitizedData.push(sanitized);
    }
  }

  validateCorridasImportQuality(sanitizedData);

  return { rows: sanitizedData, fileHash };
}

