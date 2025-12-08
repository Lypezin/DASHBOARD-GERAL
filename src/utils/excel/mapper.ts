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
