import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { safeLog } from '@/lib/errorHandler';
import { loadXLSX } from '@/lib/xlsxClient';
import { getDateRangeFromWeek } from '@/utils/formatters/dateUtils';
import { appendStyledJsonSheet, applyWorkbookMetadata, EXCEL_MAX_DATA_ROWS } from '@/utils/excel/workbookStyle';
import type { EntregadorMarketing } from '@/types';

interface UseMarketingExcelExportProps {
  semanaIso: string;
  organizationId: string | null;
  activeTab: 'marketing' | 'operacional';
  praca?: string | null;
}

const EXPORT_PAGE_SIZE = 1000;

async function fetchAllEntregadoresDetails(params: {
  organizationId: string | null;
  startDate: string;
  endDate: string;
  type: 'MARKETING' | 'OPERATIONAL';
  praca?: string | null;
}) {
  const { fetchEntregadoresDetails } = await import('@/components/views/entregadores/EntregadoresDataFetcher');
  const rows: EntregadorMarketing[] = [];
  const seenIds = new Set<string>();
  let expectedTotal: number | null = null;
  let offset = 0;

  do {
    const result = await fetchEntregadoresDetails({
      ...params,
      limit: EXPORT_PAGE_SIZE,
      offset,
    });

    if (expectedTotal === null) {
      expectedTotal = result.totalCount;
      if (!Number.isSafeInteger(expectedTotal) || expectedTotal < 0) {
        throw new Error('A API retornou uma quantidade inválida de entregadores para exportação.');
      }
      if (expectedTotal > EXCEL_MAX_DATA_ROWS) {
        throw new Error(`O relatório excede o limite do Excel de ${EXCEL_MAX_DATA_ROWS.toLocaleString('pt-BR')} linhas.`);
      }
    } else if (result.totalCount !== expectedTotal) {
      throw new Error('A quantidade de entregadores mudou durante a exportação. Gere o arquivo novamente.');
    }

    if (result.data.length === 0 && offset < expectedTotal) {
      throw new Error('A API retornou uma página vazia antes do fim dos dados.');
    }

    for (const row of result.data) {
      const id = String(row.id_entregador || '').trim();
      if (!id || seenIds.has(id)) {
        throw new Error('A exportação recebeu um entregador ausente ou repetido. Gere o arquivo novamente.');
      }
      seenIds.add(id);
    }

    rows.push(...result.data);
    offset += result.data.length;
  } while (expectedTotal !== null && offset < expectedTotal);

  if (expectedTotal === null || rows.length !== expectedTotal) {
    throw new Error('A exportação retornou uma quantidade diferente do total informado. Gere o arquivo novamente.');
  }

  return rows;
}

export function useMarketingExcelExport({ semanaIso, organizationId, activeTab, praca }: UseMarketingExcelExportProps) {
  const [exportLoading, setExportLoading] = useState(false);

  const getWeekRange = (iso: string) => {
    if (!iso) return { start: '', end: '' };
    const parts = iso.split('-W');
    if (parts.length !== 2) return { start: '', end: '' };
    const year = parseInt(parts[0], 10);
    const week = parseInt(parts[1], 10);
    return getDateRangeFromWeek(year, week);
  };

  const handleExport = useCallback(async () => {
    if (exportLoading) return;

    try {
      setExportLoading(true);
      const weekMatch = /^(\d{4})-W(\d{2})$/.exec(semanaIso);
      const weekNumber = weekMatch ? Number(weekMatch[2]) : 0;
      if (!weekMatch || weekNumber < 1 || weekNumber > 53) {
        throw new Error('Selecione uma semana válida antes de exportar.');
      }

      const { start, end } = getWeekRange(semanaIso);
      if (!start || !end) throw new Error('Não foi possível resolver o período da semana selecionada.');

      const XLSX = await loadXLSX();
      const { formatarHorasParaHMS } = await import('@/utils/formatters');

      const details = await fetchAllEntregadoresDetails({
        organizationId,
        startDate: start,
        endDate: end,
        type: activeTab === 'operacional' ? 'OPERATIONAL' : 'MARKETING',
        praca,
      });

      const exportData = details.map((d) => ({
        ID: d.id_entregador,
        Nome: d.nome,
        Região: d.regiao_atuacao || '--',
        'Horas Logadas': formatarHorasParaHMS(d.total_segundos / 3600),
        Ofertadas: d.total_ofertadas,
        Aceitas: d.total_aceitas,
        Concluídas: d.total_completadas,
        Rejeitadas: d.total_rejeitadas,
      }));

      const wb = XLSX.utils.book_new();
      applyWorkbookMetadata(wb, `Detalhes ${activeTab}`);
      appendStyledJsonSheet(XLSX, wb, exportData, 'Dados', {
        title: `Detalhes ${activeTab}`,
        subtitle: `${semanaIso || 'Semana não informada'} - ${praca || 'Todas as praças'}`,
        theme: activeTab === 'operacional' ? 'amber' : 'emerald',
        highlightFirstColumn: true,
      });
      appendStyledJsonSheet(XLSX, wb, [
        { Filtro: 'Organização (ID)', Valor: organizationId || 'Todas' },
        { Filtro: 'Tipo de dados', Valor: activeTab === 'operacional' ? 'Operacional' : 'Marketing' },
        { Filtro: 'Semana ISO', Valor: semanaIso },
        { Filtro: 'Data inicial', Valor: start },
        { Filtro: 'Data final', Valor: end },
        { Filtro: 'Praça', Valor: praca || 'Todas' },
      ], 'Filtros', {
        title: 'Filtros aplicados',
        theme: 'slate',
        highlightFirstColumn: true,
      });
      XLSX.writeFile(wb, `Detalhes_${activeTab}_${semanaIso}.xlsx`);
    } catch (err) {
      safeLog.error('Erro ao exportar:', err);
      toast.error(err instanceof Error ? err.message : 'Não foi possível gerar o arquivo. Tente novamente.');
    } finally {
      setExportLoading(false);
    }
  }, [semanaIso, organizationId, activeTab, praca, exportLoading]);

  return {
    exportLoading,
    handleExport,
  };
}
