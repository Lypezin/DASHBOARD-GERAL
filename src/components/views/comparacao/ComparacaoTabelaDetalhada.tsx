import React from 'react';
import { DashboardResumoData } from '@/types';
import { VariacaoBadge } from '@/components/VariacaoBadge';
import { calcularVariacaoPercentual } from '@/utils/comparacaoCalculations';
import { formatarHorasParaHMS, converterHorasParaDecimal } from '@/utils/formatters';

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
            <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Métrica
            </th>
            {semanasSelecionadas.map((semana, idx) => (
              <React.Fragment key={semana}>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-l-2 border-slate-300 dark:border-slate-600">
                  Semana {semana}
                </th>
                {idx > 0 && (
                  <th className="px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30">
                    Δ% vs S{semanasSelecionadas[idx - 1]}
                  </th>
                )}
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {/* Aderência */}
          <tr className="bg-blue-50/50 dark:bg-blue-950/20">
            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
              <div className="flex items-center gap-2">
                <span className="text-lg">📈</span>
                Aderência Geral
              </div>
            </td>
            {dadosComparacao.map((dados, idx) => {
              const aderencia = dados.semanal[0]?.aderencia_percentual ?? 0;
              let variacao: number | null = null;
              if (idx > 0) {
                const aderenciaAnterior = dadosComparacao[idx - 1].semanal[0]?.aderencia_percentual ?? 0;
                variacao = calcularVariacaoPercentual(aderenciaAnterior, aderencia);
              }

              return (
                <React.Fragment key={idx}>
                  <td className="px-6 py-4 text-center border-l-2 border-slate-300 dark:border-slate-600">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-lg font-bold text-blue-900 dark:bg-blue-900/30 dark:text-blue-100">
                      {aderencia.toFixed(1)}%
                    </span>
                  </td>
                  {idx > 0 && variacao !== null && (
                    <td className="px-4 py-4 text-center bg-blue-50/30 dark:bg-blue-950/20">
                      <VariacaoBadge variacao={variacao} className="px-2.5 py-1 text-sm" />
                    </td>
                  )}
                </React.Fragment>
              );
            })}
          </tr>

          {/* Corridas Ofertadas */}
          <tr className="bg-white dark:bg-slate-900">
            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
              <div className="flex items-center gap-2">
                <span className="text-lg">📢</span>
                Corridas Ofertadas
              </div>
            </td>
            {dadosComparacao.map((dados, idx) => {
              const ofertadas = dados.totais?.corridas_ofertadas ?? 0;
              let variacao: number | null = null;
              if (idx > 0) {
                const ofertadasAnterior = dadosComparacao[idx - 1].totais?.corridas_ofertadas ?? 0;
                variacao = calcularVariacaoPercentual(ofertadasAnterior, ofertadas);
              }

              return (
                <React.Fragment key={idx}>
                  <td className="px-6 py-4 text-center text-base font-semibold text-slate-700 dark:text-slate-300 border-l-2 border-slate-300 dark:border-slate-600">
                    {ofertadas.toLocaleString('pt-BR')}
                  </td>
                  {idx > 0 && variacao !== null && (
                    <td className="px-4 py-4 text-center bg-slate-50/30 dark:bg-slate-900/50">
                      <VariacaoBadge variacao={variacao} className="px-2.5 py-1 text-sm" />
                    </td>
                  )}
                </React.Fragment>
              );
            })}
          </tr>

          {/* Corridas Aceitas */}
          <tr className="bg-emerald-50/50 dark:bg-emerald-950/20">
            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
              <div className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                Corridas Aceitas
              </div>
            </td>
            {dadosComparacao.map((dados, idx) => {
              const aceitas = dados.totais?.corridas_aceitas ?? 0;
              let variacao: number | null = null;
              if (idx > 0) {
                const aceitasAnterior = dadosComparacao[idx - 1].totais?.corridas_aceitas ?? 0;
                variacao = calcularVariacaoPercentual(aceitasAnterior, aceitas);
              }

              return (
                <React.Fragment key={idx}>
                  <td className="px-6 py-4 text-center text-base font-semibold text-emerald-700 dark:text-emerald-400 border-l-2 border-slate-300 dark:border-slate-600">
                    {aceitas.toLocaleString('pt-BR')}
                  </td>
                  {idx > 0 && variacao !== null && (
                    <td className="px-4 py-4 text-center bg-emerald-50/30 dark:bg-emerald-950/20">
                      <VariacaoBadge variacao={variacao} className="px-2.5 py-1 text-sm" />
                    </td>
                  )}
                </React.Fragment>
              );
            })}
          </tr>

          {/* Corridas Rejeitadas */}
          <tr className="bg-white dark:bg-slate-900">
            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
              <div className="flex items-center gap-2">
                <span className="text-lg">❌</span>
                Corridas Rejeitadas
              </div>
            </td>
            {dadosComparacao.map((dados, idx) => {
              const rejeitadas = dados.totais?.corridas_rejeitadas ?? 0;
              let variacao: number | null = null;
              if (idx > 0) {
                const rejeitadasAnterior = dadosComparacao[idx - 1].totais?.corridas_rejeitadas ?? 0;
                variacao = calcularVariacaoPercentual(rejeitadasAnterior, rejeitadas);
              }

              return (
                <React.Fragment key={idx}>
                  <td className="px-6 py-4 text-center text-base font-semibold text-rose-700 dark:text-rose-400 border-l-2 border-slate-300 dark:border-slate-600">
                    {rejeitadas.toLocaleString('pt-BR')}
                  </td>
                  {idx > 0 && variacao !== null && (
                    <td className="px-4 py-4 text-center bg-slate-50/30 dark:bg-slate-900/50">
                      <VariacaoBadge variacao={variacao} className="px-2.5 py-1 text-sm" invertColors />
                    </td>
                  )}
                </React.Fragment>
              );
            })}
          </tr>

          {/* Corridas Completadas */}
          <tr className="bg-purple-50/50 dark:bg-purple-950/20">
            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                Corridas Completadas
              </div>
            </td>
            {dadosComparacao.map((dados, idx) => {
              const completadas = dados.totais?.corridas_completadas ?? 0;
              let variacao: number | null = null;
              if (idx > 0) {
                const completadasAnterior = dadosComparacao[idx - 1].totais?.corridas_completadas ?? 0;
                variacao = calcularVariacaoPercentual(completadasAnterior, completadas);
              }

              return (
                <React.Fragment key={idx}>
                  <td className="px-6 py-4 text-center text-base font-semibold text-purple-700 dark:text-purple-400 border-l-2 border-slate-300 dark:border-slate-600">
                    {completadas.toLocaleString('pt-BR')}
                  </td>
                  {idx > 0 && variacao !== null && (
                    <td className="px-4 py-4 text-center bg-purple-50/30 dark:bg-purple-950/20">
                      <VariacaoBadge variacao={variacao} className="px-2.5 py-1 text-sm" />
                    </td>
                  )}
                </React.Fragment>
              );
            })}
          </tr>

          {/* Taxa de Aceitação */}
          <tr className="bg-white dark:bg-slate-900">
            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
              <div className="flex items-center gap-2">
                <span className="text-lg">💯</span>
                Taxa de Aceitação
              </div>
            </td>
            {dadosComparacao.map((dados, idx) => {
              const taxaAceitacao = dados.totais?.corridas_ofertadas
                ? ((dados.totais?.corridas_aceitas ?? 0) / dados.totais.corridas_ofertadas) * 100
                : 0;
              return (
                <React.Fragment key={idx}>
                  <td className="px-6 py-4 text-center text-base font-semibold text-slate-700 dark:text-slate-300 border-l-2 border-slate-300 dark:border-slate-600">
                    {taxaAceitacao.toFixed(1)}%
                  </td>
                  {idx > 0 && <td className="px-4 py-4 bg-slate-50/30 dark:bg-slate-900/50"></td>}
                </React.Fragment>
              );
            })}
          </tr>

          {/* Horas Planejadas */}
          <tr className="bg-amber-50/50 dark:bg-amber-950/20">
            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
              <div className="flex items-center gap-2">
                <span className="text-lg">📅</span>
                Horas Planejadas
              </div>
            </td>
            {dadosComparacao.map((dados, idx) => (
              <React.Fragment key={idx}>
                <td className="px-6 py-4 text-center font-mono text-base font-semibold text-amber-700 dark:text-amber-400 border-l-2 border-slate-300 dark:border-slate-600">
                  {formatarHorasParaHMS(dados.semanal[0]?.horas_a_entregar ?? '0')}
                </td>
                {idx > 0 && <td className="px-4 py-4 bg-amber-50/30 dark:bg-amber-950/20"></td>}
              </React.Fragment>
            ))}
          </tr>

          {/* Horas Entregues */}
          <tr className="bg-white dark:bg-slate-900">
            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
              <div className="flex items-center gap-2">
                <span className="text-lg">⏱️</span>
                Horas Entregues
              </div>
            </td>
            {dadosComparacao.map((dados, idx) => (
              <React.Fragment key={idx}>
                <td className="px-6 py-4 text-center font-mono text-base font-semibold text-blue-700 dark:text-blue-400 border-l-2 border-slate-300 dark:border-slate-600">
                  {formatarHorasParaHMS(dados.semanal[0]?.horas_entregues ?? '0')}
                </td>
                {idx > 0 && <td className="px-4 py-4 bg-slate-50/30 dark:bg-slate-900/50"></td>}
              </React.Fragment>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

