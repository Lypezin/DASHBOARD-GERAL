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
            {/* Section Header */}
            <div className="flex items-center gap-3 px-2">
                <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-purple-500 to-blue-600 shadow-sm" />
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                        Métricas por Cidade
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        Distribuição de dados por cidade
                    </p>
                </div>
            </div>

            {/* City Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {citiesData.map((cityData) => (
                    <Card
                        key={cityData.cidade}
                        className="border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 group overflow-hidden relative"
                    >
                        {/* Gradient Overlay */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 opacity-40 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110 duration-500" />

                        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/50 z-10 relative">
                            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate flex items-center gap-2" title={cityData.cidade}>
                                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40">
                                    <MapPin className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <span className="uppercase tracking-wide text-slate-600 dark:text-slate-300">{cityData.cidade}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 z-10 relative">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Enviado</span>
                                    </div>
                                    <Badge variant="outline" className="font-mono font-bold text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-0.5">
                                        {cityData.enviado.toLocaleString('pt-BR')}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Liberado</span>
                                    </div>
                                    <Badge variant="outline" className="font-mono font-bold text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-0.5">
                                        {cityData.liberado.toLocaleString('pt-BR')}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rodando Início</span>
                                    </div>
                                    <Badge variant="outline" className="font-mono font-bold text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 px-2.5 py-0.5">
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

