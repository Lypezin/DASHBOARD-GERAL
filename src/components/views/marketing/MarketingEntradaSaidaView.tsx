import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EntradaSaidaView } from './EntradaSaidaView';
import { useAuth } from '@/hooks/useAuth';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { CIDADES } from '@/constants/marketing';

const MarketingEntradaSaidaView = React.memo(function MarketingEntradaSaidaView() {
    const { user } = useAuth();

    // Estado local para as datas (simplificado)
    const [dataInicial, setDataInicial] = useState<string>('');
    const [dataFinal, setDataFinal] = useState<string>('');
    const [selectedPraca, setSelectedPraca] = useState<string | null>(null);

    // Definir datas padrão no mount (ano atual)
    useEffect(() => {
        const today = new Date();
        const startYear = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        const endYear = today.toISOString().split('T')[0]; // Até hoje

        setDataInicial(startYear);
        setDataFinal(endYear);
    }, []);

    const handleClearFilters = () => {
        const today = new Date();
        const startYear = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        const endYear = today.toISOString().split('T')[0];

        setDataInicial(startYear);
        setDataFinal(endYear);
        setSelectedPraca(null);
    };

    // Quick filter presets
    const handleQuickFilter = (type: 'week' | 'month' | 'quarter' | 'year') => {
        const today = new Date();
        let start: Date;

        switch (type) {
            case 'week':
                start = new Date(today);
                start.setDate(today.getDate() - 7);
                break;
            case 'month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'quarter':
                const quarter = Math.floor(today.getMonth() / 3);
                start = new Date(today.getFullYear(), quarter * 3, 1);
                break;
            case 'year':
            default:
                start = new Date(today.getFullYear(), 0, 1);
                break;
        }

        setDataInicial(start.toISOString().split('T')[0]);
        setDataFinal(today.toISOString().split('T')[0]);
    };

    const hasActiveFilters = selectedPraca !== null ||
        (dataInicial !== new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            {/* Filtros */}
            <Card className="overflow-hidden border-0 shadow-xl shadow-slate-200/50 dark:shadow-none dark:border dark:border-slate-800">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Filter className="h-5 w-5 text-indigo-500" />
                                Filtros
                            </CardTitle>
                            <CardDescription className="mt-1 text-slate-500">
                                Selecione o período e praça para análise
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
                                value={dataInicial}
                                onChange={(e) => setDataInicial(e.target.value)}
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
                                value={dataFinal}
                                onChange={(e) => setDataFinal(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {/* Praça */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Praça
                            </label>
                            <Select
                                value={selectedPraca || "all"}
                                onValueChange={(value) => setSelectedPraca(value === "all" ? null : value)}
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

                    {/* Resumo dos filtros ativos */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-2 text-sm text-indigo-600 bg-indigo-50 p-3 rounded-xl border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300">
                            <span className="font-medium">Período:</span>
                            <Badge variant="secondary" className="bg-white dark:bg-slate-800">
                                {new Date(dataInicial + 'T00:00:00').toLocaleDateString('pt-BR')}
                                {' → '}
                                {new Date(dataFinal + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </Badge>
                            {selectedPraca && (
                                <>
                                    <span className="font-medium ml-2">Praça:</span>
                                    <Badge variant="secondary" className="bg-white dark:bg-slate-800">
                                        {selectedPraca}
                                    </Badge>
                                </>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Conteúdo Principal */}
            {dataInicial && dataFinal && (
                <EntradaSaidaView
                    dataInicial={dataInicial}
                    dataFinal={dataFinal}
                    organizationId={user?.organization_id || undefined}
                    praca={selectedPraca}
                />
            )}
        </div>
    );
});

MarketingEntradaSaidaView.displayName = 'MarketingEntradaSaidaView';

export default MarketingEntradaSaidaView;
