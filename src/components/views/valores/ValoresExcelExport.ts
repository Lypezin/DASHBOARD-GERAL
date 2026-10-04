import { ValoresEntregador } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { loadXLSX } from '@/lib/xlsxClient';
import { IS_DEV } from '@/constants/environment';
import { appendStyledJsonSheet, applyWorkbookMetadata, assertExcelRowLimit, createExcelFilterRows, writeWorkbookFile } from '@/utils/excel/workbookStyle';
import type { FilterPayload } from '@/types/filters';

export async function exportarValoresParaExcel(valoresData: ValoresEntregador[], filters?: FilterPayload): Promise<void> {
    try {
        assertExcelRowLimit(valoresData?.length || 0);
        const XLSX = await loadXLSX();
        const wb = XLSX.utils.book_new();
        applyWorkbookMetadata(wb, 'Valores por entregador');

        const dadosExportacao = (valoresData || []).map((v) => ({
            'ID Entregador': v.id_entregador,
            Nome: v.nome_entregador,
            'Valor Total': v.total_taxas || 0,
            Corridas: v.numero_corridas_aceitas,
            'Taxa Media': v.taxa_media || 0,
        }));

        appendStyledJsonSheet(XLSX, wb, dadosExportacao, 'Valores', {
            title: 'Valores por entregador',
            theme: 'emerald',
            highlightFirstColumn: true,
        });
        appendStyledJsonSheet(XLSX, wb, createExcelFilterRows(filters), 'Filtros', {
            title: 'Filtros aplicados',
            theme: 'slate',
            highlightFirstColumn: true,
        });

        const agora = new Date();
        const dataHora = agora.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
        const nomeArquivo = `valores_entregadores_${dataHora}.xlsx`;

        await writeWorkbookFile(XLSX, wb, nomeArquivo);

        if (IS_DEV) safeLog.info(`Valores exportados: ${nomeArquivo}`);
    } catch (error) {
        safeLog.error('Erro ao exportar valores:', error);
        throw error instanceof Error ? error : new Error('Falha ao gerar arquivo Excel de Valores.');
    }
}
