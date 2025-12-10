'use client';

import React from 'react';
import { useDashboardPage } from '@/hooks/useDashboardPage';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardViewsRenderer } from '@/components/dashboard/DashboardViewsRenderer';
import { DashboardLoadingState } from '@/components/dashboard/DashboardLoadingState';
import { DashboardErrorState } from '@/components/dashboard/DashboardErrorState';
import { DashboardAuthLoading } from '@/components/dashboard/DashboardAuthLoading';
import type { AderenciaSemanal } from '@/types';

export default function DashboardPage() {
    const {
        // Auth
        isCheckingAuth,
        isAuthenticated,
        currentUser,

        // Tabs e Filtros
        activeTab,
        filters,
        setFilters,
        handleTabChange,

        // Dados
        aderenciaGeral,
        aderenciaDia,
        aderenciaTurno,
        aderenciaSubPraca,
        aderenciaOrigem,
        totals,
        anosDisponiveis,
        semanasDisponiveis,
        pracas,
        subPracas,
        origens,
        turnos,
        loading,
        error,

        // Evolução e outros dados
        evolucaoMensal,
        evolucaoSemanal,
        loadingEvolucao,
        anoSelecionado,
        setAnoEvolucao,

        utrData,
        entregadoresData,
        valoresData,
        prioridadeData,
        loadingTabData,

        chartReady,
    } = useDashboardPage();

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
        </div>
    );
}
