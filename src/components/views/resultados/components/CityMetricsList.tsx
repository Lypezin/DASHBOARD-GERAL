import React from 'react';
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
        <div>
            {/* Table header */}
            <div className="flex items-center gap-3.5 px-4 py-2">
                <div className="w-1.5 shrink-0" />
                <div className="flex-1">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Cidade
                    </span>
                </div>
                <div className="flex items-center gap-5 shrink-0 text-right">
                    <div><span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Env.</span></div>
                    <div><span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Lib.</span></div>
                    <div className="w-[90px]"><span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">CPL</span></div>
                    <div className="w-12"><span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Conv.</span></div>
                </div>
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-slate-100 dark:bg-slate-800" />

            {/* Rows */}
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
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
