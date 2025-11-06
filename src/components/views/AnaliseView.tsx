import React from 'react';
import { Totals } from '@/types';
import MetricCard from '../MetricCard';
import { Doughnut } from 'react-chartjs-2';

function AnaliseView({ totals }: { totals: Totals }) {
  const taxaAceitacao = totals.ofertadas > 0 ? (totals.aceitas / totals.ofertadas) * 100 : 0;
  const taxaCompletude = totals.aceitas > 0 ? (totals.completadas / totals.aceitas) * 100 : 0;
  const taxaRejeicao = totals.ofertadas > 0 ? (totals.rejeitadas / totals.ofertadas) * 100 : 0;

  const chartData = {
    labels: ['Aceitas', 'Rejeitadas', 'Não Respondidas'],
    datasets: [
      {
        data: [totals.aceitas, totals.rejeitadas, totals.ofertadas - totals.aceitas - totals.rejeitadas],
        backgroundColor: ['#2563eb', '#dc2626', '#9ca3af'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Ofertadas" value={totals.ofertadas} icon="📢" color="blue" />
        <MetricCard title="Aceitas" value={totals.aceitas} icon="✅" percentage={taxaAceitacao} percentageLabel="de aceitação" color="green" />
        <MetricCard title="Rejeitadas" value={totals.rejeitadas} icon="❌" percentage={taxaRejeicao} percentageLabel="de rejeição" color="red" />
        <MetricCard title="Completadas" value={totals.completadas} icon="🏁" percentage={taxaCompletude} percentageLabel="de completude" color="purple" />
      </div>
      <div className="rounded-2xl border p-8 shadow-xl">
        <h3 className="text-xl font-bold">Distribuição de Corridas Ofertadas</h3>
        <div className="h-80 mx-auto max-w-sm">
          <Doughnut data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
        </div>
      </div>
    </div>
  );
}

export default AnaliseView;
