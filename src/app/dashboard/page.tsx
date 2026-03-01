'use client';

import React from 'react';
import { useDashboardPage } from '@/hooks/dashboard/useDashboardPage';
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
    const { auth, ui, filters: fGroup, data } = useDashboardPage();

    if (auth.isCheckingAuth) return <DashboardAuthLoading />;
    if (!auth.isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20">
            <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
                {ui.loading && <DashboardLoadingState />}
                {ui.error && <DashboardErrorState error={ui.error} />}

                {!ui.loading && !ui.error && (
                    <div className="space-y-4 animate-fade-in">
                        <DashboardHeader
                            filters={fGroup.state}
                            setFilters={fGroup.setState}
                            anosDisponiveis={fGroup.options.anos}
                            semanasDisponiveis={fGroup.options.semanas}
                            pracas={fGroup.options.pracas}
                            subPracas={fGroup.options.subPracas}
                            origens={fGroup.options.origens}
                            turnos={fGroup.options.turnos}
                            currentUser={auth.currentUser}
                            activeTab={ui.activeTab}
                            onTabChange={ui.handleTabChange}
                        />
                        <main>
                            <DashboardViewsRenderer
                                activeTab={ui.activeTab}
                                chartReady={ui.chartReady}
                                aderenciaGeral={data.dashboard.aderenciaGeral as AderenciaSemanal | undefined}
                                aderenciaDia={data.dashboard.aderenciaDia}
                                aderenciaTurno={data.dashboard.aderenciaTurno}
                                aderenciaSubPraca={data.dashboard.aderenciaSubPraca}
                                aderenciaOrigem={data.dashboard.aderenciaOrigem}
                                totals={data.dashboard.totals || undefined}
                                utrData={data.tabs.utrData}
                                loadingTabData={data.tabs.loading}
                                entregadoresData={data.tabs.entregadoresData}
                                valoresData={data.tabs.valoresData}
                                prioridadeData={data.tabs.prioridadeData}
                                evolucaoMensal={data.evolution.mensal}
                                evolucaoSemanal={data.evolution.semanal}
                                loadingEvolucao={data.evolution.loading}
                                anoSelecionado={data.evolution.anoSelecionado}
                                anosDisponiveis={fGroup.options.anos}
                                onAnoChange={data.evolution.setAno}
                                semanas={fGroup.options.semanas}
                                pracas={fGroup.options.pracas}
                                subPracas={fGroup.options.subPracas}
                                origens={fGroup.options.origens}
                                currentUser={auth.currentUser}
                                filters={fGroup.state}
                            />
                        </main>
                    </div>
                )}
            </div>
        </div>
    );
}


