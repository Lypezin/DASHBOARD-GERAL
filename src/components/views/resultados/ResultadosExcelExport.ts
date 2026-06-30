import { loadXLSX } from '@/lib/xlsxClient';
import { appendStyledJsonSheet, applyWorkbookMetadata } from '@/utils/excel/workbookStyle';
import { AtendenteData } from './AtendenteCard';

export const handleExportExcelResultados = async (
    dadosResultados: AtendenteData[],
    dataAgregacao: string,
    showToast?: (t: { title: string, variant: 'success' | 'destructive' }) => void
) => {
    if (!dadosResultados || dadosResultados.length === 0) {
        alert('Sem dados para exportar.');
        return;
    }

    const excelData = dadosResultados.map((atendente) => {
        const conversao = atendente.enviado > 0
            ? (atendente.liberado / atendente.enviado) * 100
            : 0;

        return {
            Atendente: atendente.nome,
            Enviados: atendente.enviado,
            Liberados: atendente.liberado,
            'Conversão (%)': Number(conversao.toFixed(2)),
            'Custo p/ Liberado (R$)': Number((atendente.custoPorLiberado || 0).toFixed(2)),
            'Total Gasto (R$)': Number((atendente.valorTotal || 0).toFixed(2)),
        };
    });

    const XLSX = await loadXLSX();
    const workbook = XLSX.utils.book_new();
    applyWorkbookMetadata(workbook, 'Resultados por atendente');
    appendStyledJsonSheet(XLSX, workbook, excelData, 'Resultados', {
        title: 'Resultados por atendente',
        subtitle: `Data de agregação: ${dataAgregacao || '-'}`,
        theme: 'green',
        highlightFirstColumn: true,
    });

    const safeDate = dataAgregacao || new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Resultados_${safeDate}.xlsx`);

    if (showToast) {
        showToast({ title: 'Excel exportado com sucesso.', variant: 'success' });
    }
};
