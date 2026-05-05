
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
    DedicadoView,
} from '@/config/dynamicImports';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import type { TabType } from '@/types';

// Helper to determine if a chart is needed
export const needsChartReady = (tab: TabType) => {
    return ['evolucao', 'comparacao', 'marketing_comparacao'].includes(tab);
};

export const renderActiveView = (activeTab: TabType, props: any) => {
    switch (activeTab) {
        case 'dashboard':
            return (
                <DashboardView
                    filters={props.filters}
                    filterPayload={props.filterPayload}
                    currentUser={props.currentUser}
                    totals={props.totals}
                    aderenciaSemanal={props.aderenciaSemanal}
                    aderenciaDia={props.aderenciaDia}
                    aderenciaTurno={props.aderenciaTurno}
                    aderenciaSubPraca={props.aderenciaSubPraca}
                    aderenciaOrigem={props.aderenciaOrigem}
                />
            );
        case 'analise':
            return (
                <AnaliseView
                    filters={props.filters}
                    filterPayload={props.filterPayload}
                    currentUser={props.currentUser}
                    totals={props.totals}
                    aderenciaDia={props.aderenciaDia}
                    aderenciaTurno={props.aderenciaTurno}
                    aderenciaSubPraca={props.aderenciaSubPraca}
                    aderenciaOrigem={props.aderenciaOrigem}
                    aderenciaDiaOrigem={props.aderenciaDiaOrigem}
                />
            );
        case 'utr':
            return <UtrView filterPayload={props.filterPayload} currentUser={props.currentUser} />;
        case 'entregadores':
            return <EntregadoresMainView filterPayload={props.filterPayload} currentUser={props.currentUser} />;
        case 'valores':
            return (
                <ValoresView 
                    filters={props.filters} 
                    setFilters={props.setFilters} 
                    filterPayload={props.filterPayload} 
                    currentUser={props.currentUser}
                />
            );
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
        case 'dedicado':
            return (
                <DedicadoView
                    filterPayload={props.filterPayload}
                    currentUser={props.currentUser}
                    aderenciaOrigem={props.aderenciaOrigem}
                    aderenciaDiaOrigem={props.aderenciaDiaOrigem}
                    aderenciaDia={props.aderenciaDia}
                />
            );
        default:
            return <DashboardSkeleton contentOnly />; 
    }
};
