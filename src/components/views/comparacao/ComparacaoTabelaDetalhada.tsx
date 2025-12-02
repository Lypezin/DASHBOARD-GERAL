import React from 'react';
import { DashboardResumoData } from '@/types';
import { VariacaoBadge } from '@/components/VariacaoBadge';
import { calcularVariacaoPercentual } from '@/utils/comparacaoCalculations';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { getTimeMetric } from '@/utils/comparacaoHelpers';
import { TrendingUp, Megaphone, CheckCircle2, XCircle, Target, Percent, Calendar, Clock } from 'lucide-react';

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
          {/* Aderência */}
          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Aderência Geral
              </div>
            </td>
            {dadosComparacao.map((dados, idx) => {
              const aderencia = dados.aderencia_semanal[0]?.aderencia_percentual ?? 0;
              let variacao: number | null = null;
              if (idx > 0) {
                const aderenciaAnterior = dadosComparacao[idx - 1].aderencia_semanal[0]?.aderencia_percentual ?? 0;
                variacao = calcularVariacaoPercentual(aderenciaAnterior, aderencia);
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
              const ofertadas = dados.total_ofertadas ?? 0;
              let variacao: number | null = null;
              if (idx > 0) {
                const ofertadasAnterior = dadosComparacao[idx - 1].total_ofertadas ?? 0;
                variacao = calcularVariacaoPercentual(ofertadasAnterior, ofertadas);
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
              const aceitas = dados.total_aceitas ?? 0;
              let variacao: number | null = null;
              if (idx > 0) {
                const aceitasAnterior = dadosComparacao[idx - 1].total_aceitas ?? 0;
                variacao = calcularVariacaoPercentual(aceitasAnterior, aceitas);
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
              const rejeitadas = dados.total_rejeitadas ?? 0;
              let variacao: number | null = null;
              if (idx > 0) {
                const rejeitadasAnterior = dadosComparacao[idx - 1].total_rejeitadas ?? 0;
                variacao = calcularVariacaoPercentual(rejeitadasAnterior, rejeitadas);
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
              const completadas = dados.total_completadas ?? 0;
              let variacao: number | null = null;
              if (idx > 0) {
                const completadasAnterior = dadosComparacao[idx - 1].total_completadas ?? 0;
                variacao = calcularVariacaoPercentual(completadasAnterior, completadas);
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
              const taxaAceitacao = dados.total_ofertadas
                ? ((dados.total_aceitas ?? 0) / dados.total_ofertadas) * 100
                : 0;
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
              const horas = getTimeMetric(dados.aderencia_semanal[0], 'horas_planejadas');
              return (
                <React.Fragment key={idx}>
                  <td className="px-6 py-4 text-center font-mono text-sm text-amber-600 dark:text-amber-400 border-l border-slate-200 dark:border-slate-700">
                    {formatarHorasParaHMS(horas)}
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
              const horas = getTimeMetric(dados.aderencia_semanal[0], 'horas_entregues');
              return (
                <React.Fragment key={idx}>
                  <td className="px-6 py-4 text-center font-mono text-sm text-blue-600 dark:text-blue-400 border-l border-slate-200 dark:border-slate-700">
                    {formatarHorasParaHMS(horas)}
                  </td>
                  {idx > 0 && <td className="px-4 py-4 bg-slate-50/50 dark:bg-slate-900/50"></td>}
                </React.Fragment>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
};
