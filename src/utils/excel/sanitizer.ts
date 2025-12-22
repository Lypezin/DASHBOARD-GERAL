import { safeLog } from '@/lib/errorHandler';
import { ExcelProcessConfig } from './types';

const IS_DEV = process.env.NODE_ENV === 'development';

export function sanitizeWithMapping(
    rawData: Record<string, unknown>[],
    columnMapping: { [key: string]: string },
    config: ExcelProcessConfig
): Record<string, unknown>[] {
    const {
        columnMap,
        transformers = {},
        requiredFields = [],
        filterEmptyRows = true,
    } = config;

    // Processar e sanitizar dados
    const sanitizedData = rawData
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
