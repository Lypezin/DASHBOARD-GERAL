import * as XLSX from 'xlsx';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function readExcelFile(file: File): Promise<Record<string, unknown>[]> {
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

    return rawData as Record<string, unknown>[];
}
