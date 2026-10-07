import React from 'react';
import { Route } from 'lucide-react';
import { DashboardResumoData } from '@/types';
import { ComparacaoCharts } from './ComparacaoCharts';
import { ComparacaoOrigemTable } from './ComparacaoOrigemTable';
import { ViewModeToggle } from './components/ViewModeToggle';
import { SaasPanel } from '@/components/views/shared/SaasPrimitives';
import { ComparacaoPanelHeader } from './ComparacaoSectionWrapper';

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
        <SaasPanel className="rounded-xl border-[#d8e4eb] shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800">
            <ComparacaoPanelHeader
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
