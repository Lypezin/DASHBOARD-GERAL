import { ValoresEntregador } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { loadXLSX } from '@/lib/xlsxClient';

const IS_DEV = process.env.NODE_ENV === 'development';

const formatarMoeda = (valor: number | undefined) => {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export async function exportarValoresParaExcel(valoresData: ValoresEntregador[]): Promise<void> {
    try {
        const XLSX = await loadXLSX();
        const wb = XLSX.utils.book_new();

        if (valoresData && valoresData.length > 0) {
            const dadosExportacao = valoresData.map(v => ({
                'ID Entregador': v.id_entregador,
                'Nome': v.nome,
                'Valor Total': formatarMoeda(v.valor_total),
                'Corridas': v.qtd_corridas,
                'Ticket Médio': formatarMoeda(v.valor_total / (v.qtd_corridas || 1))
            }));

            const ws = XLSX.utils.json_to_sheet(dadosExportacao);

            // Ajustar colunas
            const colWidths = [
                { wch: 15 }, // ID
                { wch: 35 }, // Nome
                { wch: 15 }, // Valor
                { wch: 10 }, // Corridas
                { wch: 15 }  // Ticket Medio
            ];
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, 'Valores');
        }

        // Gerar Nome do Arquivo
        const agora = new Date();
        const dataHora = agora.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
        const nomeArquivo = `valores_entregadores_${dataHora}.xlsx`;

        // Download
        XLSX.writeFile(wb, nomeArquivo);

        if (IS_DEV) safeLog.info(`✅ Valores exportados: ${nomeArquivo}`);

    } catch (error) {
        safeLog.error('Erro ao exportar valores:', error);
        throw new Error('Falha ao gerar arquivo Excel de Valores.');
    }
}
