import React from 'react';
import { DashboardResumoData } from '@/types';
import { VariacaoBadge } from '@/components/VariacaoBadge';
import { DIAS_DA_SEMANA } from '@/constants/comparacao';

interface ComparacaoDiaTableProps {
  dadosComparacao: DashboardResumoData[];
  semanasSelecionadas: string[];
}

export const ComparacaoDiaTable: React.FC<ComparacaoDiaTableProps> = ({
  dadosComparacao,
  semanasSelecionadas,
}) => {
  return (
    <div className="rounded-xl border border-blue-200 bg-white shadow-lg dark:border-blue-800 dark:bg-slate-900">
      <div className="border-b border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 dark:border-blue-800 dark:from-blue-950/30 dark:to-cyan-950/30">
        <div className="text-center sm:text-left">
          <h3 className="flex items-center justify-center gap-2 text-lg font-bold text-slate-900 dark:text-white sm:justify-start">
            <span className="text-xl">📊</span>
            Análise por Dia da Semana
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Distribuição de corridas e variações por dia da semana
          </p>
        </div>
      </div>
      <div className="overflow-x-auto p-6">
        <table className="w-full">
          <thead className="bg-blue-50 dark:bg-blue-950/30">
            <tr className="border-b border-blue-200 dark:border-blue-700">
              <th rowSpan={2} className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-100 align-middle">
                Dia
              </th>
              <th rowSpan={2} className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-100 align-middle">
                Métrica
              </th>
              {semanasSelecionadas.map((semana, idx) => (
                <th
                  key={`header-${semana}`}
                  colSpan={idx === 0 ? 1 : 2}
                  className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-100"
                >
                  Semana {semana}
                </th>
              ))}
            </tr>
            <tr className="border-b border-blue-200/60 dark:border-blue-800/60">
              {semanasSelecionadas.map((semana, idx) =>
                idx === 0 ? (
                  <th key={`sub-${semana}-valor`} className="px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-200">
                    Valor
                  </th>
                ) : (
                  <React.Fragment key={`sub-${semana}`}>
                    <th className="px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-200">
                      Valor
                    </th>
                    <th className="px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-200">
                      Δ%
                    </th>
                  </React.Fragment>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-100 dark:divide-blue-900">
            {DIAS_DA_SEMANA.map((dia, diaIdx) => {
              const metricas = [
                { label: 'Ofertadas', key: 'corridas_ofertadas', color: 'text-slate-700 dark:text-slate-300' },
                { label: 'Aceitas', key: 'corridas_aceitas', color: 'text-emerald-700 dark:text-emerald-400' },
                { label: 'Rejeitadas', key: 'corridas_rejeitadas', color: 'text-rose-700 dark:text-rose-400' },
                { label: 'Completadas', key: 'corridas_completadas', color: 'text-blue-700 dark:text-blue-400' },
              ];
              
              return metricas.map((metrica, metricaIdx) => (
                <tr key={`${dia}-${metrica.key}`} className={diaIdx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-blue-50/30 dark:bg-blue-950/20'}>
                  {metricaIdx === 0 && (
                    <td rowSpan={4} className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white border-r border-blue-200 dark:border-blue-800">
                      {dia}
                    </td>
                  )}
                  <td className={`px-4 py-2 text-center text-sm font-semibold ${metrica.color}`}>{metrica.label}</td>
                  {dadosComparacao.map((dados, idx) => {
                    const diaData = dados.dia?.find(d => d.dia_da_semana === dia);
                    const valor = diaData?.[metrica.key as keyof typeof diaData] as number ?? 0;
                    
                    let variacao = null;
                    if (idx > 0) {
                      const dadosAnterior = dadosComparacao[idx - 1];
                      const diaDataAnterior = dadosAnterior.dia?.find(d => d.dia_da_semana === dia);
                      const valorAnterior = diaDataAnterior?.[metrica.key as keyof typeof diaDataAnterior] as number ?? 0;
                      variacao = valorAnterior > 0 ? ((valor - valorAnterior) / valorAnterior) * 100 : 0;
                    }
                    
                    return (
                      <React.Fragment key={idx}>
                        <td className={`px-4 py-2 text-center font-semibold ${metrica.color}`}>
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
    </div>
  );
};

