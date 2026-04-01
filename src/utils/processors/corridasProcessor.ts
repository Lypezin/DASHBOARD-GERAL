/**
 * Processador para planilhas de dados de corridas
 */

import * as XLSX from 'xlsx';
import { validateString } from '@/lib/validate';
import { COLUMN_MAP } from '@/constants/upload';
import {
  excelSerialToISODate,
  convertSecondsToHHMMSS,
  convertFractionToHHMMSS,
  convertDDMMYYYYToDate,
} from '@/utils/uploadHelpers';

/**

/**
 * Processa uma planilha de dados de corridas
 * @param file Arquivo Excel a ser processado
 * @returns Array de objetos sanitizados prontos para inserção no banco
 */
export async function processCorridasFile(file: File): Promise<Record<string, unknown>[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { raw: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

  const sanitizedData = rawData
    .map((row: unknown) => {
      const rowObj = row as Record<string, unknown>;
      const sanitized: Record<string, unknown> = {};
      for (const excelCol in COLUMN_MAP) {
        const dbCol = COLUMN_MAP[excelCol];
        let value = rowObj[excelCol];

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

  return sanitizedData;
}

