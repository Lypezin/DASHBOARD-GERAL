'use client';

import React from 'react';
import { useDashboardPage } from '@/hooks/dashboard/useDashboardPage';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardViewsRenderer } from '@/components/dashboard/DashboardViewsRenderer';
import { DashboardLoadingState } from '@/components/dashboard/DashboardLoadingState';
import { DashboardErrorState } from '@/components/dashboard/DashboardErrorState';
import { DashboardAuthLoading } from '@/components/dashboard/DashboardAuthLoading';
import { ActivityTracker } from '@/components/dashboard/ActivityTracker';
import type { AderenciaSemanal } from '@/types';

export default function DashboardPage() {
    return (
        <React.Suspense fallback={<DashboardLoadingState />}>
            <DashboardContent />
        </React.Suspense>
    );
}

function DashboardContent() {
    const { auth, ui, filters, anoEvolucao, data } = useDashboardPage();

    if (auth.isCheckingAuth) return <DashboardAuthLoading />;
    if (!auth.isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20">
            <ActivityTracker activeTab={ui.activeTab} filters={filters.state} currentUser={auth.currentUser} />
            <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
                {ui.loading && <DashboardLoadingState />}
                {ui.error && <DashboardErrorState error={ui.error} />}

                {!ui.loading && !ui.error && (
                    <div className="space-y-4 animate-fade-in">
                        <DashboardHeader
                            filters={filters.state}
                            setFilters={filters.setState}
                            anosDisponiveis={filters.options.anos}
                            semanasDisponiveis={filters.options.semanas}
                            pracas={filters.options.pracas}
                            subPracas={filters.options.subPracas}
                            origens={filters.options.origens}
                            turnos={filters.options.turnos}
                            currentUser={auth.currentUser}
                            activeTab={ui.activeTab}
                            onTabChange={ui.handleTabChange}
                        />
                        <main>
                            <DashboardViewsRenderer
                                activeTab={ui.activeTab}
                                chartReady={ui.chartReady}
                                currentUser={auth.currentUser}
                                filters={filters.state}
                                setFilters={filters.setState}
                                filterPayload={filters.payload}
                                anoEvolucao={anoEvolucao.valor}
                                onAnoChange={anoEvolucao.set}
                                semanas={filters.options.semanas}
                                pracas={filters.options.pracas}
                                subPracas={filters.options.subPracas}
                                origens={filters.options.origens}
                                totals={data.totals}
                                aderenciaSemanal={data.aderenciaSemanal}
                                aderenciaDia={data.aderenciaDia}
                                aderenciaTurno={data.aderenciaTurno}
                                aderenciaSubPraca={data.aderenciaSubPraca}
                                aderenciaOrigem={data.aderenciaOrigem}
                                aderenciaDiaOrigem={data.aderenciaDiaOrigem}
                            />
                        </main>
                    </div>
                )}
            </div>
        </div>
    );
}


