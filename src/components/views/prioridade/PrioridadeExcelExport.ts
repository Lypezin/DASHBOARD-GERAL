import { Entregador } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { loadXLSX } from '@/lib/xlsxClient';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function exportarPrioridadeParaExcel(
    entregadores: Entregador[]
): Promise<void> {
    try {
        // Carregar xlsx dinamicamente
        const XLSX = await loadXLSX();

        // Preparar dados para exportação
        const dadosExportacao = entregadores.map((entregador) => {
            const percentualAceitas = entregador.corridas_ofertadas > 0
                ? (entregador.corridas_aceitas / entregador.corridas_ofertadas) * 100
                : 0;

            const percentualCompletadas = entregador.corridas_aceitas > 0
                ? (entregador.corridas_completadas / entregador.corridas_aceitas) * 100
                : 0;

            return {
                'ID Entregador': entregador.id_entregador,
                'Nome': entregador.nome_entregador,
                'Ofertadas': entregador.corridas_ofertadas,
                'Aceitas': entregador.corridas_aceitas,
                '% Aceitas': `${percentualAceitas.toFixed(2)}%`,
                'Completadas': entregador.corridas_completadas,
                '% Completadas': `${percentualCompletadas.toFixed(2)}%`,
                'Rejeitadas': entregador.corridas_rejeitadas,
                '% Aderência': `${entregador.aderencia_percentual.toFixed(2)}%`,
                '% Rejeição': `${entregador.rejeicao_percentual.toFixed(2)}%`,
            };
        });

        // Criar workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dadosExportacao);

        // Ajustar largura das colunas
        const colWidths = [
            { wch: 36 }, // ID Entregador
            { wch: 40 }, // Nome
            { wch: 15 }, // Ofertadas
            { wch: 15 }, // Aceitas
            { wch: 15 }, // % Aceitas
            { wch: 15 }, // Completadas
            { wch: 15 }, // % Completadas
            { wch: 15 }, // Rejeitadas
            { wch: 15 }, // % Aderência
            { wch: 15 }, // % Rejeição
        ];
        ws['!cols'] = colWidths;

        // Adicionar worksheet ao workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Prioridade');

        // Gerar nome do arquivo com data/hora
        const agora = new Date();
        const dataHora = agora.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
        const nomeArquivo = `prioridade_promo_${dataHora}.xlsx`;

        // Exportar arquivo
        XLSX.writeFile(wb, nomeArquivo);

        if (IS_DEV) {
            safeLog.info(`✅ Arquivo Excel exportado: ${nomeArquivo} (${dadosExportacao.length} registros)`);
        }
    } catch (err: unknown) {
        safeLog.error('Erro ao exportar para Excel:', err);
        throw new Error('Erro ao exportar dados para Excel. Por favor, tente novamente.');
    }
}
