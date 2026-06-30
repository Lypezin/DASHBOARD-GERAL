import React from 'react';
import { BarChart3 } from 'lucide-react';
import { ComparacaoTabelaDetalhada } from './ComparacaoTabelaDetalhada';
import { ComparacaoCharts } from './ComparacaoCharts';
import { ViewModeToggle } from './components/ViewModeToggle';
import { SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';

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
        <SaasPanel>
            <SaasPanelHeader
                eyebrow="Detalhamento"
                title="Análise detalhada"
                description="Comparativo consolidado entre as semanas selecionadas."
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
