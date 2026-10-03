import { UtrData } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { loadXLSX } from '@/lib/xlsxClient';
import { IS_DEV } from '@/constants/environment';
import { appendStyledJsonSheet, applyWorkbookMetadata, assertExcelRowLimit, createExcelFilterRows } from '@/utils/excel/workbookStyle';
import type { FilterPayload } from '@/types/filters';

function selectSectionRows<T>(primary: T[] | undefined, fallback: T[] | undefined): T[] {
    // Match the view's `primary || alias || []` resolution: an explicitly
    // empty primary array is authoritative and must not export stale alias data.
    if (Array.isArray(primary)) return primary;
    if (Array.isArray(fallback)) return fallback;
    return [];
}

function parseRequiredUtrMetric(value: unknown, label: string): number {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
    throw new Error(`A métrica "${label}" está ausente ou inválida. Gere a exportação novamente.`);
}

export async function exportarUtrParaExcel(utrData: UtrData, filters?: FilterPayload): Promise<void> {
    try {
        if (!utrData?.geral) throw new Error('O resumo geral da UTR está ausente. Gere a exportação novamente.');
        const sections = [
            selectSectionRows(utrData.praca, utrData.por_praca),
            selectSectionRows(utrData.sub_praca, utrData.por_sub_praca),
            selectSectionRows(utrData.origem, utrData.por_origem),
            selectSectionRows(utrData.turno, utrData.por_turno),
        ];
        sections.forEach((section) => assertExcelRowLimit(section.length));
        const XLSX = await loadXLSX();
        const wb = XLSX.utils.book_new();
        applyWorkbookMetadata(wb, 'UTR dashboard');

        if (utrData.geral) {
            const g = utrData.geral;
            appendStyledJsonSheet(XLSX, wb, [{
                'Tempo Total (h)': parseRequiredUtrMetric(g.tempo_horas, 'Tempo total'),
                Corridas: parseRequiredUtrMetric(g.corridas, 'Corridas'),
                'UTR Score': parseRequiredUtrMetric(g.utr, 'UTR geral'),
            }], 'Resumo Geral', {
                title: 'Resumo geral UTR',
                theme: 'purple',
                highlightFirstColumn: true,
            });
        }

        const exportarSecao = (dados: any[], nomeAba: string, campoChave: string, labelChave: string) => {
            const dadosFormatados = (dados || []).map((item) => ({
                [labelChave]: item[campoChave] || 'N/A',
                'Tempo Total (h)': parseRequiredUtrMetric(item.tempo_horas, 'Tempo total'),
                Corridas: parseRequiredUtrMetric(item.corridas, 'Corridas'),
                'UTR Score': parseRequiredUtrMetric(item.utr, 'UTR'),
            }));

            appendStyledJsonSheet(XLSX, wb, dadosFormatados, nomeAba, {
                title: nomeAba,
                theme: 'purple',
                highlightFirstColumn: true,
            });
        };

        exportarSecao(selectSectionRows(utrData.praca, utrData.por_praca), 'Por Praca', 'praca', 'Praca');
        exportarSecao(selectSectionRows(utrData.sub_praca, utrData.por_sub_praca), 'Por Sub-Praca', 'sub_praca', 'Sub-Praca');
        exportarSecao(selectSectionRows(utrData.origem, utrData.por_origem), 'Por Origem', 'origem', 'Origem');
        exportarSecao(selectSectionRows(utrData.turno, utrData.por_turno), 'Por Turno', 'turno', 'Turno');
        appendStyledJsonSheet(XLSX, wb, createExcelFilterRows(filters), 'Filtros', {
            title: 'Filtros aplicados',
            theme: 'slate',
            highlightFirstColumn: true,
        });

        const agora = new Date();
        const dataHora = agora.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
        const nomeArquivo = `utr_dashboard_${dataHora}.xlsx`;

        XLSX.writeFile(wb, nomeArquivo);

        if (IS_DEV) safeLog.info(`UTR exportada: ${nomeArquivo}`);
    } catch (error) {
        safeLog.error('Erro ao exportar UTR:', error);
        throw error instanceof Error ? error : new Error('Falha ao gerar arquivo Excel da UTR.');
    }
}
