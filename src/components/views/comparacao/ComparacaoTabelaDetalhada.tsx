
import React from 'react';
import { DashboardResumoData } from '@/types';
import { formatarHorasParaHMS, converterHorasParaDecimal } from '@/utils/formatters';
import { getWeeklyHours } from '@/utils/comparacaoHelpers';
import { TrendingUp, Megaphone, CheckCircle2, XCircle, Target, Percent, Calendar, Clock } from 'lucide-react';
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
        <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/50">
          <ComparingTableRow
            label="Aderência Geral"
            icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
            data={dadosComparacao}
            getValue={(d) => d?.aderencia_semanal?.[0]?.aderencia_percentual ?? 0}
            formatValue={(v) => (
              <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-0.5 text-sm font-bold text-blue-700 dark:text-blue-300">
                {v.toFixed(1)}%
              </span>
            )}
            valueClassName=""
            isEven={true}
          />

          <ComparingTableRow
            label="Corridas Ofertadas"
            icon={<Megaphone className="h-4 w-4 text-slate-500 dark:text-slate-400" />}
            data={dadosComparacao}
            getValue={(d) => d?.total_ofertadas ?? 0}
            formatValue={(v) => v.toLocaleString('pt-BR')}
            valueClassName="text-slate-700 dark:text-slate-300 font-semibold"
            isEven={false}
          />

          <ComparingTableRow
            label="Corridas Aceitas"
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            data={dadosComparacao}
            getValue={(d) => d?.total_aceitas ?? 0}
            formatValue={(v) => v.toLocaleString('pt-BR')}
            valueClassName="text-emerald-700 dark:text-emerald-300 font-semibold"
            isEven={true}
          />

          <ComparingTableRow
            label="Corridas Rejeitadas"
            icon={<XCircle className="h-4 w-4 text-rose-500" />}
            data={dadosComparacao}
            getValue={(d) => d?.total_rejeitadas ?? 0}
            formatValue={(v) => v.toLocaleString('pt-BR')}
            valueClassName="text-rose-700 dark:text-rose-300 font-semibold"
            invertVariationColors
            isEven={false}
          />

          <ComparingTableRow
            label="Corridas Completadas"
            icon={<Target className="h-4 w-4 text-purple-500" />}
            data={dadosComparacao}
            getValue={(d) => d?.total_completadas ?? 0}
            formatValue={(v) => v.toLocaleString('pt-BR')}
            valueClassName="text-purple-700 dark:text-purple-300 font-semibold"
            isEven={true}
          />

          <ComparingTableRow
            label="Taxa de Aceitação"
            icon={<Percent className="h-4 w-4 text-slate-500 dark:text-slate-400" />}
            data={dadosComparacao}
            getValue={(d) => d?.total_ofertadas ? ((d.total_aceitas ?? 0) / d.total_ofertadas) * 100 : 0}
            formatValue={(v) => `${v.toFixed(1)}%`}
            valueClassName="text-slate-700 dark:text-slate-300 font-semibold"
            showVariation={false}
            isEven={false}
          />

          <ComparingTableRow
            label="Horas Planejadas"
            icon={<Calendar className="h-4 w-4 text-amber-500" />}
            data={dadosComparacao}
            getValue={(d) => converterHorasParaDecimal(getWeeklyHours(d, 'horas_planejadas'))}
            formatValue={(v) => formatarHorasParaHMS(v)}
            valueClassName="font-mono text-amber-700 dark:text-amber-300 font-semibold"
            showVariation={false}
            isEven={true}
          />

          <ComparingTableRow
            label="Horas Entregues"
            icon={<Clock className="h-4 w-4 text-blue-500" />}
            data={dadosComparacao}
            getValue={(d) => converterHorasParaDecimal(getWeeklyHours(d, 'horas_entregues'))}
            formatValue={(v) => formatarHorasParaHMS(v)}
            valueClassName="font-mono text-blue-700 dark:text-blue-300 font-semibold"
            showVariation={false}
            isEven={false}
          />
        </TableBody>
      </Table>
    </div>
  );
};
