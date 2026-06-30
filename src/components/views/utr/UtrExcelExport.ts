import { UtrData } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { loadXLSX } from '@/lib/xlsxClient';
import { IS_DEV } from '@/constants/environment';
import { appendStyledJsonSheet, applyWorkbookMetadata } from '@/utils/excel/workbookStyle';

export async function exportarUtrParaExcel(utrData: UtrData): Promise<void> {
    try {
        const XLSX = await loadXLSX();
        const wb = XLSX.utils.book_new();
        applyWorkbookMetadata(wb, 'UTR dashboard');

        if (utrData.geral) {
            const g = utrData.geral;
            appendStyledJsonSheet(XLSX, wb, [{
                'Tempo Total (h)': g.tempo_horas || 0,
                Corridas: g.corridas || 0,
                'UTR Score': g.utr || 0,
            }], 'Resumo Geral', {
                title: 'Resumo geral UTR',
                theme: 'purple',
                highlightFirstColumn: true,
            });
        }

        const exportarSecao = (dados: any[], nomeAba: string, campoChave: string, labelChave: string) => {
            const dadosFormatados = (dados || []).map((item) => ({
                [labelChave]: item[campoChave] || 'N/A',
                'Tempo Total (h)': item.tempo_horas || 0,
                Corridas: item.corridas || 0,
                'UTR Score': item.utr || 0,
            }));

            appendStyledJsonSheet(XLSX, wb, dadosFormatados, nomeAba, {
                title: nomeAba,
                theme: 'purple',
                highlightFirstColumn: true,
            });
        };

        exportarSecao(utrData.praca || utrData.por_praca || [], 'Por Praca', 'praca', 'Praca');
        exportarSecao(utrData.sub_praca || utrData.por_sub_praca || [], 'Por Sub-Praca', 'sub_praca', 'Sub-Praca');
        exportarSecao(utrData.origem || utrData.por_origem || [], 'Por Origem', 'origem', 'Origem');
        exportarSecao(utrData.turno || utrData.por_turno || [], 'Por Turno', 'turno', 'Turno');

        const agora = new Date();
        const dataHora = agora.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
        const nomeArquivo = `utr_dashboard_${dataHora}.xlsx`;

        XLSX.writeFile(wb, nomeArquivo);

        if (IS_DEV) safeLog.info(`UTR exportada: ${nomeArquivo}`);
    } catch (error) {
        safeLog.error('Erro ao exportar UTR:', error);
        throw new Error('Falha ao gerar arquivo Excel da UTR.');
    }
}
