/**
 * Processador genérico para arquivos Excel
 * Centraliza lógica de leitura, mapeamento de colunas e transformação de dados
 */

import { safeLog } from '@/lib/errorHandler';
import { commonTransformers } from './excel/transformers';
import { createFlexibleColumnMapping } from './excel/mapper';
import { ExcelProcessConfig } from './excel/types';
import { readExcelFile } from './excel/reader';
import { sanitizeWithMapping } from './excel/sanitizer';

export { commonTransformers, createFlexibleColumnMapping };
export type { ExcelProcessConfig, ColumnTransformer } from './excel/types';

/**
 * Processa arquivo Excel e retorna dados sanitizados
 */
export async function processExcelData(
  file: File,
  config: ExcelProcessConfig
): Promise<Record<string, unknown>[]> {
  const { columnMap } = config;

  // 1. Ler arquivo
  const rawData = await readExcelFile(file);

  // 2. Verificar colunas e criar mapeamento
  const firstRow = rawData[0];
  const availableColumns = Object.keys(firstRow || {});
  const requiredColumns = Object.keys(columnMap);

  // Criar mapeamento flexível
  const columnMapping = createFlexibleColumnMapping(availableColumns, requiredColumns);

  const missingColumns = requiredColumns.filter(col => {
    const mappedCol = columnMapping[col];
    return !availableColumns.includes(mappedCol);
  });

  if (missingColumns.length > 0) {
    safeLog.warn('Colunas não encontradas na planilha:', missingColumns);
    safeLog.info('Colunas disponíveis na planilha:', availableColumns);
    safeLog.info('Colunas esperadas:', requiredColumns);
  }

  // 3. Sanitizar dados
  return sanitizeWithMapping(rawData, columnMapping, config);
}
