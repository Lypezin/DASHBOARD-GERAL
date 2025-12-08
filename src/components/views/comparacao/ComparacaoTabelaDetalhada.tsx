import React from 'react';
import { DashboardResumoData } from '@/types';
import { formatarHorasParaHMS, converterHorasParaDecimal } from '@/utils/formatters';
import { getWeeklyHours } from '@/utils/comparacaoHelpers';
import { TrendingUp, Megaphone, CheckCircle2, XCircle, Target, Percent, Calendar, Clock } from 'lucide-react';
import { ComparingTableRow } from './components/ComparingTableRow';

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
      <table className="w-full">
        <thead className="bg-slate-50 dark:bg-slate-800/50">
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Métrica
            </th>
            {semanasSelecionadas.map((semana, idx) => (
              <React.Fragment key={semana}>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700">
                  Semana {semana}
                </th>
                {idx > 0 && (
                  <th className="px-4 py-4 text-center text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10">
                    Δ% vs S{semanasSelecionadas[idx - 1]}
                  </th>
                )}
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
          />

          <ComparingTableRow
            label="Corridas Ofertadas"
            icon={<Megaphone className="h-4 w-4 text-slate-500" />}
            data={dadosComparacao}
            getValue={(d) => d.total_ofertadas ?? 0}
            formatValue={(v) => v.toLocaleString('pt-BR')}
            valueClassName="text-slate-600 dark:text-slate-400"
          />

          <ComparingTableRow
            label="Corridas Aceitas"
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            data={dadosComparacao}
            getValue={(d) => d.total_aceitas ?? 0}
            formatValue={(v) => v.toLocaleString('pt-BR')}
            valueClassName="text-emerald-600 dark:text-emerald-400"
          />

          <ComparingTableRow
            label="Corridas Rejeitadas"
            icon={<XCircle className="h-4 w-4 text-rose-500" />}
            data={dadosComparacao}
            getValue={(d) => d.total_rejeitadas ?? 0}
            formatValue={(v) => v.toLocaleString('pt-BR')}
            valueClassName="text-rose-600 dark:text-rose-400"
            invertVariationColors
          />

          <ComparingTableRow
            label="Corridas Completadas"
            icon={<Target className="h-4 w-4 text-purple-500" />}
            data={dadosComparacao}
            getValue={(d) => d.total_completadas ?? 0}
            formatValue={(v) => v.toLocaleString('pt-BR')}
            valueClassName="text-purple-600 dark:text-purple-400"
          />

          <ComparingTableRow
            label="Taxa de Aceitação"
            icon={<Percent className="h-4 w-4 text-slate-500" />}
            data={dadosComparacao}
            getValue={(d) => d.total_ofertadas ? ((d.total_aceitas ?? 0) / d.total_ofertadas) * 100 : 0}
            formatValue={(v) => `${v.toFixed(1)}%`}
            showVariation={false}
          />

          <ComparingTableRow
            label="Horas Planejadas"
            icon={<Calendar className="h-4 w-4 text-amber-500" />}
            data={dadosComparacao}
            getValue={(d) => converterHorasParaDecimal(getWeeklyHours(d, 'horas_planejadas'))}
            formatValue={(v) => formatarHorasParaHMS(v)}
            valueClassName="font-mono text-amber-600 dark:text-amber-400"
            showVariation={false}
          />

          <ComparingTableRow
            label="Horas Entregues"
            icon={<Clock className="h-4 w-4 text-blue-500" />}
            data={dadosComparacao}
            getValue={(d) => converterHorasParaDecimal(getWeeklyHours(d, 'horas_entregues'))}
            formatValue={(v) => formatarHorasParaHMS(v)}
            valueClassName="font-mono text-blue-600 dark:text-blue-400"
            showVariation={false}
          />
        </tbody>
      </table>
    </div>
  );
};
