import React from 'react';
import { CalendarDays } from 'lucide-react';
import { DashboardResumoData } from '@/types';
import { ComparacaoCharts } from './ComparacaoCharts';
import { ComparacaoDiaTable } from './components/ComparacaoDiaTable';
import { ViewModeToggle } from './components/ViewModeToggle';
import { SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';

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

export const ComparacaoSection: React.FC<ComparacaoSectionProps> = ({
    title,
    description,
    type,
    dadosComparacao,
    semanasSelecionadas,
    viewMode,
    onViewModeChange,
}) => {
    if (type === 'dia') {
        return (
            <SaasPanel>
                <SaasPanelHeader
                    eyebrow="Dias"
                    title={title}
                    description={description}
                    icon={CalendarDays}
                    actions={<ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} size="sm" />}
                />

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
            </SaasPanel>
        );
    }

    return null;
};
