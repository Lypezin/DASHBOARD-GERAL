
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
    ResumoSemanalView,
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
                    filters={props.filters}
                    filterPayload={props.filterPayload}
                    currentUser={props.currentUser}
                />
            );
        case 'analise':
            return (
                <AnaliseView
                    filters={props.filters}
                    filterPayload={props.filterPayload}
                    currentUser={props.currentUser}
                />
            );
        case 'utr':
            return <UtrView filterPayload={props.filterPayload} currentUser={props.currentUser} />;
        case 'entregadores':
            return <EntregadoresMainView filterPayload={props.filterPayload} currentUser={props.currentUser} />;
        case 'valores':
            return <ValoresView filters={props.filters} setFilters={props.setFilters} filterPayload={props.filterPayload} currentUser={props.currentUser} />;
        case 'prioridade':
            return <PrioridadePromoView filterPayload={props.filterPayload} currentUser={props.currentUser} />;
        case 'evolucao':
            return (
                <EvolucaoView
                    filterPayload={props.filterPayload}
                    anoSelecionado={props.anoEvolucao}
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
                    anoSelecionado={props.anoEvolucao}
                />
            );
        case 'marketing_comparacao':
            return <MarketingComparacaoView filters={props.filters} />;
        case 'marketing':
            return <MarketingView />;
        case 'resumo':
            return (
                <ResumoSemanalView
                    filterPayload={props.filterPayload}
                    pracasDisponiveis={props.pracas?.map((p: { value: string }) => p.value) || []}
                    anoSelecionado={props.anoEvolucao || new Date().getFullYear()}
                />
            );
        default:
            return <DashboardSkeleton contentOnly />; 
    }
};
