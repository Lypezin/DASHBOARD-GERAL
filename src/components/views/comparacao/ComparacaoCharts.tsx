import React, { useMemo } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { DashboardResumoData } from '@/types';

interface ComparacaoChartsProps {
  dadosComparacao: DashboardResumoData[];
  semanasSelecionadas: string[];
  viewMode: 'table' | 'chart';
  chartType: 'detalhada' | 'dia' | 'subPraca' | 'origem';
  origensDisponiveis?: string[];
}

export const ComparacaoCharts: React.FC<ComparacaoChartsProps> = ({
  dadosComparacao,
  semanasSelecionadas,
  viewMode,
  chartType,
  origensDisponiveis = [],
}) => {
  const origemChartData = useMemo(() => {
    if (chartType !== 'origem' || origensDisponiveis.length === 0) return null;

    const barColors = ['rgba(59,130,246,0.75)', 'rgba(99,102,241,0.75)', 'rgba(16,185,129,0.75)'];
    const lineColors = ['rgba(239,68,68,0.9)', 'rgba(236,72,153,0.85)', 'rgba(234,179,8,0.85)'];

    const datasets: any[] = [];

    semanasSelecionadas.forEach((semana, idx) => {
      datasets.push({
        type: 'bar' as const,
        label: `Completadas S${semana}`,
        data: origensDisponiveis.map((origem) => {
          const dadosSemana = dadosComparacao[idx];
          const origemData = dadosSemana?.origem?.find((o) => (o.origem || '').trim() === origem);
          return origemData?.corridas_completadas ?? 0;
        }),
        backgroundColor: barColors[idx % barColors.length],
        borderRadius: 8,
        maxBarThickness: 48,
        yAxisID: 'y',
        order: idx,
      });

      datasets.push({
        type: 'line' as const,
        label: `Aderência S${semana}`,
        data: origensDisponiveis.map((origem) => {
          const dadosSemana = dadosComparacao[idx];
          const origemData = dadosSemana?.origem?.find((o) => (o.origem || '').trim() === origem);
          return origemData?.aderencia_percentual ?? 0;
        }),
        borderColor: lineColors[idx % lineColors.length],
        backgroundColor: lineColors[idx % lineColors.length],
        borderWidth: 3,
        tension: 0.35,
        fill: false,
        yAxisID: 'y1',
        pointRadius: 6,
        pointHoverRadius: 9,
        order: idx + 10,
      });
    });

    return {
      labels: origensDisponiveis,
      datasets,
    };
  }, [origensDisponiveis, dadosComparacao, semanasSelecionadas, chartType]);

  const origemChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            if (context.dataset?.yAxisID === 'y1') {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
            }
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString('pt-BR')}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Corridas Completadas',
        },
      },
      y1: {
        beginAtZero: true,
        position: 'right' as const,
        min: 0,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: (value: any) => `${value}%`,
        },
        title: {
          display: true,
          text: 'Aderência (%)',
        },
      },
    },
  }), []);

  if (viewMode !== 'chart') return null;

  if (chartType === 'detalhada') {
    return (
      <div className="p-6">
        <Bar data={{
          labels: semanasSelecionadas.map(s => `Semana ${s}`),
          datasets: [
            {
              type: 'bar' as const,
              label: 'Ofertadas',
              data: dadosComparacao.map(d => d.totais?.corridas_ofertadas ?? 0),
              backgroundColor: 'rgba(100, 116, 139, 0.7)',
              borderColor: 'rgb(100, 116, 139)',
              borderWidth: 1,
              yAxisID: 'y-count',
              order: 2,
            },
            {
              type: 'bar' as const,
              label: 'Aceitas',
              data: dadosComparacao.map(d => d.totais?.corridas_aceitas ?? 0),
              backgroundColor: 'rgba(16, 185, 129, 0.7)',
              borderColor: 'rgb(16, 185, 129)',
              borderWidth: 1,
              yAxisID: 'y-count',
              order: 2,
            },
            {
              type: 'bar' as const,
              label: 'Completadas',
              data: dadosComparacao.map(d => d.totais?.corridas_completadas ?? 0),
              backgroundColor: 'rgba(139, 92, 246, 0.7)',
              borderColor: 'rgb(139, 92, 246)',
              borderWidth: 1,
              yAxisID: 'y-count',
              order: 2,
            },
            {
              type: 'line' as any,
              label: 'Aderência (%)',
              data: dadosComparacao.map(d => d.semanal[0]?.aderencia_percentual ?? 0),
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 3,
              tension: 0.4,
              pointRadius: 6,
              pointHoverRadius: 8,
              pointBackgroundColor: 'rgb(59, 130, 246)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              yAxisID: 'y-percent',
              order: 1,
            },
          ] as any,
        }} options={{
          responsive: true,
          maintainAspectRatio: true,
          interaction: {
            mode: 'index' as const,
            intersect: false,
          },
          plugins: {
            legend: {
              position: 'top' as const,
              labels: {
                font: { size: 13, weight: 'bold' as const },
                padding: 20,
                usePointStyle: true,
                pointStyle: 'circle',
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              padding: 15,
              titleFont: { size: 15, weight: 'bold' as const },
              bodyFont: { size: 14 },
              bodySpacing: 8,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              callbacks: {
                label: (context: any) => {
                  const label = context.dataset.label || '';
                  const value = context.parsed.y;
                  
                  if (label === 'Aderência (%)') {
                    return `  ${label}: ${value.toFixed(1)}%`;
                  }
                  return `  ${label}: ${value.toLocaleString('pt-BR')} corridas`;
                }
              }
            }
          },
          scales: {
            'y-count': {
              type: 'linear' as const,
              position: 'left' as const,
              beginAtZero: true,
              title: {
                display: true,
                text: 'Quantidade de Corridas',
                font: { size: 13, weight: 'bold' as const },
                color: 'rgb(100, 116, 139)',
              },
              ticks: {
                callback: (value: any) => value.toLocaleString('pt-BR'),
                font: { size: 12 },
                color: 'rgb(100, 116, 139)',
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
              }
            },
            'y-percent': {
              type: 'linear' as const,
              position: 'right' as const,
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Aderência (%)',
                font: { size: 13, weight: 'bold' as const },
                color: 'rgb(59, 130, 246)',
              },
              ticks: {
                callback: (value: any) => `${value}%`,
                font: { size: 12 },
                color: 'rgb(59, 130, 246)',
              },
              grid: {
                display: false,
              }
            },
            x: {
              ticks: {
                font: { size: 12, weight: 'bold' as const },
              },
              grid: {
                display: false,
              }
            }
          }
        }} />
      </div>
    );
  }

  if (chartType === 'dia') {
    return (
      <div className="p-6">
        <Line data={{
          labels: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'],
          datasets: semanasSelecionadas.map((semana, idx) => {
            const cores = [
              { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgb(59, 130, 246)' },
              { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgb(16, 185, 129)' },
              { bg: 'rgba(139, 92, 246, 0.2)', border: 'rgb(139, 92, 246)' },
              { bg: 'rgba(251, 146, 60, 0.2)', border: 'rgb(251, 146, 60)' },
              { bg: 'rgba(236, 72, 153, 0.2)', border: 'rgb(236, 72, 153)' },
            ];
            const cor = cores[idx % cores.length];
            
            return {
              label: `Semana ${semana}`,
              data: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(dia => {
                const dados = dadosComparacao[idx];
                const diaData = dados?.dia?.find(d => d.dia_da_semana === dia);
                return diaData?.aderencia_percentual ?? 0;
              }),
              backgroundColor: cor.bg,
              borderColor: cor.border,
              borderWidth: 2,
              tension: 0.4,
              pointRadius: 5,
              pointHoverRadius: 7,
            };
          }),
        }} options={{
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { position: 'top' as const },
            tooltip: {
              callbacks: {
                label: (context: any) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`
              }
            }
          },
          scales: {
            y: { beginAtZero: true, ticks: { callback: (value: any) => `${value}%` } },
            x: { ticks: { font: { size: 11 } } }
          }
        }} />
      </div>
    );
  }

  if (chartType === 'subPraca') {
    const subPracas = Array.from(new Set(dadosComparacao.flatMap(d => d.sub_praca?.map(sp => sp.sub_praca) ?? [])));
    return (
      <div className="p-6">
        <Line data={{
          labels: subPracas,
          datasets: semanasSelecionadas.map((semana, idx) => {
            const cores = [
              { bg: 'rgba(147, 51, 234, 0.2)', border: 'rgb(147, 51, 234)' },
              { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgb(16, 185, 129)' },
              { bg: 'rgba(251, 146, 60, 0.2)', border: 'rgb(251, 146, 60)' },
              { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgb(59, 130, 246)' },
              { bg: 'rgba(236, 72, 153, 0.2)', border: 'rgb(236, 72, 153)' },
            ];
            const cor = cores[idx % cores.length];
            
            return {
              label: `Semana ${semana}`,
              data: subPracas.map(subPraca => {
                const dados = dadosComparacao[idx];
                const subPracaData = dados?.sub_praca?.find(sp => sp.sub_praca === subPraca);
                return subPracaData?.aderencia_percentual ?? 0;
              }),
              backgroundColor: cor.bg,
              borderColor: cor.border,
              borderWidth: 2,
              tension: 0.4,
              pointRadius: 5,
              pointHoverRadius: 7,
            };
          }),
        }} options={{
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { position: 'top' as const },
            tooltip: {
              callbacks: {
                label: (context: any) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`
              }
            }
          },
          scales: {
            y: { beginAtZero: true, ticks: { callback: (value: any) => `${value}%` } },
            x: { ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 45 } }
          }
        }} />
      </div>
    );
  }

  if (chartType === 'origem' && origemChartData) {
    return (
      <div className="p-6">
        <div className="h-[420px]">
          <Bar data={origemChartData} options={origemChartOptions} />
        </div>
      </div>
    );
  }

  return null;
};

