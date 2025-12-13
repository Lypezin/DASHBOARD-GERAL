
import React from 'react';
import {
    DashboardView,
    MarketingView,
    AnaliseView,
    UtrView,
    EvolucaoView,
    ValoresView,
    EntregadoresMainView,
    PrioridadePromoView,
    ComparacaoView,
    MarketingComparacaoView,
} from '@/config/dynamicImports';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import type { TabType } from '@/types';

// Helper to determine if a chart is needed
export const needsChartReady = (tab: TabType) => {
    return ['dashboard', 'analise', 'evolucao', 'comparacao', 'marketing_comparacao'].includes(tab);
};

export const renderActiveView = (activeTab: TabType, props: any) => {
    switch (activeTab) {
        case 'dashboard':
            return (
                <DashboardView
                    aderenciaGeral={props.aderenciaGeral}
                    aderenciaDia={props.aderenciaDia}
                    aderenciaTurno={props.aderenciaTurno}
                    aderenciaSubPraca={props.aderenciaSubPraca}
                    aderenciaOrigem={props.aderenciaOrigem}
                />
            );
        case 'analise':
            return props.totals ? (
                <AnaliseView
                    totals={props.totals}
                    aderenciaDia={props.aderenciaDia}
                    aderenciaTurno={props.aderenciaTurno}
                    aderenciaSubPraca={props.aderenciaSubPraca}
                    aderenciaOrigem={props.aderenciaOrigem}
                />
            ) : <DashboardSkeleton contentOnly />;
        case 'utr':
            return <UtrView utrData={props.utrData} loading={props.loadingTabData} />;
        case 'entregadores':
            return <EntregadoresMainView entregadoresData={props.entregadoresData} loading={props.loadingTabData} />;
        case 'valores':
            return <ValoresView valoresData={props.valoresData} loading={props.loadingTabData} />;
        case 'prioridade':
            return <PrioridadePromoView entregadoresData={props.prioridadeData} loading={props.loadingTabData} />;
        case 'evolucao':
            return (
                <EvolucaoView
                    evolucaoMensal={props.evolucaoMensal}
                    evolucaoSemanal={props.evolucaoSemanal}
                    loading={props.loadingEvolucao}
                    anoSelecionado={props.anoSelecionado}
                    anosDisponiveis={props.anosDisponiveis}
                    onAnoChange={props.onAnoChange}
                />
            );
        case 'comparacao':
            return (
                <ComparacaoView
                    semanas={props.semanas}
                    pracas={props.pracas}
                    subPracas={props.subPracas}
                    origens={props.origens}
                    currentUser={props.currentUser}
                />
            );
        case 'marketing_comparacao':
            return <MarketingComparacaoView filters={props.filters} />;
        case 'marketing':
            return <MarketingView />;
        default:
            return <DashboardSkeleton contentOnly />; // Or null, but skeleton is safer fallback
    }
};
