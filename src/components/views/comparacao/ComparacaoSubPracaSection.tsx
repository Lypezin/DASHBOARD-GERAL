import React from 'react';
import { MapPin } from 'lucide-react';
import { DashboardResumoData } from '@/types';
import { ComparacaoCharts } from './ComparacaoCharts';
import { ComparacaoSubPracaTable } from './ComparacaoSubPracaTable';
import { ViewModeToggle } from './components/ViewModeToggle';
import { SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';

interface ComparacaoSubPracaSectionProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: string[];
    viewMode: 'table' | 'chart';
    onViewModeChange: (mode: 'table' | 'chart') => void;
}

export const ComparacaoSubPracaSection: React.FC<ComparacaoSubPracaSectionProps> = ({
    dadosComparacao,
    semanasSelecionadas,
    viewMode,
    onViewModeChange,
}) => {
    if (!dadosComparacao.some(d => (d.aderencia_sub_praca && d.aderencia_sub_praca.length > 0) || (d.sub_praca && d.sub_praca.length > 0))) {
        return null;
    }

    return (
        <SaasPanel>
            <SaasPanelHeader
                eyebrow="Sub-praça"
                title="Por sub-praça"
                description="Comparativo por recorte interno de operação."
                icon={MapPin}
                actions={<ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} size="sm" />}
            />
            {viewMode === 'table' ? (
                <ComparacaoSubPracaTable
                    dadosComparacao={dadosComparacao}
                    semanasSelecionadas={semanasSelecionadas}
                />
            ) : (
                <div className="p-4 sm:p-5">
                    <ComparacaoCharts
                        dadosComparacao={dadosComparacao}
                        semanasSelecionadas={semanasSelecionadas}
                        viewMode={viewMode}
                        chartType="subPraca"
                    />
                </div>
            )}
        </SaasPanel>
    );
};
