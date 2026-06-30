import { Entregador } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { loadXLSX } from '@/lib/xlsxClient';
import { calcularPercentualAceitas, calcularPercentualCompletadas } from './EntregadoresUtils';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { fetchEntregadoresFirstSeen, formatFirstSeenDate } from './fetchEntregadoresFirstSeen';
import { IS_DEV } from '@/constants/environment';
import { appendStyledJsonSheet, applyWorkbookMetadata } from '@/utils/excel/workbookStyle';

export async function exportarEntregadoresMainParaExcel(
    entregadores: Entregador[],
    options: { organizationId?: string | null } = {}
): Promise<void> {
    try {
        const XLSX = await loadXLSX();
        const wb = XLSX.utils.book_new();
        applyWorkbookMetadata(wb, 'Entregadores operacional');

        if (entregadores && entregadores.length > 0) {
            let firstSeenById = new Map<string, string | null>();

            try {
                firstSeenById = await fetchEntregadoresFirstSeen(
                    entregadores.map((entregador) => entregador.id_entregador),
                    options.organizationId
                );
            } catch (error) {
                safeLog.error('Erro ao buscar primeira aparicao para exportacao:', error);
                throw new Error('Nao foi possivel buscar a primeira aparicao dos entregadores para o Excel.');
            }

            const dadosExportacao = entregadores.map((e) => ({
                'ID Entregador': e.id_entregador,
                Nome: e.nome_entregador,
                'Primeira aparicao': formatFirstSeenDate(firstSeenById.get(e.id_entregador) ?? e.primeira_data_aparicao),
                Horas: formatarHorasParaHMS((e.total_segundos || 0) / 3600),
                Ofertadas: e.corridas_ofertadas,
                Aceitas: e.corridas_aceitas,
                Rejeitadas: e.corridas_rejeitadas,
                Completadas: e.corridas_completadas,
                '% Aceitacao': calcularPercentualAceitas(e),
                '% Completude': calcularPercentualCompletadas(e),
                '% Aderencia': e.aderencia_percentual,
                '% Rejeicao': e.rejeicao_percentual,
            }));

            appendStyledJsonSheet(XLSX, wb, dadosExportacao, 'Entregadores Operacional', {
                title: 'Entregadores operacional',
                theme: 'green',
                highlightFirstColumn: true,
            });
        } else {
            appendStyledJsonSheet(XLSX, wb, [], 'Entregadores Operacional', {
                title: 'Entregadores operacional',
                theme: 'green',
                highlightFirstColumn: true,
            });
        }

        const agora = new Date();
        const dataHora = agora.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
        const nomeArquivo = `entregadores_operacional_${dataHora}.xlsx`;

        XLSX.writeFile(wb, nomeArquivo);

        if (IS_DEV) safeLog.info(`Entregadores Operacional exportado: ${nomeArquivo}`);
    } catch (error) {
        safeLog.error('Erro ao exportar entregadores operacional:', error);
        throw error instanceof Error ? error : new Error('Falha ao gerar arquivo Excel.');
    }
}
