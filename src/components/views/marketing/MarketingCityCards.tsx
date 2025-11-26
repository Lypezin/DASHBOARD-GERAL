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
                    <Card key={cityData.cidade} className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-200 truncate" title={cityData.cidade}>
                                {cityData.cidade}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Enviado</span>
                                    <Badge variant="outline" className="font-mono font-medium text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10">
                                        {cityData.enviado.toLocaleString('pt-BR')}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Liberado</span>
                                    <Badge variant="outline" className="font-mono font-medium text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10">
                                        {cityData.liberado.toLocaleString('pt-BR')}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Rodando Início</span>
                                    <Badge variant="outline" className="font-mono font-medium text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10">
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
