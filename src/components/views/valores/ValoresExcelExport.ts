import { ValoresEntregador } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { loadXLSX } from '@/lib/xlsxClient';
import { IS_DEV } from '@/constants/environment';
import { appendStyledJsonSheet, applyWorkbookMetadata } from '@/utils/excel/workbookStyle';

export async function exportarValoresParaExcel(valoresData: ValoresEntregador[]): Promise<void> {
    try {
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

        const agora = new Date();
        const dataHora = agora.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
        const nomeArquivo = `valores_entregadores_${dataHora}.xlsx`;

        XLSX.writeFile(wb, nomeArquivo);

        if (IS_DEV) safeLog.info(`Valores exportados: ${nomeArquivo}`);
    } catch (error) {
        safeLog.error('Erro ao exportar valores:', error);
        throw new Error('Falha ao gerar arquivo Excel de Valores.');
    }
}
