import { processExcelData, ExcelProcessConfig } from '@/utils/excelProcessor';
import { insertInBatches, BatchInsertOptions } from '@/utils/dbHelpers';
import { safeLog } from '@/lib/errorHandler';

export interface FileProcessOptions {
    excelConfig: ExcelProcessConfig;
    tableName: string;
    overwrite: boolean;
    organizationId?: string;
    insertOptions: BatchInsertOptions;
    onProgress: (current: number, total: number, phase: 'processing' | 'inserting') => void;
}

export async function processUploadFile(file: File, options: FileProcessOptions) {
    const { excelConfig, tableName, overwrite, organizationId, insertOptions, onProgress } = options;

    safeLog.info(`Iniciando processamento do arquivo: ${file.name}`);

    // Process from Excel
    const sanitizedData = await processExcelData(file, {
        ...excelConfig,
        onProgress: (c, t) => onProgress(c, t, 'processing')
    });

    // Insert
    safeLog.info('Iniciando inserção no banco de dados...');
    const { inserted, errors } = await insertInBatches(tableName, sanitizedData, {
        ...insertOptions,
        organizationId,
        onProgress: (c, t) => onProgress(c, t, 'inserting')
    });

    if (errors.length > 0) {
        throw new Error(`Erros durante inserção: ${errors.join('; ')}`);
    }

    safeLog.info(`Arquivo ${file.name} processado com sucesso: ${inserted} registros inseridos`);
    return inserted;
}
