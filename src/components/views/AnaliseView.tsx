import React, { useState } from 'react';
import { Totals, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import MetricCard from '../MetricCard';
import { Doughnut } from 'react-chartjs-2';
import { formatarHorasParaHMS, getAderenciaColor } from '@/utils/formatters';

function AnaliseView({ 
  totals,
  aderenciaDia,
  aderenciaTurno,
  aderenciaSubPraca,
  aderenciaOrigem,
}: { 
  totals: Totals;
  aderenciaDia: AderenciaDia[];
  aderenciaTurno: AderenciaTurno[];
  aderenciaSubPraca: AderenciaSubPraca[];
  aderenciaOrigem: AderenciaOrigem[];
}) {
  const [activeTable, setActiveTable] = useState<'dia' | 'turno' | 'sub_praca' | 'origem'>('dia');
  
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

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: { size: 12, weight: 'bold' as const },
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 12,
        titleColor: 'rgb(226, 232, 240)',
        bodyColor: 'rgb(226, 232, 240)',
        borderColor: 'rgb(51, 65, 85)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toLocaleString('pt-BR')} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard title="Ofertadas" value={totals.ofertadas} icon="📢" color="blue" />
        <MetricCard title="Aceitas" value={totals.aceitas} icon="✅" percentage={taxaAceitacao} percentageLabel="de aceitação" color="green" />
        <MetricCard title="Rejeitadas" value={totals.rejeitadas} icon="❌" percentage={taxaRejeicao} percentageLabel="de rejeição" color="red" />
        <MetricCard title="Completadas" value={totals.completadas} icon="🏁" percentage={taxaCompletude} percentageLabel="de completude" color="purple" />
      </div>

      {/* Gráfico de Distribuição */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 sm:mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
            <span className="text-xl sm:text-2xl">📊</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Distribuição de Corridas Ofertadas</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Visão geral de aceitação e rejeição</p>
          </div>
        </div>
        <div className="h-64 sm:h-80 mx-auto max-w-md">
          <Doughnut data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Análise Detalhada - Tabelas */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 lg:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg">
              <span className="text-xl sm:text-2xl">📋</span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white">Análise Detalhada</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Corridas por segmento</p>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setActiveTable('dia')}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTable === 'dia'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              📅 Por Dia
            </button>
            <button
              onClick={() => setActiveTable('turno')}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTable === 'turno'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              🕐 Por Turno
            </button>
            <button
              onClick={() => setActiveTable('sub_praca')}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTable === 'sub_praca'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              📍 Por Sub Praça
            </button>
            <button
              onClick={() => setActiveTable('origem')}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTable === 'origem'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              🏢 Por Origem
            </button>
          </div>
        </div>

        {/* Tabela por Dia */}
        {activeTable === 'dia' && aderenciaDia.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Dia</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Ofertadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Aceitas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Rejeitadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Completadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Taxa Aceitação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {aderenciaDia.map((item, index) => {
                  const taxaAceitacao = (item.corridas_ofertadas || 0) > 0 
                    ? ((item.corridas_aceitas || 0) / (item.corridas_ofertadas || 0)) * 100 
                    : 0;
                  return (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">{item.dia_da_semana}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-700 dark:text-slate-300">{(item.corridas_ofertadas || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-green-600 dark:text-green-400">{(item.corridas_aceitas || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-red-600 dark:text-red-400">{(item.corridas_rejeitadas || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">{(item.corridas_completadas || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
                          {taxaAceitacao.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabela por Turno */}
        {activeTable === 'turno' && aderenciaTurno.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Turno</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Ofertadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Aceitas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Rejeitadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Completadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Taxa Aceitação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {aderenciaTurno.map((item, index) => {
                  const taxaAceitacao = (item.corridas_ofertadas || 0) > 0 
                    ? ((item.corridas_aceitas || 0) / (item.corridas_ofertadas || 0)) * 100 
                    : 0;
                  return (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">{item.periodo}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-700 dark:text-slate-300">{(item.corridas_ofertadas || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-green-600 dark:text-green-400">{(item.corridas_aceitas || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-red-600 dark:text-red-400">{(item.corridas_rejeitadas || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">{(item.corridas_completadas || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
                          {taxaAceitacao.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabela por Sub Praça */}
        {activeTable === 'sub_praca' && aderenciaSubPraca.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Sub Praça</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Ofertadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Aceitas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Rejeitadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Completadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Taxa Aceitação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {aderenciaSubPraca.map((item, index) => {
                  const taxaAceitacao = (item.corridas_ofertadas || 0) > 0 
                    ? ((item.corridas_aceitas || 0) / (item.corridas_ofertadas || 0)) * 100 
                    : 0;
                  return (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">{item.sub_praca}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-700 dark:text-slate-300">{(item.corridas_ofertadas || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-green-600 dark:text-green-400">{(item.corridas_aceitas || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-red-600 dark:text-red-400">{(item.corridas_rejeitadas || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">{(item.corridas_completadas || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
                          {taxaAceitacao.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabela por Origem */}
        {activeTable === 'origem' && aderenciaOrigem.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Origem</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Ofertadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Aceitas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Rejeitadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Completadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Taxa Aceitação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {aderenciaOrigem.map((item, index) => {
                  const taxaAceitacao = (item.corridas_ofertadas || 0) > 0 
                    ? ((item.corridas_aceitas || 0) / (item.corridas_ofertadas || 0)) * 100 
                    : 0;
                  return (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">{item.origem}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-700 dark:text-slate-300">{(item.corridas_ofertadas || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-green-600 dark:text-green-400">{(item.corridas_aceitas || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-red-600 dark:text-red-400">{(item.corridas_rejeitadas || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">{(item.corridas_completadas || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
                          {taxaAceitacao.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Mensagem de sem dados */}
        {((activeTable === 'dia' && aderenciaDia.length === 0) ||
          (activeTable === 'turno' && aderenciaTurno.length === 0) ||
          (activeTable === 'sub_praca' && aderenciaSubPraca.length === 0) ||
          (activeTable === 'origem' && aderenciaOrigem.length === 0)) && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-slate-500 dark:text-slate-400">Nenhum dado disponível para esta segmentação</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnaliseView;
