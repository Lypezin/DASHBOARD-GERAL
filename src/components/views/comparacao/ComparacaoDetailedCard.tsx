import React from 'react';
import { ComparacaoTabelaDetalhada } from './ComparacaoTabelaDetalhada';
import { ComparacaoCharts } from './ComparacaoCharts';
import { FileSpreadsheet } from 'lucide-react';
import { SectionCard } from './components/SectionCard';
import { ViewModeToggle } from './components/ViewModeToggle';

interface ComparacaoDetailedCardProps {
    dadosComparacao: any[];
    semanasSelecionadas: any;
    viewMode: 'table' | 'chart';
    onViewModeChange: (mode: 'table' | 'chart') => void;
}

export const ComparacaoDetailedCard: React.FC<ComparacaoDetailedCardProps> = ({
    dadosComparacao,
    semanasSelecionadas,
    viewMode,
    onViewModeChange
}) => {
    return (
        <SectionCard
            title="Análise Detalhada"
            description="Métricas comparativas entre semanas selecionadas"
            accentColor="bg-indigo-500"
            actions={<ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />}
            noPadding
        >
            {viewMode === 'table' ? (
                <ComparacaoTabelaDetalhada
                    dadosComparacao={dadosComparacao}
                    semanasSelecionadas={semanasSelecionadas}
                />
            ) : (
                <div className="p-5">
                    <ComparacaoCharts
                        dadosComparacao={dadosComparacao}
                        semanasSelecionadas={semanasSelecionadas}
                        viewMode={viewMode}
                        chartType="detalhada"
                    />
                </div>
            )}
        </SectionCard>
    );
};
