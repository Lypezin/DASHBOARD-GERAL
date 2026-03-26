import { EntregadorMarketing } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { loadXLSX } from '@/lib/xlsxClient';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function exportarEntregadoresParaExcel(
  entregadores: EntregadorMarketing[],
  formatarSegundosParaHoras: (segundos: number) => string
): Promise<void> {
  try {
    // Carregar xlsx dinamicamente
    const XLSX = await loadXLSX();

    // Preparar dados para exportação
    const dadosExportacao = entregadores.map((entregador) => ({
      'ID Entregador': entregador.id_entregador,
      'Nome': entregador.nome,
      'Cidade': entregador.regiao_atuacao || 'N/A',
      'Total Ofertadas': entregador.total_ofertadas,
      'Total Aceitas': entregador.total_aceitas,
      'Total Completadas': entregador.total_completadas,
      'Total Rejeitadas': entregador.total_rejeitadas,
      'Horas (HH:MM:SS)': formatarSegundosParaHoras(entregador.total_segundos || 0),
      'Última Data': entregador.ultima_data || 'N/A',
      'Dias sem Rodar': entregador.dias_sem_rodar === null || entregador.dias_sem_rodar === undefined
        ? 'N/A'
        : entregador.dias_sem_rodar === 0
          ? 'Hoje'
          : `${entregador.dias_sem_rodar} dia${entregador.dias_sem_rodar !== 1 ? 's' : ''}`,
      'Rodando': entregador.total_completadas > 30 ? 'SIM' : 'NÃO',
    }));

    // Criar workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dadosExportacao);

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 36 }, // ID Entregador
      { wch: 40 }, // Nome
      { wch: 30 }, // Cidade
      { wch: 15 }, // Total Ofertadas
      { wch: 15 }, // Total Aceitas
      { wch: 18 }, // Total Completadas
      { wch: 18 }, // Total Rejeitadas
      { wch: 15 }, // Horas
      { wch: 12 }, // Última Data
      { wch: 15 }, // Dias sem Rodar
      { wch: 12 }, // Rodando
    ];
    ws['!cols'] = colWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Entregadores');

    // Gerar nome do arquivo com data/hora
    const agora = new Date();
    const dataHora = agora.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    const nomeArquivo = `entregadores_marketing_${dataHora}.xlsx`;

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

