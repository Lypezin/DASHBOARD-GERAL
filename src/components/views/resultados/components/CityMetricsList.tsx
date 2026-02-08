import React from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AtendenteCidadeData } from '@/types';
import { CityMetricItem } from './CityMetricItem';

interface CityMetricsListProps {
    cidades: AtendenteCidadeData[];
    atendenteNome: string;
}

export const CityMetricsList: React.FC<CityMetricsListProps> = ({ cidades, atendenteNome }) => {
    const activeCidades = cidades.filter(c => c.enviado > 0 || c.liberado > 0);

    if (activeCidades.length === 0) return null;

    return (
        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800">
                        <MapPin className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                    </div>
                    <h4 className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Por Cidade
                    </h4>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[9px] font-medium">
                        {activeCidades.length}
                    </Badge>
                </div>
                <ChevronDown className="h-3 w-3 text-slate-400" />
            </div>

            {/* Lista de cidades com fade */}
            <div className="relative flex-1 min-h-0">
                {/* Fade superior */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />

                <div className="space-y-2 overflow-y-auto pr-1 max-h-48 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 py-1">
                    {activeCidades.map((cidadeData) => (
                        <CityMetricItem
                            key={`${atendenteNome}-${cidadeData.cidade}`}
                            cidadeData={cidadeData}
                            atendenteNome={atendenteNome}
                        />
                    ))}
                </div>

                {/* Fade inferior */}
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
            </div>
        </div>
    );
};
