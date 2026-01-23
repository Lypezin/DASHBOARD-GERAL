'use client';

import { useSearchParams } from 'next/navigation';
import React from 'react';
import { useDashboardPage } from '@/hooks/useDashboardPage';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardViewsRenderer } from '@/components/dashboard/DashboardViewsRenderer';
import { DashboardLoadingState } from '@/components/dashboard/DashboardLoadingState';
import { DashboardErrorState } from '@/components/dashboard/DashboardErrorState';
import { DashboardAuthLoading } from '@/components/dashboard/DashboardAuthLoading';
import type { AderenciaSemanal } from '@/types';

export default function DashboardPage() {
    return (
        <React.Suspense fallback={<DashboardLoadingState />}>
            <DashboardContent />
        </React.Suspense>
    );
}

function DashboardContent() {
    const { auth, ui, filters: filtersGroup, data } = useDashboardPage();

    // Destructure for easier access
    const { isCheckingAuth, isAuthenticated, currentUser } = auth;
    const { activeTab, handleTabChange, chartReady, loading, error } = ui;
    const { state: filters, setState: setFilters, options } = filtersGroup;
    const {
        anos: anosDisponiveis,
        semanas: semanasDisponiveis,
        pracas,
        subPracas,
        origens,
        turnos
    } = options;

    // Dashboard data
    const {
        aderenciaGeral,
        aderenciaDia,
        aderenciaTurno,
        aderenciaSubPraca,
        aderenciaOrigem,
        totals
    } = data.dashboard;

    // Tab data
    const {
        utrData,
        entregadoresData,
        valoresData,
        prioridadeData,
        loading: loadingTabData
    } = data.tabs;

    // Evolution data
    const {
        mensal: evolucaoMensal,
        semanal: evolucaoSemanal,
        loading: loadingEvolucao,
        anoSelecionado,
        setAno: setAnoEvolucao
    } = data.evolution;

    if (isCheckingAuth) return <DashboardAuthLoading />;
    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20">
            <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
                {loading && <DashboardLoadingState />}
                {error && <DashboardErrorState error={error} />}

                {!loading && !error && (
                    <div className="space-y-4 animate-fade-in">
                        <DashboardHeader
                            filters={filters}
                            setFilters={setFilters}
                            anosDisponiveis={anosDisponiveis}
                            semanasDisponiveis={semanasDisponiveis}
                            pracas={pracas}
                            subPracas={subPracas}
                            origens={origens}
                            turnos={turnos}
                            currentUser={currentUser}
                            activeTab={activeTab}
                            onTabChange={handleTabChange}
                        />

                        <main>
                            <DashboardViewsRenderer
                                activeTab={activeTab}
                                chartReady={chartReady}
                                aderenciaGeral={aderenciaGeral as AderenciaSemanal | undefined}
                                aderenciaDia={aderenciaDia}
                                aderenciaTurno={aderenciaTurno}
                                aderenciaSubPraca={aderenciaSubPraca}
                                aderenciaOrigem={aderenciaOrigem}
                                totals={totals || undefined}
                                utrData={utrData}
                                loadingTabData={loadingTabData}
                                entregadoresData={entregadoresData}
                                valoresData={valoresData}
                                prioridadeData={prioridadeData}
                                evolucaoMensal={evolucaoMensal}
                                evolucaoSemanal={evolucaoSemanal}
                                loadingEvolucao={loadingEvolucao}
                                anoSelecionado={anoSelecionado}
                                anosDisponiveis={anosDisponiveis}
                                onAnoChange={setAnoEvolucao}
                                semanas={semanasDisponiveis}
                                pracas={pracas}
                                subPracas={subPracas}
                                origens={origens}
                                currentUser={currentUser}
                                filters={filters}
                            />
                        </main>
                    </div>
                )}
            </div>
            <DebugUrlState filters={filters} activeTab={activeTab} />
        </div>
    );
}

function DebugUrlState({ filters, activeTab }: { filters: any, activeTab: string }) {
    const searchParams = useSearchParams();
    // Force re-render when URL changes
    const paramsString = searchParams.toString();

    return (
        <div className="fixed bottom-4 right-4 p-4 bg-black/90 text-green-400 text-xs font-mono rounded-lg shadow-2xl z-50 border border-green-500/30 max-w-md pointer-events-none opacity-80">
            <div className="font-bold border-b border-green-500/30 mb-2 pb-1">DEBUG STATE (Tire print)</div>
            <div className="space-y-1">
                <div className="break-all"><span className="text-white">URL Search:</span> {paramsString || '(empty)'}</div>
                <div><span className="text-white">Active Tab:</span> {activeTab}</div>
                <div><span className="text-white">Filter Ano:</span> {filters.ano}</div>
                <div><span className="text-white">Time:</span> {new Date().toLocaleTimeString()}</div>
            </div>
        </div>
    );
}
