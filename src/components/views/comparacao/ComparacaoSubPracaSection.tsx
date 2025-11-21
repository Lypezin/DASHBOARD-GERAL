import React from 'react';
import { DashboardResumoData } from '@/types';
import { ViewToggleButton } from '../ViewToggleButton';
import { ComparacaoCharts } from './ComparacaoCharts';
import { VariacaoBadge } from '@/components/VariacaoBadge';
import { formatarHorasParaHMS } from '@/utils/formatters';

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
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-purple-50 px-6 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-purple-950/30">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <span className="text-xl">📍</span>
            Comparação Detalhada de Métricas por Sub-Praça
          </h3>
          <div className="flex gap-2">
            <ViewToggleButton
              active={viewMode === 'table'}
              onClick={() => onViewModeChange('table')}
              label="📋 Tabela"
            />
            <ViewToggleButton
              active={viewMode === 'chart'}
              onClick={() => onViewModeChange('chart')}
              label="📊 Gráfico"
            />
          </div>
        </div>
      </div>
      {viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Sub-Praça / Métrica</th>
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
              {Array.from(new Set(dadosComparacao.flatMap(d => d.sub_praca?.map(sp => sp.sub_praca) ?? []))).map((subPraca) => (
                <React.Fragment key={subPraca}>
                  <tr className="bg-purple-100 dark:bg-purple-950/40">
                    <td colSpan={semanasSelecionadas.length * 2} className="px-6 py-3 font-bold text-purple-900 dark:text-purple-100">
                      📍 {subPraca}
                    </td>
                  </tr>
                  
                  {/* Aderência */}
                  <tr className="bg-blue-50/50 dark:bg-blue-950/20">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📈</span>
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
                      const subPracaData = dados.sub_praca?.find(sp => sp.sub_praca === subPraca);
                      const ofertadas = subPracaData?.corridas_ofertadas ?? 0;
                      const aceitas = subPracaData?.corridas_aceitas ?? 0;
                      const taxaAceitacao = ofertadas > 0 ? (aceitas / ofertadas) * 100 : 0;
                      
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
                    {dadosComparacao.map((dados, idx) => {
                      const subPracaData = dados.sub_praca?.find(sp => sp.sub_praca === subPraca);
                      const horasPlanejadas = subPracaData?.horas_a_entregar ?? '0';
                      
                      return (
                        <React.Fragment key={idx}>
                          <td className="px-6 py-4 text-center font-mono text-base font-semibold text-amber-700 dark:text-amber-400 border-l-2 border-slate-300 dark:border-slate-600">
                            {formatarHorasParaHMS(horasPlanejadas)}
                          </td>
                          {idx > 0 && <td className="px-4 py-4 bg-amber-50/30 dark:bg-amber-950/20"></td>}
                        </React.Fragment>
                      );
                    })}
                  </tr>

                  {/* Horas Entregues */}
                  <tr className="bg-white dark:bg-slate-900">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⏱️</span>
                        Horas Entregues
                      </div>
                    </td>
                    {dadosComparacao.map((dados, idx) => {
                      const subPracaData = dados.sub_praca?.find(sp => sp.sub_praca === subPraca);
                      const horasEntregues = subPracaData?.horas_entregues ?? '0';
                      
                      return (
                        <React.Fragment key={idx}>
                          <td className="px-6 py-4 text-center font-mono text-base font-semibold text-blue-700 dark:text-blue-400 border-l-2 border-slate-300 dark:border-slate-600">
                            {formatarHorasParaHMS(horasEntregues)}
                          </td>
                          {idx > 0 && <td className="px-4 py-4 bg-slate-50/30 dark:bg-slate-900/50"></td>}
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
        <ComparacaoCharts
          dadosComparacao={dadosComparacao}
          semanasSelecionadas={semanasSelecionadas}
          viewMode={viewMode}
          chartType="subPraca"
        />
      )}
    </div>
  );
};

