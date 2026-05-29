'use client';

import React from 'react';

interface MarketingCityCardProps {
    cidade: string;
    enviado: number;
    liberado: number;
    rodandoInicio: number;
}

const MarketingCityCard: React.FC<MarketingCityCardProps> = ({
    cidade,
    enviado,
    liberado,
    rodandoInicio,
}) => {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/90 p-4 shadow-sm transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-lg dark:border-slate-800/70 dark:bg-slate-900/85 sm:p-5 md:p-6">
            <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-gradient-to-br from-sky-500 to-blue-500 opacity-10 blur-3xl transition-opacity group-hover:opacity-20 sm:h-40 sm:w-40" />

            <div className="relative">
                <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
                    <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900 dark:text-white sm:text-base" title={cidade}>
                        {cidade}
                    </h3>
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50/90 px-3 py-2.5 dark:bg-emerald-950/30">
                        <span className="shrink-0 text-xs font-medium text-emerald-700 dark:text-emerald-300 sm:text-sm">
                            Enviado
                        </span>
                        <span className="font-mono text-sm font-bold text-emerald-900 dark:text-emerald-100 sm:text-base">
                            {enviado.toLocaleString('pt-BR')}
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-xl bg-blue-50/90 px-3 py-2.5 dark:bg-blue-950/30">
                        <span className="shrink-0 text-xs font-medium text-blue-700 dark:text-blue-300 sm:text-sm">
                            Liberado
                        </span>
                        <span className="font-mono text-sm font-bold text-blue-900 dark:text-blue-100 sm:text-base">
                            {liberado.toLocaleString('pt-BR')}
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-xl bg-sky-50/90 px-3 py-2.5 dark:bg-sky-950/30">
                        <span className="shrink-0 text-xs font-medium text-sky-700 dark:text-sky-300 sm:text-sm">
                            Rodando Inicio
                        </span>
                        <span className="font-mono text-sm font-bold text-sky-900 dark:text-sky-100 sm:text-base">
                            {rodandoInicio.toLocaleString('pt-BR')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketingCityCard;
