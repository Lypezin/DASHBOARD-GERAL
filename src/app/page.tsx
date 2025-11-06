'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getSafeErrorMessage, safeLog } from '@/lib/errorHandler';
import { sanitizeText } from '@/lib/sanitize';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import FiltroSelect from '@/components/FiltroSelect';
import FiltroMultiSelect from '@/components/FiltroMultiSelect';
import FiltroBar from '@/components/FiltroBar';
import TabButton from '@/components/TabButton';
import MetricCard from '@/components/MetricCard';
import AderenciaCard from '@/components/AderenciaCard';
import DashboardView from '@/components/views/DashboardView';
import UtrView from '@/components/views/UtrView';
import EvolucaoView from '@/components/views/EvolucaoView';
import ValoresView from '@/components/views/ValoresView';
import EntregadoresView from '@/components/views/EntregadoresView';
import PrioridadePromoView from '@/components/views/PrioridadePromoView';
import MonitoramentoView from '@/components/views/MonitoramentoView';
import ComparacaoView from '@/components/views/ComparacaoView';
import {
  Totals,
  AderenciaSemanal,
  AderenciaDia,
  AderenciaTurno,
  AderenciaSubPraca,
  AderenciaOrigem,
  FilterOption,
  Filters,
  DimensoesDashboard,
  DashboardResumoData,
  UtrData,
  EntregadoresData,
  ValoresEntregador,
  ValoresData,
  UsuarioOnline,
  MonitoramentoData,
  EvolucaoMensal,
  EvolucaoSemanal,
  UtrSemanal,
  Entregador
} from '@/types';
import { formatarHorasParaHMS, getAderenciaColor, getAderenciaBgColor } from '@/utils/formatters';
import { buildFilterPayload, safeNumber, arraysEqual } from '@/utils/helpers';

// Hook Imports
import { useDashboardData } from '@/hooks/useDashboardData';
import { useUserActivity } from '@/hooks/useUserActivity';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// =================================================================================
// Interfaces e Tipos
// =================================================================================


// =================================================================================
// Funções auxiliares
// =================================================================================



// =================================================================================
// Componente Principal
// =================================================================================


export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'utr' | 'entregadores' | 'valores' | 'evolucao' | 'monitoramento' | 'prioridade' | 'comparacao'>('dashboard');
  const [filters, setFilters] = useState<Filters>({ ano: null, semana: null, praca: null, subPraca: null, origem: null, turno: null, subPracas: [], origens: [], turnos: [], semanas: [] });
  const [anoEvolucao, setAnoEvolucao] = useState<number>(new Date().getFullYear());
  const [currentUser, setCurrentUser] = useState<{ is_admin: boolean; assigned_pracas: string[] } | null>(null);

  const {
    totals, aderenciaSemanal, aderenciaDia, aderenciaTurno, aderenciaSubPraca, aderenciaOrigem,
    anosDisponiveis, semanasDisponiveis, pracas, subPracas, origens, turnos, loading, error,
    utrData, loadingUtr, entregadoresData, loadingEntregadores, prioridadeData, loadingPrioridade,
    valoresData, loadingValores, evolucaoMensal, evolucaoSemanal, utrSemanal, loadingEvolucao,
    aderenciaGeral
  } = useDashboardData(filters, activeTab, anoEvolucao);
  
  const { sessionId, isPageVisible, registrarAtividade } = useUserActivity(activeTab, filters, currentUser);

  // Lógica para registrar atividade do usuário
  useEffect(() => {
    registrarAtividade('tab_change', `Navegou para a aba ${activeTab}`, activeTab, filters);
  }, [activeTab, registrarAtividade, filters]);

  // Lógica para buscar dados do usuário
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          throw error;
        }

        if (data) {
          setCurrentUser(data);
        } else {
          setCurrentUser(null); // No user found
        }
      } catch (err) {
        safeLog.error('Erro ao buscar usuário', err);
        setCurrentUser(null);
      }
    };

    if (sessionId) {
      fetchUser();
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1920px] px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header Principal Redesenhado */}
        <header className="mb-4 sm:mb-6 lg:mb-8 animate-fade-in">
          <div className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:shadow-3xl dark:border-white/10 dark:bg-slate-900/80">
            {/* Glow effect */}
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 opacity-0 blur-xl transition-opacity group-hover:opacity-100"></div>
            
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
            
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 lg:gap-5 p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 min-w-0 flex-1">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-lg ring-2 ring-white/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <span className="text-3xl sm:text-3xl lg:text-4xl">📊</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent dark:from-white dark:via-blue-200 dark:to-indigo-200 truncate">
                    Dashboard Operacional
                  </h1>
                  <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm lg:text-base font-semibold text-slate-600 dark:text-slate-400 truncate">
                    Sistema de Análise e Monitoramento em Tempo Real
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-4 lg:gap-5 shrink-0">
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Última atualização</p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg ring-2 ring-emerald-500/20">
                  <div className="absolute inset-0 rounded-xl bg-emerald-400/50 animate-ping"></div>
                  <span className="relative text-xl sm:text-2xl">🟢</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {loading && (
          <div className="flex h-[60vh] sm:h-[70vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 animate-spin rounded-full border-3 sm:border-4 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-400"></div>
              <p className="mt-4 text-sm sm:text-base lg:text-lg font-semibold text-blue-700 dark:text-blue-300">Carregando dashboard...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex h-[60vh] sm:h-[70vh] items-center justify-center animate-fade-in">
            <div className="max-w-sm sm:max-w-md mx-auto rounded-xl sm:rounded-2xl border border-rose-200 bg-white p-6 sm:p-8 text-center shadow-xl dark:border-rose-900 dark:bg-slate-900">
              <div className="text-4xl sm:text-5xl">⚠️</div>
              <p className="mt-4 text-lg sm:text-xl font-bold text-rose-900 dark:text-rose-100">Erro ao carregar dados</p>
              <p className="mt-2 text-sm sm:text-base text-rose-700 dark:text-rose-300">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            {/* Header com filtros e tabs */}
            <div className="group relative rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl p-4 sm:p-5 lg:p-7 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-white/30 dark:border-white/10 dark:bg-slate-900/80 animate-slide-down" style={{ position: 'relative', zIndex: 1 }}>
              {/* Subtle glow */}
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 opacity-0 blur-xl transition-opacity group-hover:opacity-100"></div>
              <div className="relative" style={{ position: 'relative', zIndex: 1 }}>
              {activeTab !== 'comparacao' && (
                <>
                  <div className="relative" style={{ isolation: 'isolate', zIndex: 99999, position: 'relative' }}>
                  <FiltroBar
                    filters={filters}
                    setFilters={setFilters}
                    anos={anosDisponiveis}
                    semanas={semanasDisponiveis}
                    pracas={pracas}
                    subPracas={subPracas}
                    origens={origens}
                    turnos={turnos}
                    currentUser={currentUser}
                  />
                  </div>
                  <div className="my-3 sm:my-4 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent dark:via-blue-700" style={{ position: 'relative', zIndex: 1 }}></div>
                </>
              )}
              {/* Tabs com scroll horizontal em mobile */}
              <div className="relative" style={{ zIndex: 1, position: 'relative' }}>
                <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-transparent">
                  <TabButton label="Dashboard" icon="📊" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                  <TabButton label="UTR" icon="📏" active={activeTab === 'utr'} onClick={() => setActiveTab('utr')} />
                  <TabButton label="Entregadores" icon="👥" active={activeTab === 'entregadores'} onClick={() => setActiveTab('entregadores')} />
                  <TabButton label="Valores" icon="💰" active={activeTab === 'valores'} onClick={() => setActiveTab('valores')} />
                  <TabButton label="Prioridade/Promo" icon="⭐" active={activeTab === 'prioridade'} onClick={() => setActiveTab('prioridade')} />
                  <TabButton label="Evolução" icon="📉" active={activeTab === 'evolucao'} onClick={() => setActiveTab('evolucao')} />
                  {currentUser?.is_admin && (
                    <TabButton label="Monitor" icon="🔍" active={activeTab === 'monitoramento'} onClick={() => setActiveTab('monitoramento')} />
                  )}
                  <TabButton label="Comparar" icon="⚖️" active={activeTab === 'comparacao'} onClick={() => setActiveTab('comparacao')} />
                </div>
                </div>
              </div>
            </div>

            {/* Conteúdo */}
            <main>
              {activeTab === 'dashboard' && (
                <DashboardView
                  aderenciaGeral={aderenciaGeral as AderenciaSemanal | undefined}
                  aderenciaDia={aderenciaDia}
                  aderenciaTurno={aderenciaTurno}
                  aderenciaSubPraca={aderenciaSubPraca}
                  aderenciaOrigem={aderenciaOrigem}
                />
              )}
              {activeTab === 'utr' && (
                <UtrView
                  utrData={utrData}
                  loading={loadingUtr}
                />
              )}
              
              {activeTab === 'entregadores' && (
                <EntregadoresView
                  entregadoresData={entregadoresData}
                  loading={loadingEntregadores}
                />
              )}
              
              {activeTab === 'valores' && (
                <ValoresView
                  valoresData={valoresData}
                  loading={loadingValores}
                />
              )}
              
              {activeTab === 'prioridade' && (
                <PrioridadePromoView
                  entregadoresData={prioridadeData}
                  loading={loadingPrioridade}
                />
              )}
              
              {activeTab === 'evolucao' && (
                <EvolucaoView
                  evolucaoMensal={evolucaoMensal}
                  evolucaoSemanal={evolucaoSemanal}
                  utrSemanal={utrSemanal}
                  loading={loadingEvolucao}
                  anoSelecionado={anoEvolucao}
                  anosDisponiveis={anosDisponiveis}
                  onAnoChange={setAnoEvolucao}
                />
              )}
              {activeTab === 'monitoramento' && (
                <MonitoramentoView />
              )}
              {activeTab === 'comparacao' && (
                <ComparacaoView
                  semanas={semanasDisponiveis}
                  pracas={pracas}
                  subPracas={subPracas}
                  origens={origens}
                  currentUser={currentUser}
                />
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}