import * as XLSX from 'xlsx';
import { formatNumber, formatPercent } from '@/utils/formatters';
import { AtendenteData } from './AtendenteCard';

export const exportarResultadosParaExcel = (atendentes: AtendenteData[]) => {
    if (!atendentes || atendentes.length === 0) {
        alert("Sem dados para exportar.");
        return;
    }

    const exportData = atendentes.map((atendente) => {
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

    const worksheet = XLSX.utils.json_to_sheet(exportData);
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

    const dataAgregacao = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Resultados_${dataAgregacao}.xlsx`);
};
