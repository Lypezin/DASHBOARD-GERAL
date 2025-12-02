import React from 'react';
import { DashboardResumoData } from '@/types';
import { VariacaoBadge } from '@/components/VariacaoBadge';
import { DIAS_DA_SEMANA } from '@/constants/comparacao';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { findDayData } from '@/utils/comparacaoHelpers';

interface ComparacaoDiaTableProps {
  dadosComparacao: DashboardResumoData[];
  semanasSelecionadas: string[];
}

export const ComparacaoDiaTable: React.FC<ComparacaoDiaTableProps> = ({
  dadosComparacao,
  semanasSelecionadas,
}) => {
  // Debug logging
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ComparacaoDiaTable - dadosComparacao:', dadosComparacao);
      dadosComparacao.forEach((d, i) => {
        console.log(`Semana ${semanasSelecionadas[i]} - Dias Raw:`, d.dia?.map(dia => ({
          dia_da_semana: dia.dia_da_semana,
          dia_iso: dia.dia_iso
        })));
      });
    }
  }, [dadosComparacao, semanasSelecionadas]);

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Análise por Dia da Semana
            </CardTitle>
          </div>
          <CardDescription className="mt-1 text-slate-500 dark:text-slate-400">
            Distribuição de corridas e variações por dia da semana
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th rowSpan={2} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 align-middle border-r border-slate-200 dark:border-slate-700">
                  Dia
                </th>
                <th rowSpan={2} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 align-middle">
                  Métrica
                </th>
                {semanasSelecionadas.map((semana, idx) => (
                  <th
                    key={`header-${semana}`}
                    colSpan={idx === 0 ? 1 : 2}
                    className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700"
                  >
                    Semana {semana}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {semanasSelecionadas.map((semana, idx) =>
                  idx === 0 ? (
                    <th key={`sub-${semana}-valor`} className="px-4 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700">
                      Valor
                    </th>
                  ) : (
                    <React.Fragment key={`sub-${semana}`}>
                      <th className="px-4 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700">
                        Valor
                      </th>
                      <th className="px-4 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Δ%
                      </th>
                    </React.Fragment>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {DIAS_DA_SEMANA.map((dia, diaIdx) => {
                const metricas = [
                  { label: 'Ofertadas', key: 'corridas_ofertadas', color: 'text-slate-600 dark:text-slate-400' },
                  { label: 'Aceitas', key: 'corridas_aceitas', color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Rejeitadas', key: 'corridas_rejeitadas', color: 'text-rose-600 dark:text-rose-400' },
                  { label: 'Completadas', key: 'corridas_completadas', color: 'text-blue-600 dark:text-blue-400' },
                ];

                return metricas.map((metrica, metricaIdx) => (
                  <tr key={`${dia}-${metrica.key}`} className={diaIdx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-900/50'}>
                    {metricaIdx === 0 && (
                      <td rowSpan={4} className="px-4 py-3 text-center font-medium text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20">
                        {dia}
                      </td>
                    )}
                    <td className={`px-4 py-2 text-center text-sm font-medium ${metrica.color}`}>{metrica.label}</td>
                    {dadosComparacao.map((dados, idx) => {
                      // Usar helper para encontrar dados do dia
                      const diaData = findDayData(dia, dados.aderencia_dia);
                      const valor = diaData?.[metrica.key as keyof typeof diaData] as number ?? 0;

                      let variacao = null;
                      if (idx > 0) {
                        const dadosAnterior = dadosComparacao[idx - 1];
                        const diaDataAnterior = findDayData(dia, dadosAnterior.aderencia_dia);
                        const valorAnterior = diaDataAnterior?.[metrica.key as keyof typeof diaDataAnterior] as number ?? 0;
                        variacao = valorAnterior > 0 ? ((valor - valorAnterior) / valorAnterior) * 100 : 0;
                      }

                      return (
                        <React.Fragment key={idx}>
                          <td className={`px-4 py-2 text-center font-medium ${metrica.color} border-l border-slate-200 dark:border-slate-700`}>
                            {typeof valor === 'number' ? valor.toLocaleString('pt-BR') : '0'}
                          </td>
                          {idx > 0 && variacao !== null && (
                            <td className="px-4 py-2 text-center text-xs font-bold">
                              <VariacaoBadge variacao={variacao} className="px-2 py-0.5" />
                            </td>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
