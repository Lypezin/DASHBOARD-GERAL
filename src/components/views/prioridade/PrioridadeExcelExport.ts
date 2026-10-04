import { Entregador } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { loadXLSX } from '@/lib/xlsxClient';
import { IS_DEV } from '@/constants/environment';
import { appendStyledJsonSheet, applyWorkbookMetadata, assertExcelRowLimit, createExcelFilterRows, writeWorkbookFile } from '@/utils/excel/workbookStyle';

export async function exportarPrioridadeParaExcel(
    entregadores: Entregador[],
    filters?: Record<string, unknown>
): Promise<void> {
    try {
        assertExcelRowLimit(entregadores?.length || 0);
        const XLSX = await loadXLSX();

        const dadosExportacao = (entregadores || []).map((entregador) => {
            const percentualAceitas = entregador.corridas_ofertadas > 0
                ? (entregador.corridas_aceitas / entregador.corridas_ofertadas) * 100
                : 0;

            const percentualCompletadas = entregador.corridas_aceitas > 0
                ? (entregador.corridas_completadas / entregador.corridas_aceitas) * 100
                : 0;

            return {
                'ID Entregador': entregador.id_entregador,
                Nome: entregador.nome_entregador,
                Ofertadas: entregador.corridas_ofertadas,
                Aceitas: entregador.corridas_aceitas,
                '% Aceitas': percentualAceitas,
                Completadas: entregador.corridas_completadas,
                '% Completadas': percentualCompletadas,
                Rejeitadas: entregador.corridas_rejeitadas,
                '% Aderencia': entregador.aderencia_percentual,
                '% Rejeicao': entregador.rejeicao_percentual,
            };
        });

        const wb = XLSX.utils.book_new();
        applyWorkbookMetadata(wb, 'Prioridade promo');
        appendStyledJsonSheet(XLSX, wb, dadosExportacao, 'Prioridade', {
            title: 'Prioridade promo',
            theme: 'amber',
            highlightFirstColumn: true,
        });
        appendStyledJsonSheet(XLSX, wb, createExcelFilterRows(filters), 'Filtros', {
            title: 'Filtros aplicados',
            theme: 'slate',
            highlightFirstColumn: true,
        });

        const agora = new Date();
        const dataHora = agora.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
        const nomeArquivo = `prioridade_promo_${dataHora}.xlsx`;

        await writeWorkbookFile(XLSX, wb, nomeArquivo);

        if (IS_DEV) {
            safeLog.info(`Arquivo Excel exportado: ${nomeArquivo} (${dadosExportacao.length} registros)`);
        }
    } catch (err: unknown) {
        safeLog.error('Erro ao exportar para Excel:', err);
        throw err instanceof Error ? err : new Error('Erro ao exportar dados para Excel. Por favor, tente novamente.');
    }
}
