import React from 'react';
import type { AderenciaDia, AderenciaSubPraca } from '@/types';
import { useDailyPerformanceData } from './hooks/useDailyPerformanceData';

interface DashboardOverviewAnalysisProps {
  days: AderenciaDia[];
  subPlazas: AderenciaSubPraca[];
}

const formatNumber = (value: number) => value.toLocaleString('pt-BR');

export const DashboardOverviewAnalysis = React.memo(function DashboardOverviewAnalysis({
  days,
  subPlazas,
}: DashboardOverviewAnalysisProps) {
  const orderedDays = useDailyPerformanceData(days).filter(
    (day) => typeof day.corridas_ofertadas === 'number' || typeof day.corridas_aceitas === 'number'
  );
  const chartDays = orderedDays.slice(0, 14);
  const maxValue = Math.max(1, ...chartDays.flatMap((day) => [day.corridas_ofertadas ?? 0, day.corridas_aceitas ?? 0]));
  const xAt = (index: number) => 42 + (index * 518) / Math.max(chartDays.length - 1, 1);
  const yAt = (value: number) => 182 - (value / maxValue) * 150;
  const offeredLine = chartDays.map((day, index) => `${xAt(index)},${yAt(day.corridas_ofertadas ?? 0)}`).join(' ');
  const acceptedLine = chartDays.map((day, index) => `${xAt(index)},${yAt(day.corridas_aceitas ?? 0)}`).join(' ');

  return (
    <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <section className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5" aria-labelledby="overview-evolution">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="overview-evolution" className="text-xl font-bold tracking-tight text-foreground">Evolução diária</h3>
          <div className="flex items-center gap-4 text-xs text-muted-foreground" aria-hidden="true">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#0754d8]" />Ofertadas</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#8ab7f4]" />Aceitas</span>
          </div>
        </div>
        {chartDays.length > 0 ? (
          <div className="mt-4 overflow-hidden">
            <svg className="h-52 w-full" viewBox="0 0 580 220" role="img" aria-label="Corridas ofertadas e aceitas por dia">
              {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
                const y = yAt(maxValue * fraction);
                return (
                  <g key={fraction}>
                    <line x1="42" x2="565" y1={y} y2={y} stroke="#dce3ee" strokeWidth="1" />
                    <text x="35" y={y + 4} textAnchor="end" fill="#66748c" fontSize="10">{formatNumber(Math.round(maxValue * fraction))}</text>
                  </g>
                );
              })}
              {chartDays.length > 1 && <polyline fill="none" stroke="#8ab7f4" strokeWidth="3" strokeLinejoin="round" points={acceptedLine} />}
              {chartDays.length > 1 && <polyline fill="none" stroke="#0754d8" strokeWidth="3" strokeLinejoin="round" points={offeredLine} />}
              {chartDays.map((day, index) => (
                <g key={`${day.data || day.dia || index}-${index}`}>
                  <circle cx={xAt(index)} cy={yAt(day.corridas_ofertadas ?? 0)} r="4" fill="#0754d8">
                    <title>{`${day.data || day.dia_da_semana || day.dia || 'Dia'}: ${formatNumber(day.corridas_ofertadas ?? 0)} ofertadas`}</title>
                  </circle>
                  <circle cx={xAt(index)} cy={yAt(day.corridas_aceitas ?? 0)} r="4" fill="#8ab7f4">
                    <title>{`${day.data || day.dia_da_semana || day.dia || 'Dia'}: ${formatNumber(day.corridas_aceitas ?? 0)} aceitas`}</title>
                  </circle>
                  <text x={xAt(index)} y="210" textAnchor="middle" fill="#66748c" fontSize="10">
                    {day.data?.slice(5).split('-').reverse().join('/') || (day.dia_da_semana || day.dia || '').slice(0, 3)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        ) : (
          <p className="mt-10 text-sm text-muted-foreground">Sem corridas diárias para o período selecionado.</p>
        )}
      </section>

      <section className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5" aria-labelledby="overview-plazas">
        <h3 id="overview-plazas" className="text-xl font-bold tracking-tight text-foreground">Por sub praça</h3>
        <div className="subtle-scrollbar mt-4 overflow-x-auto">
          {subPlazas.length ? (
            <table className="w-full min-w-[360px] border-collapse text-sm">
              <thead className="bg-muted text-left text-xs font-semibold text-foreground">
                <tr>
                  <th className="px-3 py-3">Sub praça</th>
                  <th className="px-3 py-3 text-right">Corridas</th>
                  <th className="px-3 py-3 text-right">Aderência</th>
                </tr>
              </thead>
              <tbody>
                {subPlazas.slice(0, 5).map((plaza, index) => (
                  <tr key={`${plaza.sub_praca}-${index}`} className="border-b border-border last:border-0">
                    <th scope="row" className="px-3 py-3 text-left font-medium text-foreground">{plaza.sub_praca || 'Sem nome'}</th>
                    <td className="px-3 py-3 text-right tabular-nums">{typeof plaza.corridas_ofertadas === 'number' ? formatNumber(plaza.corridas_ofertadas) : '—'}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{typeof plaza.aderencia_percentual === 'number' ? `${plaza.aderencia_percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-8 text-sm text-muted-foreground">Sem dados por sub praça para o período selecionado.</p>
          )}
        </div>
      </section>
    </div>
  );
});

DashboardOverviewAnalysis.displayName = 'DashboardOverviewAnalysis';
