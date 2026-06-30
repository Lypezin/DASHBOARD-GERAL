import React from 'react';
import { Route } from 'lucide-react';
import { DashboardResumoData } from '@/types';
import { ComparacaoCharts } from './ComparacaoCharts';
import { ComparacaoOrigemTable } from './ComparacaoOrigemTable';
import { ViewModeToggle } from './components/ViewModeToggle';
import { SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';

interface ComparacaoOrigemSectionProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: string[];
    viewMode: 'table' | 'chart';
    onViewModeChange: (mode: 'table' | 'chart') => void;
    origensDisponiveis: string[];
    totalColunasOrigem: number;
}

export const ComparacaoOrigemSection = React.memo(function ComparacaoOrigemSection({
    dadosComparacao,
    semanasSelecionadas,
    viewMode,
    onViewModeChange,
    origensDisponiveis,
}: ComparacaoOrigemSectionProps) {
    if (origensDisponiveis.length === 0) return null;

    return (
        <SaasPanel>
            <SaasPanelHeader
                eyebrow="Origem"
                title="Por origem"
                description="Comparativo por canal operacional."
                icon={Route}
                actions={<ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} size="sm" />}
            />
            {viewMode === 'table' ? (
                <ComparacaoOrigemTable
                    semanasSelecionadas={semanasSelecionadas}
                    dadosComparacao={dadosComparacao}
                />
            ) : (
                <div className="p-4 sm:p-5">
                    <ComparacaoCharts
                        dadosComparacao={dadosComparacao}
                        semanasSelecionadas={semanasSelecionadas}
                        viewMode={viewMode}
                        chartType="origem"
                        origensDisponiveis={origensDisponiveis}
                    />
                </div>
            )}
        </SaasPanel>
    );
});

ComparacaoOrigemSection.displayName = 'ComparacaoOrigemSection';
