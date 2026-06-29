import { Entregador } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { loadXLSX } from '@/lib/xlsxClient';
import { IS_DEV } from '@/constants/environment';
import { appendStyledJsonSheet, applyWorkbookMetadata } from '@/utils/excel/workbookStyle';

export async function exportarPrioridadeParaExcel(
    entregadores: Entregador[]
): Promise<void> {
    try {
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
                '% Aceitas': `${percentualAceitas.toFixed(2)}%`,
                Completadas: entregador.corridas_completadas,
                '% Completadas': `${percentualCompletadas.toFixed(2)}%`,
                Rejeitadas: entregador.corridas_rejeitadas,
                '% Aderência': `${entregador.aderencia_percentual.toFixed(2)}%`,
                '% Rejeição': `${entregador.rejeicao_percentual.toFixed(2)}%`,
            };
        });

        const wb = XLSX.utils.book_new();
        applyWorkbookMetadata(wb, 'Prioridade promo');
        appendStyledJsonSheet(XLSX, wb, dadosExportacao, 'Prioridade', {
            title: 'Prioridade promo',
            theme: 'amber',
        });

        const agora = new Date();
        const dataHora = agora.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
        const nomeArquivo = `prioridade_promo_${dataHora}.xlsx`;

        XLSX.writeFile(wb, nomeArquivo);

        if (IS_DEV) {
            safeLog.info(`Arquivo Excel exportado: ${nomeArquivo} (${dadosExportacao.length} registros)`);
        }
    } catch (err: unknown) {
        safeLog.error('Erro ao exportar para Excel:', err);
        throw new Error('Erro ao exportar dados para Excel. Por favor, tente novamente.');
    }
}
