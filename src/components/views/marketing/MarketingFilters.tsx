import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Filter, X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CIDADES } from '@/constants/marketing';

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
        <Card className="overflow-hidden border-0 shadow-xl shadow-slate-200/50 dark:shadow-none dark:border dark:border-slate-800">
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
                {/* Filtros rápidos */}
                <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-slate-500 mr-2 self-center">Período rápido:</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickFilter('week')}
                        className="text-xs"
                    >
                        Última semana
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickFilter('month')}
                        className="text-xs"
                    >
                        Este mês
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickFilter('quarter')}
                        className="text-xs"
                    >
                        Este trimestre
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickFilter('year')}
                        className="text-xs"
                    >
                        Este ano
                    </Button>
                </div>

                {/* Filtros principais */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Data Inicial */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            Data Inicial
                        </label>
                        <Input
                            type="date"
                            value={filters.dataInicial}
                            onChange={(e) => setFilters(prev => ({ ...prev, dataInicial: e.target.value }))}
                            className="w-full"
                        />
                    </div>

                    {/* Data Final */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            Data Final
                        </label>
                        <Input
                            type="date"
                            value={filters.dataFinal}
                            onChange={(e) => setFilters(prev => ({ ...prev, dataFinal: e.target.value }))}
                            className="w-full"
                        />
                    </div>

                    {/* Praça */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Praça
                        </label>
                        <Select
                            value={filters.praca || "all"}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, praca: value === "all" ? null : value }))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Todas as praças" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as praças</SelectItem>
                                {CIDADES.map((cidade) => (
                                    <SelectItem key={cidade} value={cidade}>
                                        {cidade}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Botão Aplicar */}
                <div className="flex justify-end pt-2">
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
