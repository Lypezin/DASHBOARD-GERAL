import React, { useState } from 'react';
import { Totals, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import MetricCard from '../MetricCard';

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

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard title="Ofertadas" value={totals.ofertadas} icon="📢" color="blue" />
        <MetricCard title="Aceitas" value={totals.aceitas} icon="✅" percentage={taxaAceitacao} percentageLabel="de aceitação" color="green" />
        <MetricCard title="Rejeitadas" value={totals.rejeitadas} icon="❌" percentage={taxaRejeicao} percentageLabel="de rejeição" color="red" />
        <MetricCard title="Completadas" value={totals.completadas} icon="🏁" percentage={taxaCompletude} percentageLabel="de completude" color="purple" />
      </div>

      {/* Análise Detalhada - Tabelas */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 lg:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg">
              <span className="text-xl sm:text-2xl">📋</span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white">Análise Detalhada por Segmento</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Métricas completas de performance</p>
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
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                <tr className="border-b-2 border-slate-300 dark:border-slate-600">
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">Dia</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">Ofertadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">Aceitas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">Rejeitadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">Completadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">% Aceitação</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">% Rejeição</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">% Completude</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {aderenciaDia.map((item, index) => {
                  const taxaAceitacao = (item.corridas_ofertadas || 0) > 0 
                    ? ((item.corridas_aceitas || 0) / (item.corridas_ofertadas || 0)) * 100 
                    : 0;
                  const taxaRejeicao = (item.corridas_ofertadas || 0) > 0 
                    ? ((item.corridas_rejeitadas || 0) / (item.corridas_ofertadas || 0)) * 100 
                    : 0;
                  const taxaCompletude = (item.corridas_aceitas || 0) > 0 
                    ? ((item.corridas_completadas || 0) / (item.corridas_aceitas || 0)) * 100 
                    : 0;
                  return (
                    <tr key={index} className="hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
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
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-100">
                          {taxaRejeicao.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100">
                          {taxaCompletude.toFixed(1)}%
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
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                <tr className="border-b-2 border-slate-300 dark:border-slate-600">
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">Turno</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">Ofertadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">Aceitas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">Rejeitadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">Completadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">% Aceitação</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">% Rejeição</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">% Completude</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {aderenciaTurno.map((item, index) => {
                  const taxaAceitacao = (item.corridas_ofertadas || 0) > 0 
                    ? ((item.corridas_aceitas || 0) / (item.corridas_ofertadas || 0)) * 100 
                    : 0;
                  const taxaRejeicao = (item.corridas_ofertadas || 0) > 0 
                    ? ((item.corridas_rejeitadas || 0) / (item.corridas_ofertadas || 0)) * 100 
                    : 0;
                  const taxaCompletude = (item.corridas_aceitas || 0) > 0 
                    ? ((item.corridas_completadas || 0) / (item.corridas_aceitas || 0)) * 100 
                    : 0;
                  return (
                    <tr key={index} className="hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
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
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-100">
                          {taxaRejeicao.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100">
                          {taxaCompletude.toFixed(1)}%
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
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                <tr className="border-b-2 border-slate-300 dark:border-slate-600">
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">Sub Praça</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">Ofertadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">Aceitas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">Rejeitadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">Completadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">% Aceitação</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">% Rejeição</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">% Completude</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {aderenciaSubPraca.map((item, index) => {
                  const taxaAceitacao = (item.corridas_ofertadas || 0) > 0 
                    ? ((item.corridas_aceitas || 0) / (item.corridas_ofertadas || 0)) * 100 
                    : 0;
                  const taxaRejeicao = (item.corridas_ofertadas || 0) > 0 
                    ? ((item.corridas_rejeitadas || 0) / (item.corridas_ofertadas || 0)) * 100 
                    : 0;
                  const taxaCompletude = (item.corridas_aceitas || 0) > 0 
                    ? ((item.corridas_completadas || 0) / (item.corridas_aceitas || 0)) * 100 
                    : 0;
                  return (
                    <tr key={index} className="hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
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
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-100">
                          {taxaRejeicao.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100">
                          {taxaCompletude.toFixed(1)}%
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
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                <tr className="border-b-2 border-slate-300 dark:border-slate-600">
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">Origem</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">Ofertadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">Aceitas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">Rejeitadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">Completadas</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">% Aceitação</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">% Rejeição</th>
                  <th className="px-4 py-3 text-right text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-200">% Completude</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {aderenciaOrigem.map((item, index) => {
                  const taxaAceitacao = (item.corridas_ofertadas || 0) > 0 
                    ? ((item.corridas_aceitas || 0) / (item.corridas_ofertadas || 0)) * 100 
                    : 0;
                  const taxaRejeicao = (item.corridas_ofertadas || 0) > 0 
                    ? ((item.corridas_rejeitadas || 0) / (item.corridas_ofertadas || 0)) * 100 
                    : 0;
                  const taxaCompletude = (item.corridas_aceitas || 0) > 0 
                    ? ((item.corridas_completadas || 0) / (item.corridas_aceitas || 0)) * 100 
                    : 0;
                  return (
                    <tr key={index} className="hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
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
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-100">
                          {taxaRejeicao.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100">
                          {taxaCompletude.toFixed(1)}%
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
