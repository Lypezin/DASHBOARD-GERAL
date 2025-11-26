import React from 'react';
import { DashboardResumoData } from '@/types';
import { ViewToggleButton } from '../ViewToggleButton';
import { ComparacaoCharts } from './ComparacaoCharts';
import { VariacaoBadge } from '@/components/VariacaoBadge';
import { formatarHorasParaHMS } from '@/utils/formatters';
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
  if (!dadosComparacao.some(d => d.sub_praca && d.sub_praca.length > 0)) {
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
                {Array.from(new Set(dadosComparacao.flatMap(d => d.sub_praca?.map(sp => sp.sub_praca) ?? []))).map((subPraca) => (
                  <React.Fragment key={subPraca}>
                    <tr className="bg-purple-50/50 dark:bg-purple-900/10">
                      <td colSpan={semanasSelecionadas.length * 2} className="px-6 py-3 font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {subPraca}
                      </td>
                    </tr>

                    {/* Aderência */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          Aderência
                        </div>
                      </td>
                      {dadosComparacao.map((dados, idx) => {
                        const subPracaData = dados.sub_praca?.find(sp => sp.sub_praca === subPraca);
                        const aderencia = subPracaData?.aderencia_percentual ?? 0;
                        let variacao = null;
                        if (idx > 0) {
                          const dadosAnterior = dadosComparacao[idx - 1];
                          const subPracaDataAnterior = dadosAnterior.sub_praca?.find(sp => sp.sub_praca === subPraca);
                          const aderenciaAnterior = subPracaDataAnterior?.aderencia_percentual ?? 0;
                          variacao = aderenciaAnterior > 0 ? ((aderencia - aderenciaAnterior) / aderenciaAnterior) * 100 : 0;
                        }

                        return (
                          <React.Fragment key={idx}>
                            <td className="px-6 py-4 text-center border-l border-slate-200 dark:border-slate-700">
                              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                {aderencia.toFixed(1)}%
                              </span>
                            </td>
                            {idx > 0 && variacao !== null && (
                              <td className="px-4 py-4 text-center bg-slate-50/50 dark:bg-slate-900/50">
                                <VariacaoBadge variacao={variacao} className="px-2 py-0.5 text-xs" />
                              </td>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tr>

                    {/* Corridas Ofertadas */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Megaphone className="h-4 w-4 text-slate-500" />
                          Corridas Ofertadas
                        </div>
                      </td>
                      {dadosComparacao.map((dados, idx) => {
                        const subPracaData = dados.sub_praca?.find(sp => sp.sub_praca === subPraca);
                        const ofertadas = subPracaData?.corridas_ofertadas ?? 0;
                        let variacao = null;
                        if (idx > 0) {
                          const dadosAnterior = dadosComparacao[idx - 1];
                          const subPracaDataAnterior = dadosAnterior.sub_praca?.find(sp => sp.sub_praca === subPraca);
                          const ofertadasAnterior = subPracaDataAnterior?.corridas_ofertadas ?? 0;
                          variacao = ofertadasAnterior > 0 ? ((ofertadas - ofertadasAnterior) / ofertadasAnterior) * 100 : 0;
                        }

                        return (
                          <React.Fragment key={idx}>
                            <td className="px-6 py-4 text-center text-sm text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700">
                              {ofertadas.toLocaleString('pt-BR')}
                            </td>
                            {idx > 0 && variacao !== null && (
                              <td className="px-4 py-4 text-center bg-slate-50/50 dark:bg-slate-900/50">
                                <VariacaoBadge variacao={variacao} className="px-2 py-0.5 text-xs" />
                              </td>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tr>

                    {/* Corridas Aceitas */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          Corridas Aceitas
                        </div>
                      </td>
                      {dadosComparacao.map((dados, idx) => {
                        const subPracaData = dados.sub_praca?.find(sp => sp.sub_praca === subPraca);
                        const aceitas = subPracaData?.corridas_aceitas ?? 0;
                        let variacao = null;
                        if (idx > 0) {
                          const dadosAnterior = dadosComparacao[idx - 1];
                          const subPracaDataAnterior = dadosAnterior.sub_praca?.find(sp => sp.sub_praca === subPraca);
                          const aceitasAnterior = subPracaDataAnterior?.corridas_aceitas ?? 0;
                          variacao = aceitasAnterior > 0 ? ((aceitas - aceitasAnterior) / aceitasAnterior) * 100 : 0;
                        }

                        return (
                          <React.Fragment key={idx}>
                            <td className="px-6 py-4 text-center text-sm text-emerald-600 dark:text-emerald-400 border-l border-slate-200 dark:border-slate-700">
                              {aceitas.toLocaleString('pt-BR')}
                            </td>
                            {idx > 0 && variacao !== null && (
                              <td className="px-4 py-4 text-center bg-slate-50/50 dark:bg-slate-900/50">
                                <VariacaoBadge variacao={variacao} className="px-2 py-0.5 text-xs" />
                              </td>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tr>

                    {/* Corridas Rejeitadas */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-rose-500" />
                          Corridas Rejeitadas
                        </div>
                      </td>
                      {dadosComparacao.map((dados, idx) => {
                        const subPracaData = dados.sub_praca?.find(sp => sp.sub_praca === subPraca);
                        const rejeitadas = subPracaData?.corridas_rejeitadas ?? 0;
                        let variacao = null;
                        if (idx > 0) {
                          const dadosAnterior = dadosComparacao[idx - 1];
                          const subPracaDataAnterior = dadosAnterior.sub_praca?.find(sp => sp.sub_praca === subPraca);
                          const rejeitadasAnterior = subPracaDataAnterior?.corridas_rejeitadas ?? 0;
                          variacao = rejeitadasAnterior > 0 ? ((rejeitadas - rejeitadasAnterior) / rejeitadasAnterior) * 100 : 0;
                        }

                        return (
                          <React.Fragment key={idx}>
                            <td className="px-6 py-4 text-center text-sm text-rose-600 dark:text-rose-400 border-l border-slate-200 dark:border-slate-700">
                              {rejeitadas.toLocaleString('pt-BR')}
                            </td>
                            {idx > 0 && variacao !== null && (
                              <td className="px-4 py-4 text-center bg-slate-50/50 dark:bg-slate-900/50">
                                <VariacaoBadge variacao={variacao} className="px-2 py-0.5 text-xs" invertColors />
                              </td>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tr>

                    {/* Corridas Completadas */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-purple-500" />
                          Corridas Completadas
                        </div>
                      </td>
                      {dadosComparacao.map((dados, idx) => {
                        const subPracaData = dados.sub_praca?.find(sp => sp.sub_praca === subPraca);
                        const completadas = subPracaData?.corridas_completadas ?? 0;
                        let variacao = null;
                        if (idx > 0) {
                          const dadosAnterior = dadosComparacao[idx - 1];
                          const subPracaDataAnterior = dadosAnterior.sub_praca?.find(sp => sp.sub_praca === subPraca);
                          const completadasAnterior = subPracaDataAnterior?.corridas_completadas ?? 0;
                          variacao = completadasAnterior > 0 ? ((completadas - completadasAnterior) / completadasAnterior) * 100 : 0;
                        }

                        return (
                          <React.Fragment key={idx}>
                            <td className="px-6 py-4 text-center text-sm text-purple-600 dark:text-purple-400 border-l border-slate-200 dark:border-slate-700">
                              {completadas.toLocaleString('pt-BR')}
                            </td>
                            {idx > 0 && variacao !== null && (
                              <td className="px-4 py-4 text-center bg-slate-50/50 dark:bg-slate-900/50">
                                <VariacaoBadge variacao={variacao} className="px-2 py-0.5 text-xs" />
                              </td>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tr>

                    {/* Taxa de Aceitação */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4 text-slate-500" />
                          Taxa de Aceitação
                        </div>
                      </td>
                      {dadosComparacao.map((dados, idx) => {
                        const subPracaData = dados.sub_praca?.find(sp => sp.sub_praca === subPraca);
                        const ofertadas = subPracaData?.corridas_ofertadas ?? 0;
                        const aceitas = subPracaData?.corridas_aceitas ?? 0;
                        const taxaAceitacao = ofertadas > 0 ? (aceitas / ofertadas) * 100 : 0;

                        return (
                          <React.Fragment key={idx}>
                            <td className="px-6 py-4 text-center text-sm text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700">
                              {taxaAceitacao.toFixed(1)}%
                            </td>
                            {idx > 0 && <td className="px-4 py-4 bg-slate-50/50 dark:bg-slate-900/50"></td>}
                          </React.Fragment>
                        );
                      })}
                    </tr>

                    {/* Horas Planejadas */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-amber-500" />
                          Horas Planejadas
                        </div>
                      </td>
                      {dadosComparacao.map((dados, idx) => {
                        const subPracaData = dados.sub_praca?.find(sp => sp.sub_praca === subPraca);
                        const horasPlanejadas = subPracaData?.horas_a_entregar ?? '0';

                        return (
                          <React.Fragment key={idx}>
                            <td className="px-6 py-4 text-center font-mono text-sm text-amber-600 dark:text-amber-400 border-l border-slate-200 dark:border-slate-700">
                              {formatarHorasParaHMS(horasPlanejadas)}
                            </td>
                            {idx > 0 && <td className="px-4 py-4 bg-slate-50/50 dark:bg-slate-900/50"></td>}
                          </React.Fragment>
                        );
                      })}
                    </tr>

                    {/* Horas Entregues */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          Horas Entregues
                        </div>
                      </td>
                      {dadosComparacao.map((dados, idx) => {
                        const subPracaData = dados.sub_praca?.find(sp => sp.sub_praca === subPraca);
                        const horasEntregues = subPracaData?.horas_entregues ?? '0';

                        return (
                          <React.Fragment key={idx}>
                            <td className="px-6 py-4 text-center font-mono text-sm text-blue-600 dark:text-blue-400 border-l border-slate-200 dark:border-slate-700">
                              {formatarHorasParaHMS(horasEntregues)}
                            </td>
                            {idx > 0 && <td className="px-4 py-4 bg-slate-50/50 dark:bg-slate-900/50"></td>}
                          </React.Fragment>
                        );
                      })}
                    </tr>
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
