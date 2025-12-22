import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MarketingCityData } from '@/types';

interface MarketingCityCardsProps {
    citiesData: MarketingCityData[];
}

export const MarketingCityCards = React.memo(function MarketingCityCards({
    citiesData,
}: MarketingCityCardsProps) {
    return (
        <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                Métricas por Cidade
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {citiesData.map((cityData) => (
                    <Card key={cityData.cidade} className="border-none shadow-sm hover:shadow-lg transition-all duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm group">
                        <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800/50">
                            <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-200 truncate flex items-center justify-between" title={cityData.cidade}>
                                {cityData.cidade}
                                <div className="h-2 w-2 rounded-full bg-blue-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Enviado</span>
                                    <Badge variant="outline" className="font-mono font-bold text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-0.5">
                                        {cityData.enviado.toLocaleString('pt-BR')}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Liberado</span>
                                    <Badge variant="outline" className="font-mono font-bold text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-0.5">
                                        {cityData.liberado.toLocaleString('pt-BR')}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Rodando Início</span>
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
