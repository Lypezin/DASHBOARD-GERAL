'use client';

import React, { Suspense, useMemo } from 'react';
import { EvolucaoChart } from '@/components/views/evolucao/EvolucaoChart';
import { useChartRegistration } from '@/hooks/dashboard/useChartRegistration';
import { useDashboardFilters } from '@/hooks/dashboard/useDashboardFilters';

const metrics = new Set<'ofertadas' | 'aceitas' | 'completadas' | 'horas'>([
  'ofertadas',
  'aceitas',
  'completadas',
  'horas',
]);

function EvolucaoVisualSmokeContent() {
  const chartReady = useChartRegistration(true);
  const { filters, setFilters } = useDashboardFilters();
  const cityFactor = filters.praca === 'Manaus' ? 0.62 : filters.praca === 'Guarulhos' ? 0.78 : 1;

  const chartData = useMemo(() => ({
    labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho'],
    datasets: [
      {
        label: 'Ofertadas',
        data: [920, 1040, 1110, 1090, 1220, 1300, 1380].map((value) => Math.round(value * cityFactor)),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.12)',
        tension: 0.35,
        fill: true,
      },
      {
        label: 'Aceitas',
        data: [760, 850, 910, 900, 1010, 1080, 1160].map((value) => Math.round(value * cityFactor)),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        tension: 0.35,
        fill: false,
      },
    ],
  }), [cityFactor]);

  const changeCity = (praca: string | null) => {
    setFilters((current) => ({ ...current, praca }));
  };

  const simulateNavigation = () => {
    const params = new URLSearchParams(window.location.search);
    params.set('praca', 'Manaus');
    window.history.pushState(null, '', `${window.location.pathname}?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 dark:bg-slate-950 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <strong data-testid="active-evolution-filter">Praça: {filters.praca || 'Todas'}</strong>
          <button className="rounded-xl bg-blue-600 px-3 py-2 font-semibold text-white" onClick={() => changeCity('Guarulhos')}>Guarulhos</button>
          <button className="rounded-xl bg-emerald-600 px-3 py-2 font-semibold text-white" onClick={() => changeCity('Manaus')}>Manaus</button>
          <button className="rounded-xl bg-slate-700 px-3 py-2 font-semibold text-white" onClick={() => changeCity(null)}>Todas</button>
          <button className="rounded-xl border border-slate-300 px-3 py-2 font-semibold dark:border-slate-700" onClick={simulateNavigation}>Simular navegação</button>
        </div>

        {chartReady ? (
          <EvolucaoChart
            chartData={chartData}
            chartOptions={{ responsive: true, maintainAspectRatio: false, animation: { duration: 120 } }}
            chartError={null}
            anoSelecionado={typeof filters.ano === 'number' ? filters.ano : 2026}
            selectedMetrics={metrics}
            viewMode="mensal"
            dadosAtivosLength={7}
          />
        ) : null}
      </div>
    </main>
  );
}

export default function EvolucaoVisualSmokePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-100 dark:bg-slate-950" />}>
      <EvolucaoVisualSmokeContent />
    </Suspense>
  );
}
