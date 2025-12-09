import { Entregador } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { loadXLSX } from '@/lib/xlsxClient';
import { calcularPercentualAceitas, calcularPercentualCompletadas } from './EntregadoresUtils';

const IS_DEV = process.env.NODE_ENV === 'development';

const formatarPorcentagem = (valor: number) => {
    return (valor / 100).toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: 1 });
};

export async function exportarEntregadoresMainParaExcel(entregadores: Entregador[]): Promise<void> {
    try {
        const XLSX = await loadXLSX();
        const wb = XLSX.utils.book_new();

        if (entregadores && entregadores.length > 0) {
            const dadosExportacao = entregadores.map(e => ({
                'ID Entregador': e.id_entregador,
                'Nome': e.nome_entregador,
                'Ofertadas': e.corridas_ofertadas,
                'Aceitas': e.corridas_aceitas,
                'Rejeitadas': e.corridas_rejeitadas,
                'Completadas': e.corridas_completadas,
                '% Aceitação': formatarPorcentagem(calcularPercentualAceitas(e)),
                '% Completude': formatarPorcentagem(calcularPercentualCompletadas(e)),
                '% Aderência': formatarPorcentagem(e.aderencia_percentual),
                '% Rejeição': formatarPorcentagem(e.rejeicao_percentual)
            }));

            const ws = XLSX.utils.json_to_sheet(dadosExportacao);

            // Ajustar colunas
            const colWidths = [
                { wch: 15 }, // ID
                { wch: 35 }, // Nome
                { wch: 10 }, // Ofertadas
                { wch: 10 }, // Aceitas
                { wch: 10 }, // Rejeitadas
                { wch: 10 }, // Completadas
                { wch: 15 }, // % Aceitacao
                { wch: 15 }, // % Completude
                { wch: 15 }, // % Aderencia
                { wch: 15 }, // % Rejeicao
            ];
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, 'Entregadores Operacional');
        }

        // Gerar Nome do Arquivo
        const agora = new Date();
        const dataHora = agora.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
        const nomeArquivo = `entregadores_operacional_${dataHora}.xlsx`;

        // Download
        XLSX.writeFile(wb, nomeArquivo);

        if (IS_DEV) safeLog.info(`✅ Entregadores Operacional exportado: ${nomeArquivo}`);

    } catch (error) {
        safeLog.error('Erro ao exportar entregadores operacional:', error);
        throw new Error('Falha ao gerar arquivo Excel.');
    }
}
