import React from 'react';
import { Bar } from 'react-chartjs-2';
import { DashboardResumoData } from '@/types';
import { useComparacaoChartOrigem } from './hooks/useComparacaoChartOrigem';

interface ComparacaoChartOrigemProps {
    dadosComparacao: DashboardResumoData[];
    semanasSelecionadas: string[];
    origensDisponiveis: string[];
}

export const ComparacaoChartOrigem: React.FC<ComparacaoChartOrigemProps> = ({
    dadosComparacao,
    semanasSelecionadas,
    origensDisponiveis,
}) => {
    const { origemChartData, origemChartOptions } = useComparacaoChartOrigem(
        dadosComparacao,
        semanasSelecionadas,
        origensDisponiveis
    );

    if (!origemChartData) return null;

    return (
        <div className="p-6">
            <div className="h-[420px]">
                <Bar data={origemChartData as any} options={origemChartOptions} />
            </div>
        </div>
    );
};
