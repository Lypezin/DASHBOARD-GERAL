import React from 'react';
import { CalendarDays } from 'lucide-react';
import { DashboardResumoData } from '@/types';
import { ComparacaoCharts } from './ComparacaoCharts';
import { ComparacaoDiaTable } from './components/ComparacaoDiaTable';
import { ViewModeToggle } from './components/ViewModeToggle';
import { SaasPanel } from '@/components/views/shared/SaasPrimitives';
import { ComparacaoPanelHeader } from './ComparacaoSectionWrapper';
import { ViewTransition } from '@/components/ui/view-transition';

interface ComparacaoSectionProps {
    title: string;
    icon: React.ReactNode;
    description: string;
    type: 'dia' | 'subPraca' | 'origem';
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: string[];
    viewMode: 'table' | 'chart';
    onViewModeChange: (mode: 'table' | 'chart') => void;
    origensDisponiveis?: string[];
    totalColunasOrigem?: number;
}

export const ComparacaoSection = React.memo(function ComparacaoSection({
    title,
    description,
    type,
    dadosComparacao,
    semanasSelecionadas,
    viewMode,
    onViewModeChange,
}: ComparacaoSectionProps) {
    if (type === 'dia') {
        return (
            <SaasPanel className="rounded-xl border-[#d8e4eb] shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800">
                <ComparacaoPanelHeader
                    title={title}
                    description={description}
                    icon={CalendarDays}
                    actions={<ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} size="sm" layoutId="comparacao-view-dia" />}
                />

                <ViewTransition stateKey={`dia-${viewMode}`} preventExitInteraction>
                    {viewMode === 'table' ? (
                        <ComparacaoDiaTable
                            semanasSelecionadas={semanasSelecionadas}
                            dadosComparacao={dadosComparacao}
                        />
                    ) : (
                        <div className="p-4 sm:p-5">
                            <ComparacaoCharts
                                dadosComparacao={dadosComparacao}
                                semanasSelecionadas={semanasSelecionadas}
                                viewMode={viewMode}
                                chartType="dia"
                            />
                        </div>
                    )}
                </ViewTransition>
            </SaasPanel>
        );
    }

    return null;
});

ComparacaoSection.displayName = 'ComparacaoSection';
