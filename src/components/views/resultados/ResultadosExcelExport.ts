import { loadXLSX } from '@/lib/xlsxClient';
import { formatNumber, formatPercent } from '@/utils/formatters';
import { AtendenteData } from './AtendenteCard';

export const handleExportExcelResultados = async (dadosResultados: AtendenteData[], dataAgregacao: string, showToast?: (t: { title: string, variant: 'success' | 'destructive' }) => void) => {
    if (!dadosResultados || dadosResultados.length === 0) {
        alert("Sem dados para exportar.");
        return;
    }

    const excelData = dadosResultados.map((atendente) => {
        const conversao = atendente.enviado > 0
            ? (atendente.liberado / atendente.enviado) * 100
            : 0;

        return {
            "Atendente": atendente.nome,
            "Enviados": atendente.enviado,
            "Liberados": atendente.liberado,
            "Conversão (%)": Number(conversao.toFixed(2)),
            "Custo p/ Liberado (R$)": Number((atendente.custoPorLiberado || 0).toFixed(2)),
            "Total Gasto (R$)": Number((atendente.valorTotal || 0).toFixed(2)),
        };
    });

    const XLSX = await loadXLSX();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    // Setup columns width
    const colWidths = [
        { wch: 20 }, // Atendente
        { wch: 10 }, // Enviados
        { wch: 10 }, // Liberados
        { wch: 15 }, // Conversão (%)
        { wch: 20 }, // Custo p/ Liberado (R$)
        { wch: 15 }, // Total Gasto (R$)
    ];
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados");

    const safeDate = dataAgregacao || new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Resultados_${safeDate}.xlsx`);
};
