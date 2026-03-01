import React from 'react';
import { MetricDetailList } from './MetricDetailList';

interface DesistenciasListProps {
    marketingNovosNames: string[];
    operacionalNovosNames: string[];
    isEntrada: boolean;
}

export const DesistenciasList: React.FC<DesistenciasListProps> = ({
    marketingNovosNames,
    operacionalNovosNames,
    isEntrada
}) => {
    return (
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase text-amber-600 dark:text-amber-500 mb-3 flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                Desistências (Novos - não maturados)
            </h4>

            <div className="space-y-4">
                <MetricDetailList
                    title="Marketing"
                    items={marketingNovosNames}
                    type="marketing-novos"
                    isEntrada={isEntrada}
                />
                <MetricDetailList
                    title="Operacional"
                    items={operacionalNovosNames}
                    type="operacional-novos"
                    isEntrada={isEntrada}
                />
            </div>
        </div>
    );
};
