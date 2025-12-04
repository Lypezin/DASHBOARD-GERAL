import React from 'react';
import { DashboardResumoData } from '@/types';
import { ViewToggleButton } from '../ViewToggleButton';
import { ComparacaoCharts } from './ComparacaoCharts';
import { VariacaoBadge } from '@/components/VariacaoBadge';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { ComparacaoMetricRow } from './ComparacaoMetricRow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, TrendingUp, Megaphone, CheckCircle2, XCircle, Target, Percent, Calendar, Clock } from 'lucide-react';

interface ComparacaoSubPracaSectionProps {
  dadosComparacao: DashboardResumoData[];
  semanasSelecionadas: string[];
  viewMode: 'table' | 'chart';
  onViewModeChange: (mode: 'table' | 'chart') => void;
}

export const ComparacaoSubPracaSection: React.FC<ComparacaoSubPracaSectionProps> = ({
  dadosComparacao,
  semanasSelecionadas,
  viewMode,
  onViewModeChange,
}) => {
  // Use aderencia_sub_praca (main) with fallback to sub_praca (alias)
  if (!dadosComparacao.some(d => (d.aderencia_sub_praca && d.aderencia_sub_praca.length > 0) || (d.sub_praca && d.sub_praca.length > 0))) {
    return null;
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Comparação Detalhada por Sub-Praça
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <ViewToggleButton
              active={viewMode === 'table'}
              onClick={() => onViewModeChange('table')}
              label="Tabela"
            />
            <ViewToggleButton
              active={viewMode === 'chart'}
              onClick={() => onViewModeChange('chart')}
              label="Gráfico"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sub-Praça / Métrica</th>
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
                {Array.from(new Set(dadosComparacao.flatMap(d => (d.aderencia_sub_praca || d.sub_praca || []).map(sp => sp.sub_praca)))).map((subPraca) => (
                  <React.Fragment key={subPraca}>
                    <tr className="bg-purple-50/50 dark:bg-purple-900/10">
                      <td colSpan={semanasSelecionadas.length * 2} className="px-6 py-3 font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {subPraca}
                      </td>
                    </tr>

                    <ComparacaoMetricRow
                      label="Aderência"
                      icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
                      dadosComparacao={dadosComparacao}
                      subPraca={subPraca}
                      getValue={(d) => d.aderencia_percentual ?? 0}
                      formatValue={(v) => (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                          {Number(v).toFixed(1)}%
                        </span>
                      )}
                    />

                    <ComparacaoMetricRow
                      label="Corridas Ofertadas"
                      icon={<Megaphone className="h-4 w-4 text-slate-500" />}
                      dadosComparacao={dadosComparacao}
                      subPraca={subPraca}
                      getValue={(d) => d.corridas_ofertadas ?? 0}
                      formatValue={(v) => Number(v).toLocaleString('pt-BR')}
                    />

                    <ComparacaoMetricRow
                      label="Corridas Aceitas"
                      icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      dadosComparacao={dadosComparacao}
                      subPraca={subPraca}
                      getValue={(d) => d.corridas_aceitas ?? 0}
                      formatValue={(v) => Number(v).toLocaleString('pt-BR')}
                      valueClassName="text-emerald-600 dark:text-emerald-400"
                    />

                    <ComparacaoMetricRow
                      label="Corridas Rejeitadas"
                      icon={<XCircle className="h-4 w-4 text-rose-500" />}
                      dadosComparacao={dadosComparacao}
                      subPraca={subPraca}
                      getValue={(d) => d.corridas_rejeitadas ?? 0}
                      formatValue={(v) => Number(v).toLocaleString('pt-BR')}
                      valueClassName="text-rose-600 dark:text-rose-400"
                      invertVariationColors
                    />

                    <ComparacaoMetricRow
                      label="Corridas Completadas"
                      icon={<Target className="h-4 w-4 text-purple-500" />}
                      dadosComparacao={dadosComparacao}
                      subPraca={subPraca}
                      getValue={(d) => d.corridas_completadas ?? 0}
                      formatValue={(v) => Number(v).toLocaleString('pt-BR')}
                      valueClassName="text-purple-600 dark:text-purple-400"
                    />

                    <ComparacaoMetricRow
                      label="Taxa de Aceitação"
                      icon={<Percent className="h-4 w-4 text-slate-500" />}
                      dadosComparacao={dadosComparacao}
                      subPraca={subPraca}
                      getValue={(d) => {
                        const ofertadas = d.corridas_ofertadas ?? 0;
                        const aceitas = d.corridas_aceitas ?? 0;
                        return ofertadas > 0 ? (aceitas / ofertadas) * 100 : 0;
                      }}
                      formatValue={(v) => `${Number(v).toFixed(1)}%`}
                      showVariation={false}
                    />

                    <ComparacaoMetricRow
                      label="Horas Planejadas"
                      icon={<Calendar className="h-4 w-4 text-amber-500" />}
                      dadosComparacao={dadosComparacao}
                      subPraca={subPraca}
                      getValue={(d) => d.horas_a_entregar ?? 0} // Assuming string or number, handled by formatarHorasParaHMS
                      formatValue={(v) => formatarHorasParaHMS(v)}
                      valueClassName="font-mono text-amber-600 dark:text-amber-400"
                      showVariation={false}
                    />

                    <ComparacaoMetricRow
                      label="Horas Entregues"
                      icon={<Clock className="h-4 w-4 text-blue-500" />}
                      dadosComparacao={dadosComparacao}
                      subPraca={subPraca}
                      getValue={(d) => d.horas_entregues ?? 0}
                      formatValue={(v) => formatarHorasParaHMS(v)}
                      valueClassName="font-mono text-blue-600 dark:text-blue-400"
                      showVariation={false}
                    />

                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <ComparacaoCharts
              dadosComparacao={dadosComparacao}
              semanasSelecionadas={semanasSelecionadas}
              viewMode={viewMode}
              chartType="subPraca"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
