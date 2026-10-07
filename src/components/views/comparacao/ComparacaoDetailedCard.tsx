import React from 'react';
import { BarChart3 } from 'lucide-react';
import { ComparacaoTabelaDetalhada } from './ComparacaoTabelaDetalhada';
import { ComparacaoCharts } from './ComparacaoCharts';
import { ViewModeToggle } from './components/ViewModeToggle';
import { SaasPanel } from '@/components/views/shared/SaasPrimitives';
import { ComparacaoPanelHeader } from './ComparacaoSectionWrapper';

interface ComparacaoDetailedCardProps {
    dadosComparacao: any[];
    semanasSelecionadas: any;
    viewMode: 'table' | 'chart';
    onViewModeChange: (mode: 'table' | 'chart') => void;
}

export const ComparacaoDetailedCard = React.memo(function ComparacaoDetailedCard({
    dadosComparacao,
    semanasSelecionadas,
    viewMode,
    onViewModeChange
}: ComparacaoDetailedCardProps) {
    return (
        <SaasPanel className="rounded-xl border-[#d8e4eb] shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800">
            <ComparacaoPanelHeader
                title="Análise detalhada"
                description="Indicadores consolidados das semanas selecionadas."
                icon={BarChart3}
                actions={<ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />}
            />
            {viewMode === 'table' ? (
                <ComparacaoTabelaDetalhada
                    dadosComparacao={dadosComparacao}
                    semanasSelecionadas={semanasSelecionadas}
                />
            ) : (
                <div className="p-4 sm:p-5">
                    <ComparacaoCharts
                        dadosComparacao={dadosComparacao}
                        semanasSelecionadas={semanasSelecionadas}
                        viewMode={viewMode}
                        chartType="detalhada"
                    />
                </div>
            )}
        </SaasPanel>
    );
});

ComparacaoDetailedCard.displayName = 'ComparacaoDetailedCard';
