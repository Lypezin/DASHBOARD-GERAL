import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Filter, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarketingQuickFilters } from './components/MarketingQuickFilters';
import { MarketingDateRangeFilter } from './components/MarketingDateRangeFilter';
import { MarketingCityFilter } from './components/MarketingCityFilter';

interface MarketingFiltersProps {
    filters: {
        dataInicial: string;
        dataFinal: string;
        praca: string | null;
    };
    appliedFilters: {
        dataInicial: string;
        dataFinal: string;
        praca: string | null;
    };
    setFilters: React.Dispatch<React.SetStateAction<{
        dataInicial: string;
        dataFinal: string;
        praca: string | null;
    }>>;
    handleApplyFilters: () => void;
    handleClearFilters: () => void;
    handleQuickFilter: (type: 'week' | 'month' | 'quarter' | 'year') => void;
}

export const MarketingFilters = React.memo(function MarketingFilters({
    filters,
    appliedFilters,
    setFilters,
    handleApplyFilters,
    handleClearFilters,
    handleQuickFilter
}: MarketingFiltersProps) {

    const hasActiveFilters = appliedFilters.praca !== null ||
        (appliedFilters.dataInicial !== new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);

    const hasPendingChanges =
        filters.dataInicial !== appliedFilters.dataInicial ||
        filters.dataFinal !== appliedFilters.dataFinal ||
        filters.praca !== appliedFilters.praca;

    return (
        <Card className="overflow-hidden border-none shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Filter className="h-5 w-5 text-indigo-500" />
                            Filtros
                        </CardTitle>
                        <CardDescription className="mt-1 text-slate-500">
                            Selecione o período e praça, depois clique em Aplicar
                        </CardDescription>
                    </div>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFilters}
                            className="text-slate-500 hover:text-slate-700"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Limpar
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-slate-900 space-y-6">

                <MarketingQuickFilters onQuickFilter={handleQuickFilter} />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <MarketingDateRangeFilter filters={filters} setFilters={setFilters} />
                    <MarketingCityFilter filters={filters} setFilters={setFilters} />
                </div>

                {/* Botões de Ação */}
                <div className="flex justify-end pt-2 gap-3">
                    <Button
                        variant="outline"
                        onClick={handleClearFilters}
                        disabled={!hasActiveFilters && !hasPendingChanges}
                        className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Limpar Filtros
                    </Button>
                    <Button
                        onClick={handleApplyFilters}
                        disabled={!hasPendingChanges}
                        className={`w-full md:w-auto transition-all duration-300 ${hasPendingChanges
                            ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                            : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                    >
                        <Search className="h-4 w-4 mr-2" />
                        {hasPendingChanges ? 'Aplicar Filtros' : 'Filtros Atualizados'}
                    </Button>
                </div>

                {/* Resumo dos filtros ativos */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-indigo-600 bg-indigo-50 p-3 rounded-xl border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300">
                        <span className="font-medium">Filtros Aplicados:</span>
                        <Badge variant="secondary" className="bg-white dark:bg-slate-800">
                            {new Date(appliedFilters.dataInicial + 'T00:00:00').toLocaleDateString('pt-BR')}
                            {' → '}
                            {new Date(appliedFilters.dataFinal + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </Badge>
                        {appliedFilters.praca && (
                            <>
                                <span className="font-medium ml-2">Praça:</span>
                                <Badge variant="secondary" className="bg-white dark:bg-slate-800">
                                    {appliedFilters.praca}
                                </Badge>
                            </>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
});
