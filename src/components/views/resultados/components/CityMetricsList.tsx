import React from 'react';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                        <MapPin className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                            Resultados por cidade
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Tudo visível sem rolagem interna
                        </p>
                    </div>
                </div>
                <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-medium">
                    {activeCidades.length} cidades
                </Badge>
            </div>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
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
