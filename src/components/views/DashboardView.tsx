import React, { useState, useMemo } from 'react';
import { AderenciaSemanal, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import AderenciaCard from '../AderenciaCard';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { Bar } from 'react-chartjs-2';

function DashboardView({
  aderenciaGeral,
  aderenciaDia,
  aderenciaTurno,
  aderenciaSubPraca,
  aderenciaOrigem,
}: {
  aderenciaGeral?: AderenciaSemanal;
  aderenciaDia: AderenciaDia[];
  aderenciaTurno: AderenciaTurno[];
  aderenciaSubPraca: AderenciaSubPraca[];
  aderenciaOrigem: AderenciaOrigem[];
}) {
  const [viewMode, setViewMode] = useState<'turno' | 'sub_praca' | 'origem'>('turno');

  // Dados para o gráfico de aderência por dia
  const chartDiaData = useMemo(() => ({
    labels: aderenciaDia.map(d => d.dia_semana || 'N/A'),
    datasets: [{
      label: 'Aderência %',
      data: aderenciaDia.map(d => d.aderencia_percentual || 0),
      backgroundColor: aderenciaDia.map(d => {
        const aderencia = d.aderencia_percentual || 0;
        if (aderencia >= 95) return 'rgba(34, 197, 94, 0.8)';
        if (aderencia >= 85) return 'rgba(251, 191, 36, 0.8)';
        return 'rgba(239, 68, 68, 0.8)';
      }),
      borderColor: aderenciaDia.map(d => {
        const aderencia = d.aderencia_percentual || 0;
        if (aderencia >= 95) return 'rgb(34, 197, 94)';
        if (aderencia >= 85) return 'rgb(251, 191, 36)';
        return 'rgb(239, 68, 68)';
      }),
      borderWidth: 2,
      borderRadius: 8,
    }]
  }), [aderenciaDia]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 12,
        titleColor: 'rgb(226, 232, 240)',
        bodyColor: 'rgb(226, 232, 240)',
        borderColor: 'rgb(51, 65, 85)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `Aderência: ${context.parsed.y.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { color: 'rgb(100, 116, 139)', callback: (value: any) => value + '%' }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgb(100, 116, 139)' }
      }
    }
  };

  // Dados para renderização com base no viewMode
  const dataToRender = useMemo(() => {
    switch (viewMode) {
      case 'turno':
        return aderenciaTurno.map(item => ({
          label: item.periodo || 'N/A',
          aderencia: item.aderencia_percentual || 0,
          horasAEntregar: item.horas_a_entregar || '0',
          horasEntregues: item.horas_entregues || '0'
        }));
      case 'sub_praca':
        return aderenciaSubPraca.map(item => ({
          label: item.sub_praca || 'N/A',
          aderencia: item.aderencia_percentual || 0,
          horasAEntregar: item.horas_a_entregar || '0',
          horasEntregues: item.horas_entregues || '0'
        }));
      case 'origem':
        return aderenciaOrigem.map(item => ({
          label: item.origem || 'N/A',
          aderencia: item.aderencia_percentual || 0,
          horasAEntregar: item.horas_a_entregar || '0',
          horasEntregues: item.horas_entregues || '0'
        }));
      default:
        return [];
    }
  }, [viewMode, aderenciaTurno, aderenciaSubPraca, aderenciaOrigem]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Aderência Geral */}
      {aderenciaGeral && (
        <div className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/90 backdrop-blur-sm p-5 sm:p-6 lg:p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-white/30 dark:border-white/10 dark:bg-slate-900/90 animate-slide-up">
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 opacity-0 blur-xl transition-opacity group-hover:opacity-100"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/10"></div>
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1 w-full">
              <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shrink-0">
                  <span className="text-xl sm:text-2xl">📊</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Aderência Geral</h2>
                  <p className="mt-0.5 sm:mt-1 text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                    {(aderenciaGeral.aderencia_percentual ?? 0).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4 dark:border-slate-700 dark:bg-slate-800/80 hover-lift">
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">📅 Planejado</p>
                  <p className="mt-1 font-mono text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white truncate">
                    {formatarHorasParaHMS(aderenciaGeral.horas_a_entregar)}
                  </p>
                </div>
                <div className="rounded-lg sm:rounded-xl border border-blue-200 bg-blue-50/80 p-3 sm:p-4 dark:border-blue-800 dark:bg-blue-950/50 hover-lift">
                  <p className="text-[10px] sm:text-xs font-medium text-blue-600 dark:text-blue-400">⏱️ Entregue</p>
                  <p className="mt-1 font-mono text-sm sm:text-base lg:text-lg font-bold text-blue-900 dark:text-blue-100 truncate">
                    {formatarHorasParaHMS(aderenciaGeral.horas_entregues)}
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden lg:flex h-24 w-24 xl:h-32 xl:w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 shrink-0">
              <span className="text-5xl xl:text-6xl">🎯</span>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico Aderência Diária */}
      {aderenciaDia.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/30 to-blue-50/20 p-4 sm:p-6 lg:p-8 shadow-xl dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/50 dark:to-blue-950/10">
          <div className="mb-4 sm:mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg">
              <span className="text-xl sm:text-2xl">📈</span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white">Aderência por Dia da Semana</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Distribuição semanal de performance</p>
            </div>
          </div>
          <div className="h-64 sm:h-80 lg:h-96">
            <Bar data={chartDiaData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Aderência Detalhada (Turno/Sub Praça/Origem) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 lg:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg">
              <span className="text-xl sm:text-2xl">📋</span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white">Aderência Detalhada</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Análise por segmento</p>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setViewMode('turno')}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                viewMode === 'turno'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              🕐 Turno
            </button>
            <button
              onClick={() => setViewMode('sub_praca')}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                viewMode === 'sub_praca'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              📍 Sub Praça
            </button>
            <button
              onClick={() => setViewMode('origem')}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                viewMode === 'origem'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              🏢 Origem
            </button>
          </div>
        </div>

        {dataToRender.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {dataToRender.map((item, index) => (
              <AderenciaCard
                key={`${viewMode}-${index}`}
                titulo={item.label}
                aderenciaPercentual={item.aderencia}
                horasAEntregar={item.horasAEntregar}
                horasEntregues={item.horasEntregues}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-slate-500 dark:text-slate-400">Nenhum dado disponível para este filtro</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardView;
