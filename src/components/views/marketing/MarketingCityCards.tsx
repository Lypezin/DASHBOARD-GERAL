'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { MarketingCityData } from '@/types';

interface MarketingCityCardsProps {
    citiesData: MarketingCityData[];
}

export const MarketingCityCards = React.memo(function MarketingCityCards({
    citiesData,
}: MarketingCityCardsProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
                <div className="h-8 w-1.5 rounded-full bg-blue-600 shadow-sm" />
                <div>
                    <h3 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                        Metricas por cidade
                    </h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Distribuicao de dados por cidade
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {citiesData.map((cityData) => (
                    <Card
                        key={cityData.cidade}
                        className="group relative overflow-hidden border-none bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:shadow-md dark:bg-slate-900 dark:ring-slate-800/50"
                    >
                        <CardHeader className="relative z-10 border-b border-slate-100 pb-3 dark:border-slate-800/50">
                            <CardTitle className="flex items-center gap-2 truncate text-sm font-semibold text-slate-700 dark:text-slate-200" title={cityData.cidade}>
                                <div className="rounded-lg bg-blue-100 p-1.5 dark:bg-blue-900/40">
                                    <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-300" />
                                </div>
                                <span className="uppercase tracking-wide text-slate-600 dark:text-slate-300">{cityData.cidade}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10 pt-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 transition-colors hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Enviado</span>
                                    </div>
                                    <Badge variant="outline" className="bg-emerald-50 px-2.5 py-0.5 font-mono font-bold text-emerald-600 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                                        {cityData.enviado.toLocaleString('pt-BR')}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 transition-colors hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Liberado</span>
                                    </div>
                                    <Badge variant="outline" className="bg-blue-50 px-2.5 py-0.5 font-mono font-bold text-blue-600 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                        {cityData.liberado.toLocaleString('pt-BR')}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 transition-colors hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-sky-500" />
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Rodando Inicio</span>
                                    </div>
                                    <Badge variant="outline" className="bg-sky-50 px-2.5 py-0.5 font-mono font-bold text-sky-600 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-300">
                                        {cityData.rodandoInicio.toLocaleString('pt-BR')}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
});
