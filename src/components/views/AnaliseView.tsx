import React, { useState, useMemo, useCallback } from 'react';
import { Totals, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import MetricCard from '../MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AnaliseView = React.memo(function AnaliseView({ 
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
  
  // Memoizar cálculos de taxas
  const taxaAceitacao = useMemo(() => totals.ofertadas > 0 ? (totals.aceitas / totals.ofertadas) * 100 : 0, [totals.ofertadas, totals.aceitas]);
  const taxaCompletude = useMemo(() => totals.aceitas > 0 ? (totals.completadas / totals.aceitas) * 100 : 0, [totals.aceitas, totals.completadas]);
  const taxaRejeicao = useMemo(() => totals.ofertadas > 0 ? (totals.rejeitadas / totals.ofertadas) * 100 : 0, [totals.ofertadas, totals.rejeitadas]);

  // Memoizar handlers
  const handleTableChange = useCallback((table: 'dia' | 'turno' | 'sub_praca' | 'origem') => {
    setActiveTable(table);
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard title="Ofertadas" value={totals.ofertadas} icon="📢" color="blue" />
        <MetricCard title="Aceitas" value={totals.aceitas} icon="✅" percentage={taxaAceitacao} percentageLabel="de aceitação" color="green" />
        <MetricCard title="Rejeitadas" value={totals.rejeitadas} icon="❌" percentage={taxaRejeicao} percentageLabel="de rejeição" color="red" />
        <MetricCard title="Completadas" value={totals.completadas} icon="🏁" percentage={taxaCompletude} percentageLabel="de completude" color="blue" />
      </div>

      {/* Análise Detalhada - Tabelas */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <Card className="relative border-0 shadow-xl bg-gradient-to-br from-white via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/10 rounded-3xl overflow-hidden">
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/5 to-blue-400/5 rounded-full blur-3xl"></div>
          
          <CardHeader className="relative pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                    Análise Detalhada por Segmento
                  </CardTitle>
                  <CardDescription className="text-base mt-1 text-slate-600 dark:text-slate-400">Métricas completas de performance</CardDescription>
                </div>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => handleTableChange('dia')}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeTable === 'dia'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
                      : 'bg-white text-slate-700 hover:bg-blue-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 hover:scale-105 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  📅 Por Dia
                </button>
                <button
                  onClick={() => handleTableChange('turno')}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeTable === 'turno'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
                      : 'bg-white text-slate-700 hover:bg-blue-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 hover:scale-105 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  🕐 Por Turno
                </button>
                <button
                  onClick={() => handleTableChange('sub_praca')}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeTable === 'sub_praca'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
                      : 'bg-white text-slate-700 hover:bg-blue-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 hover:scale-105 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  📍 Por Sub Praça
                </button>
                <button
                  onClick={() => handleTableChange('origem')}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeTable === 'origem'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
                      : 'bg-white text-slate-700 hover:bg-blue-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 hover:scale-105 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  🏢 Por Origem
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative">

            {/* Tabela por Dia */}
            {activeTable === 'dia' && aderenciaDia.length > 0 && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/50 shadow-lg">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-slate-800 dark:to-slate-700">
                    <tr className="border-b-2 border-blue-200 dark:border-slate-600">
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
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/50 shadow-lg">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-slate-800 dark:to-slate-700">
                    <tr className="border-b-2 border-blue-200 dark:border-slate-600">
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
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/50 shadow-lg">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-slate-800 dark:to-slate-700">
                    <tr className="border-b-2 border-blue-200 dark:border-slate-600">
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
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/50 shadow-lg">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-slate-800 dark:to-slate-700">
                    <tr className="border-b-2 border-blue-200 dark:border-slate-600">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

AnaliseView.displayName = 'AnaliseView';

export default AnaliseView;
