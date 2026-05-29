import { UtrData, UtrGeral } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { loadXLSX } from '@/lib/xlsxClient';
import { formatarHorasParaHMS } from '@/utils/formatters';

const IS_DEV = process.env.NODE_ENV === 'development';

// Helper local para formatação
const formatarPorcentagem = (valor: number | undefined) => {
    return ((valor || 0) / 100).toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: 1 });
};

const formatarMoeda = (valor: number | undefined) => {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatarNumero = (valor: number | undefined) => {
    return (valor || 0).toLocaleString('pt-BR');
};

const formatarDecimal = (valor: number | undefined) => {
    return (valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export async function exportarUtrParaExcel(utrData: UtrData): Promise<void> {
    try {
        const XLSX = await loadXLSX();
        const wb = XLSX.utils.book_new();

        // 1. Aba: Resumo Geral
        if (utrData.geral) {
            const g = utrData.geral;
            const resumoData = [{
                'Tempo Total (h)': formatarDecimal(g.tempo_horas),
                'Corridas': formatarNumero(g.corridas),
                'UTR Score': formatarDecimal(g.utr)
            }];
            const wsResumo = XLSX.utils.json_to_sheet(resumoData);
            XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Geral');
        }

        // Helper para gerar abas detalhadas
        const exportarSecao = (dados: any[], nomeAba: string, campoChave: string, labelChave: string) => {
            if (!dados || dados.length === 0) return;

            const dadosFormatados = dados.map(item => ({
                [labelChave]: item[campoChave] || 'N/A',
                'Tempo Total (h)': formatarDecimal(item.tempo_horas),
                'Corridas': formatarNumero(item.corridas),
                'UTR Score': formatarDecimal(item.utr)
            }));
            const ws = XLSX.utils.json_to_sheet(dadosFormatados);
            XLSX.utils.book_append_sheet(wb, ws, nomeAba);
        };

        // 2. Aba: Por Praça
        exportarSecao(utrData.praca || utrData.por_praca || [], 'Por Praça', 'praca', 'Praça');

        // 3. Aba: Por Sub-Praça
        exportarSecao(utrData.sub_praca || utrData.por_sub_praca || [], 'Por Sub-Praça', 'sub_praca', 'Sub-Praça');

        // 4. Aba: Por Origem
        exportarSecao(utrData.origem || utrData.por_origem || [], 'Por Origem', 'origem', 'Origem');

        // 5. Aba: Por Turno
        exportarSecao(utrData.turno || utrData.por_turno || [], 'Por Turno', 'turno', 'Turno');


        // Gerar Nome do Arquivo
        const agora = new Date();
        const dataHora = agora.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
        const nomeArquivo = `utr_dashboard_${dataHora}.xlsx`;

        // Download
        XLSX.writeFile(wb, nomeArquivo);

        if (IS_DEV) safeLog.info(`✅ UTR exportada: ${nomeArquivo}`);

    } catch (error) {
        safeLog.error('Erro ao exportar UTR:', error);
        throw new Error('Falha ao gerar arquivo Excel da UTR.');
    }
}
