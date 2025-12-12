import React from 'react';
import { DashboardResumoData } from '@/types';
import { formatarHorasParaHMS, converterHorasParaDecimal } from '@/utils/formatters';
import { getWeeklyHours } from '@/utils/comparacaoHelpers';
import { TrendingUp, Megaphone, CheckCircle2, XCircle, Target, Percent, Calendar, Clock } from 'lucide-react';
import { ComparingTableRow } from './components/ComparingTableRow';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ComparacaoTabelaDetalhadaProps {
  dadosComparacao: DashboardResumoData[];
  semanasSelecionadas: (number | string)[];
}

export const ComparacaoTabelaDetalhada: React.FC<ComparacaoTabelaDetalhadaProps> = ({
  dadosComparacao,
  semanasSelecionadas,
}) => {
  return (
    <div className="rounded-md border border-slate-200 dark:border-slate-800">
      <Table>
        <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
          <TableRow className="border-b border-slate-200 dark:border-slate-700">
            <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[200px]">
              Métrica
            </TableHead>
            {semanasSelecionadas.map((semana, idx) => (
              <React.Fragment key={semana}>
                <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700">
                  Semana {semana}
                </TableHead>
                {idx > 0 && (
                  <TableHead className="text-center text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10 w-[100px]">
                    vs S{semanasSelecionadas[idx - 1]}
                  </TableHead>
                )}
              </React.Fragment>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
          <ComparingTableRow
            label="Aderência Geral"
            icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
            data={dadosComparacao}
            getValue={(d) => d.aderencia_semanal[0]?.aderencia_percentual ?? 0}
            formatValue={(v) => (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                {v.toFixed(1)}%
              </span>
            )}
            valueClassName=""
            isEven={true}
          />

          <ComparingTableRow
            label="Corridas Ofertadas"
            icon={<Megaphone className="h-4 w-4 text-slate-500" />}
            data={dadosComparacao}
            getValue={(d) => d.total_ofertadas ?? 0}
            formatValue={(v) => v.toLocaleString('pt-BR')}
            valueClassName="text-slate-600 dark:text-slate-400"
            isEven={false}
          />

          <ComparingTableRow
            label="Corridas Aceitas"
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            data={dadosComparacao}
            getValue={(d) => d.total_aceitas ?? 0}
            formatValue={(v) => v.toLocaleString('pt-BR')}
            valueClassName="text-emerald-600 dark:text-emerald-400"
            isEven={true}
          />

          <ComparingTableRow
            label="Corridas Rejeitadas"
            icon={<XCircle className="h-4 w-4 text-rose-500" />}
            data={dadosComparacao}
            getValue={(d) => d.total_rejeitadas ?? 0}
            formatValue={(v) => v.toLocaleString('pt-BR')}
            valueClassName="text-rose-600 dark:text-rose-400"
            invertVariationColors
            isEven={false}
          />

          <ComparingTableRow
            label="Corridas Completadas"
            icon={<Target className="h-4 w-4 text-purple-500" />}
            data={dadosComparacao}
            getValue={(d) => d.total_completadas ?? 0}
            formatValue={(v) => v.toLocaleString('pt-BR')}
            valueClassName="text-purple-600 dark:text-purple-400"
            isEven={true}
          />

          <ComparingTableRow
            label="Taxa de Aceitação"
            icon={<Percent className="h-4 w-4 text-slate-500" />}
            data={dadosComparacao}
            getValue={(d) => d.total_ofertadas ? ((d.total_aceitas ?? 0) / d.total_ofertadas) * 100 : 0}
            formatValue={(v) => `${v.toFixed(1)}%`}
            showVariation={false}
            isEven={false}
          />

          <ComparingTableRow
            label="Horas Planejadas"
            icon={<Calendar className="h-4 w-4 text-amber-500" />}
            data={dadosComparacao}
            getValue={(d) => converterHorasParaDecimal(getWeeklyHours(d, 'horas_planejadas'))}
            formatValue={(v) => formatarHorasParaHMS(v)}
            valueClassName="font-mono text-amber-600 dark:text-amber-400"
            showVariation={false}
            isEven={true}
          />

          <ComparingTableRow
            label="Horas Entregues"
            icon={<Clock className="h-4 w-4 text-blue-500" />}
            data={dadosComparacao}
            getValue={(d) => converterHorasParaDecimal(getWeeklyHours(d, 'horas_entregues'))}
            formatValue={(v) => formatarHorasParaHMS(v)}
            valueClassName="font-mono text-blue-600 dark:text-blue-400"
            showVariation={false}
            isEven={false}
          />
        </TableBody>
      </Table>
    </div>
  );
};
