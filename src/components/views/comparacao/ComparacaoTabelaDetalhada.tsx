
import React from 'react';
import { DashboardResumoData } from '@/types';
import { formatarHorasParaHMS, converterHorasParaDecimal } from '@/utils/formatters';
import { getWeeklyHours } from '@/utils/comparacaoHelpers';
import { ComparingTableRow } from './components/ComparingTableRow';
import { ComparacaoTabelaHeader } from './components/ComparacaoTabelaHeader';
import { Table, TableBody } from '@/components/ui/table';

interface ComparacaoTabelaDetalhadaProps {
  dadosComparacao: DashboardResumoData[];
  semanasSelecionadas: (number | string)[];
}

export const ComparacaoTabelaDetalhada: React.FC<ComparacaoTabelaDetalhadaProps> = ({
  dadosComparacao,
  semanasSelecionadas,
}) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <ComparacaoTabelaHeader semanasSelecionadas={semanasSelecionadas} />
        <TableBody>
          <ComparingTableRow
            label="Aderência Geral"
            data={dadosComparacao}
            getValue={(d) => d?.aderencia_semanal?.[0]?.aderencia_percentual ?? 0}
            formatValue={(v) => (
              <span className={`tabular-nums font-semibold ${v >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                  v >= 80 ? 'text-blue-600 dark:text-blue-400' :
                    v >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                }`}>
                {v.toFixed(1)}%
              </span>
            )}
            isEven={true}
          />
          <ComparingTableRow
            label="Corridas Ofertadas"
            data={dadosComparacao}
            getValue={(d) => d?.total_ofertadas ?? 0}
            formatValue={(v) => v.toLocaleString('pt-BR')}
            isEven={false}
          />
          <ComparingTableRow
            label="Corridas Aceitas"
            data={dadosComparacao}
            getValue={(d) => d?.total_aceitas ?? 0}
            formatValue={(v) => v.toLocaleString('pt-BR')}
            isEven={true}
          />
          <ComparingTableRow
            label="Corridas Rejeitadas"
            data={dadosComparacao}
            getValue={(d) => d?.total_rejeitadas ?? 0}
            formatValue={(v) => v.toLocaleString('pt-BR')}
            invertVariationColors
            isEven={false}
          />
          <ComparingTableRow
            label="Corridas Completadas"
            data={dadosComparacao}
            getValue={(d) => d?.total_completadas ?? 0}
            formatValue={(v) => v.toLocaleString('pt-BR')}
            isEven={true}
          />
          <ComparingTableRow
            label="Taxa de Aceitação"
            data={dadosComparacao}
            getValue={(d) => d?.total_ofertadas ? ((d.total_aceitas ?? 0) / d.total_ofertadas) * 100 : 0}
            formatValue={(v) => `${v.toFixed(1)}%`}
            showVariation={false}
            isEven={false}
          />
          <ComparingTableRow
            label="Horas Planejadas"
            data={dadosComparacao}
            getValue={(d) => converterHorasParaDecimal(getWeeklyHours(d, 'horas_planejadas'))}
            formatValue={(v) => formatarHorasParaHMS(v)}
            valueClassName="font-mono tabular-nums"
            showVariation={false}
            isEven={true}
          />
          <ComparingTableRow
            label="Horas Entregues"
            data={dadosComparacao}
            getValue={(d) => converterHorasParaDecimal(getWeeklyHours(d, 'horas_entregues'))}
            formatValue={(v) => formatarHorasParaHMS(v)}
            valueClassName="font-mono tabular-nums"
            showVariation={false}
            isEven={false}
          />
        </TableBody>
      </Table>
    </div>
  );
};
