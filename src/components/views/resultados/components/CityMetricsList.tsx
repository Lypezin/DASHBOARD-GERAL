import React from 'react';
import { MapPin } from 'lucide-react';
import { AtendenteCidadeData } from '@/types';
import { CityMetricItem } from './CityMetricItem';

interface CityMetricsListProps {
    cidades: AtendenteCidadeData[];
    atendenteNome: string;
}

export const CityMetricsList: React.FC<CityMetricsListProps> = ({ cidades, atendenteNome }) => {
    const activeCidades = cidades
        .filter(c => c.enviado > 0 || c.liberado > 0)
        .sort((a, b) => {
            const liberadoDiff = (b.liberado || 0) - (a.liberado || 0);
            if (liberadoDiff !== 0) return liberadoDiff;
            const enviadoDiff = (b.enviado || 0) - (a.enviado || 0);
            if (enviadoDiff !== 0) return enviadoDiff;
            return a.cidade.localeCompare(b.cidade, 'pt-BR');
        });

    if (activeCidades.length === 0) return null;

    return (
        <div className="space-y-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Detalhamento por cidade
                    </span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tabular-nums">
                    {activeCidades.length} ativas
                </span>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {activeCidades.map((cidadeData) => (
                    <CityMetricItem
                        key={`${atendenteNome}-${cidadeData.cidade}`}
                        cidadeData={cidadeData}
                        atendenteNome={atendenteNome}
                    />
                ))}
            </div>
        </div>
    );
};
