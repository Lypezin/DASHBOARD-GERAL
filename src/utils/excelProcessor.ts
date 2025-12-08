/**
 * Processador genérico para arquivos Excel
 * Centraliza lógica de leitura, mapeamento de colunas e transformação de dados
 */

import * as XLSX from 'xlsx';
import { safeLog } from '@/lib/errorHandler';
import { commonTransformers } from './excel/transformers';
import { createFlexibleColumnMapping } from './excel/mapper';

const IS_DEV = process.env.NODE_ENV === 'development';

export { commonTransformers, createFlexibleColumnMapping };

/**
 * Opções para transformação de colunas
 */
export interface ColumnTransformer {
  /** Nome da coluna no banco de dados */
  dbColumn: string;
  /** Função de transformação opcional */
  transform?: (value: unknown, rowIndex: number) => unknown;
  /** Se o campo é obrigatório */
  required?: boolean;
  /** Mensagem de erro customizada */
  errorMessage?: string;
}

/**
 * Configuração para processamento de Excel
 */
export interface ExcelProcessConfig {
  /** Mapeamento de colunas Excel -> DB */
  columnMap: { [excelColumn: string]: string };
  /** Transformadores customizados por coluna */
  transformers?: { [dbColumn: string]: ColumnTransformer['transform'] };
  /** Campos obrigatórios */
  requiredFields?: string[];
  /** Se deve filtrar linhas vazias */
  filterEmptyRows?: boolean;
  /** Callback de progresso */
  onProgress?: (current: number, total: number) => void;
}

/**
 * Processa arquivo Excel e retorna dados sanitizados
 */
export async function processExcelData(
  file: File,
  config: ExcelProcessConfig
): Promise<Record<string, unknown>[]> {
  const {
    columnMap,
    transformers = {},
    requiredFields = [],
    filterEmptyRows = true,
  } = config;

  safeLog.info('Lendo arquivo...');
  const arrayBuffer = await file.arrayBuffer();
  safeLog.info('Arquivo lido, tamanho:', { size: arrayBuffer.byteLength });

  safeLog.info('Lendo workbook Excel...');
  const workbook = XLSX.read(arrayBuffer, { raw: true });
  safeLog.info('Sheets disponíveis:', { sheets: workbook.SheetNames });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('A planilha não contém nenhuma aba');
  }

  const sheetName = workbook.SheetNames[0];
  safeLog.info('Usando sheet:', { sheetName });

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`A aba "${sheetName}" está vazia ou inválida`);
  }

  safeLog.info('Convertendo para JSON...');
  const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
  safeLog.info(`Total de linhas lidas: ${rawData.length}`);

  if (!rawData || rawData.length === 0) {
    throw new Error('A planilha está vazia ou não contém dados válidos');
  }

  if (IS_DEV) {
    safeLog.info('Primeira linha de exemplo:', rawData[0]);
  }

  // Verificar colunas disponíveis na planilha
  const firstRow = rawData[0] as Record<string, unknown>;
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

  // Processar e sanitizar dados
  const sanitizedData = (rawData as Record<string, unknown>[])
    .map((row: Record<string, unknown>, rowIndex: number) => {
      try {
        const sanitized: Record<string, unknown> = {};

        for (const excelCol in columnMap) {
          const dbCol = columnMap[excelCol];
          const actualColName = columnMapping[excelCol] || excelCol;
          let value = row[actualColName];

          // Se a coluna não existe na planilha, usar null
          if (value === undefined) {
            sanitized[dbCol] = null;
            continue;
          }

          // Aplicar transformador customizado se existir
          if (transformers[dbCol]) {
            try {
              value = transformers[dbCol]!(value, rowIndex);
            } catch (transformError) {
              const errorMsg = transformError && typeof transformError === 'object' && 'message' in transformError && typeof transformError.message === 'string'
                ? transformError.message
                : String(transformError);
              throw new Error(`Erro ao transformar ${dbCol} na linha ${rowIndex + 2}: ${errorMsg}`);
            }
          }

          // Validar campos obrigatórios
          if (requiredFields.includes(dbCol)) {
            if (value === null || value === undefined || value === '') {
              throw new Error(`Campo obrigatório ${excelCol} (${dbCol}) vazio na linha ${rowIndex + 2}`);
            }
          }

          sanitized[dbCol] = value === null || value === undefined || value === '' ? null : value;
        }

        return sanitized;
      } catch (rowError) {
        const errorMsg = rowError && typeof rowError === 'object' && 'message' in rowError && typeof rowError.message === 'string'
          ? rowError.message
          : String(rowError);
        throw new Error(`Erro na linha ${rowIndex + 2}: ${errorMsg}`);
      }
    })
    .filter((row: Record<string, unknown>) => {
      if (!filterEmptyRows) return true;
      // Filtrar linhas vazias
      const hasData = Object.values(row).some((v) => v !== null && v !== undefined && v !== '');
      return hasData;
    });

  if (sanitizedData.length === 0) {
    throw new Error('Nenhum dado válido encontrado após processamento. Verifique se a planilha contém dados.');
  }

  safeLog.info(`Dados sanitizados: ${sanitizedData.length} linhas válidas`);
  if (IS_DEV) {
    safeLog.info('Exemplo de dado sanitizado:', sanitizedData[0]);
  }

  return sanitizedData;
}
