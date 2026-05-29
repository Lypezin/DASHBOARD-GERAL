/**
 * Funções utilitárias para processamento de uploads
 * Inclui conversões de data, tempo e validações
 * 
 * @deprecated Use dateParsing.ts e timeFormatters.ts para novas implementações
 */

// Re-exportar funções extraídas
export { excelSerialToISODate, convertDDMMYYYYToDate } from './dateParsing';
export { convertSecondsToHHMMSS, convertFractionToHHMMSS } from './timeFormatters';

/**
 * Cria mapeamento flexível de colunas (case-insensitive, remove espaços)
 * @deprecated Use createFlexibleColumnMapping de excelProcessor.ts
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
