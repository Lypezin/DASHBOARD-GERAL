/**
 * Processador genérico para arquivos Excel
 * Centraliza lógica de leitura, mapeamento de colunas e transformação de dados
 */

import * as XLSX from 'xlsx';
import { safeLog } from '@/lib/errorHandler';
import { validateString } from '@/lib/validate';
import { convertDDMMYYYYToDate } from './uploadHelpers';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Opções para transformação de colunas
 */
export interface ColumnTransformer {
  /** Nome da coluna no banco de dados */
  dbColumn: string;
  /** Função de transformação opcional */
  transform?: (value: any, rowIndex: number) => any;
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
 * Cria mapeamento flexível de colunas (case-insensitive, remove espaços)
 */
export function createFlexibleColumnMapping(
  availableColumns: string[],
  requiredColumns: string[]
): { [key: string]: string } {
  const columnMapping: { [key: string]: string } = {};
  
  for (const excelCol of requiredColumns) {
    const normalizedRequired = excelCol.toLowerCase().trim();
    const foundCol = availableColumns.find(
      col => col.toLowerCase().trim() === normalizedRequired
    );
    if (foundCol) {
      columnMapping[excelCol] = foundCol;
    } else {
      columnMapping[excelCol] = excelCol; // Tentar usar o nome original mesmo assim
    }
  }
  
  return columnMapping;
}

/**
 * Processa arquivo Excel e retorna dados sanitizados
 */
export async function processExcelData(
  file: File,
  config: ExcelProcessConfig
): Promise<any[]> {
  const {
    columnMap,
    transformers = {},
    requiredFields = [],
    filterEmptyRows = true,
    onProgress
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
  const firstRow = rawData[0] as any;
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
  const sanitizedData = rawData
    .map((row: any, rowIndex: number) => {
      try {
        const sanitized: any = {};
        
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
            } catch (transformError: any) {
              throw new Error(`Erro ao transformar ${dbCol} na linha ${rowIndex + 2}: ${transformError.message}`);
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
      } catch (rowError: any) {
        throw new Error(`Erro na linha ${rowIndex + 2}: ${rowError.message}`);
      }
    })
    .filter((row: any) => {
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

/**
 * Transformadores comuns para reutilização
 */
export const commonTransformers = {
  /**
   * Transforma data DD/MM/YYYY para YYYY-MM-DD
   */
  date: (value: any, rowIndex: number): string | null => {
    const originalValue = value;
    const converted = convertDDMMYYYYToDate(value);
    if (!converted) {
      return null; // Permitir null para campos opcionais
    }
    return converted;
  },

  /**
   * Transforma data obrigatória (lança erro se inválida)
   */
  requiredDate: (value: any, rowIndex: number): string => {
    const originalValue = value;
    const converted = convertDDMMYYYYToDate(value);
    if (!converted) {
      throw new Error(`Data inválida: ${originalValue}`);
    }
    return converted;
  },

  /**
   * Sanitiza string
   */
  string: (maxLength: number = 500) => (value: any, rowIndex: number): string | null => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    if (typeof value === 'string') {
      try {
        return validateString(value, maxLength, 'Campo', true);
      } catch (e) {
        return String(value).substring(0, maxLength).replace(/[<>'"]/g, '');
      }
    }
    return String(value).trim();
  },

  /**
   * Transforma valor numérico
   */
  number: (value: any, rowIndex: number): number => {
    if (value === null || value === undefined || value === '') {
      throw new Error('Valor numérico não pode ser vazio');
    }
    const numValue = typeof value === 'string' 
      ? parseFloat(value.replace(',', '.').replace(/[^\d.-]/g, ''))
      : Number(value);
    
    if (isNaN(numValue)) {
      throw new Error(`Valor inválido: ${value}`);
    }
    return numValue;
  },

  /**
   * Normaliza "Rodando" para "Sim" ou "Não"
   */
  rodando: (value: any, rowIndex: number): string | null => {
    if (value && typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'sim' || normalized === 's' || normalized === 'yes' || normalized === 'y' || normalized === '1' || normalized === 'true') {
        return 'Sim';
      } else if (normalized === 'não' || normalized === 'nao' || normalized === 'n' || normalized === 'no' || normalized === '0' || normalized === 'false' || normalized === '') {
        return 'Não';
      } else {
        return value.trim() || null;
      }
    } else if (value) {
      const numValue = Number(value);
      if (numValue === 1 || numValue === 1.0) {
        return 'Sim';
      } else if (numValue === 0 || numValue === 0.0) {
        return 'Não';
      }
    }
    return null;
  },
};

