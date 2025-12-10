import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Entregador } from '@/types';
import { calcularPercentualAceitas, calcularPercentualCompletadas } from './EntregadoresUtils';

interface EntregadoresMainTableProps {
    sortedEntregadores: Entregador[];
    sortField: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';
    sortDirection: 'asc' | 'desc';
    onSort: (field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas') => void;
    searchTerm: string;
}

export const EntregadoresMainTable = React.memo(function EntregadoresMainTable({
    sortedEntregadores,
    sortField,
    sortDirection,
    onSort,
    searchTerm,
}: EntregadoresMainTableProps) {

    const getSortIcon = (field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas') => {
        if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400 inline" />;
        return sortDirection === 'asc' ?
            <ArrowUp className="ml-1 h-3 w-3 text-slate-900 dark:text-white inline" /> :
            <ArrowDown className="ml-1 h-3 w-3 text-slate-900 dark:text-white inline" />;
    };

    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                            Entregadores
                        </CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400">
                            Lista completa de entregadores e suas métricas de performance
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-hidden">
                    {/* Cabeçalho fixo */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-8 gap-4 px-6 py-3 min-w-[1000px]">
                            <div
                                className="cursor-pointer text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 col-span-2"
                                onClick={() => onSort('nome_entregador')}
                            >
                                Nome {getSortIcon('nome_entregador')}
                            </div>
                            <div
                                className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                                onClick={() => onSort('corridas_ofertadas')}
                            >
                                Ofertadas {getSortIcon('corridas_ofertadas')}
                            </div>
                            <div
                                className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                                onClick={() => onSort('corridas_aceitas')}
                            >
                                Aceitas {getSortIcon('corridas_aceitas')}
                            </div>
                            <div
                                className="cursor-pointer text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center gap-1"
                                onClick={() => onSort('percentual_aceitas')}
                            >
                                % Aceitas {getSortIcon('percentual_aceitas')}
                            </div>
                            <div
                                className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                                onClick={() => onSort('corridas_completadas')}
                            >
                                Completadas {getSortIcon('corridas_completadas')}
                            </div>
                            <div
                                className="cursor-pointer text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center gap-1"
                                onClick={() => onSort('percentual_completadas')}
                            >
                                % Completadas {getSortIcon('percentual_completadas')}
                            </div>
                            <div
                                className="cursor-pointer text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center gap-1"
                                onClick={() => onSort('aderencia_percentual')}
                            >
                                Aderência {getSortIcon('aderencia_percentual')}
                            </div>
                        </div>
                    </div>

                    {/* Lista com scroll */}
                    <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
                        {sortedEntregadores.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {sortedEntregadores.map((entregador) => (
                                    <div
                                        key={entregador.id_entregador}
                                        className="grid grid-cols-8 gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors min-w-[1000px]"
                                    >
                                        <div className="col-span-2">
                                            <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                {entregador.nome_entregador}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                                                {entregador.id_entregador}
                                            </div>
                                        </div>
                                        <div className="text-right text-sm text-slate-600 dark:text-slate-400">
                                            {(entregador.corridas_ofertadas || 0).toLocaleString()}
                                        </div>
                                        <div className="text-right text-sm text-slate-600 dark:text-slate-400">
                                            {(entregador.corridas_aceitas || 0).toLocaleString()}
                                        </div>
                                        <div className="text-center">
                                            <Badge variant="outline" className="font-normal">
                                                {calcularPercentualAceitas(entregador).toFixed(1)}%
                                            </Badge>
                                        </div>
                                        <div className="text-right text-sm text-slate-600 dark:text-slate-400">
                                            {(entregador.corridas_completadas || 0).toLocaleString()}
                                        </div>
                                        <div className="text-center">
                                            <Badge variant="outline" className="font-normal">
                                                {calcularPercentualCompletadas(entregador).toFixed(1)}%
                                            </Badge>
                                        </div>
                                        <div className="text-center">
                                            <Badge
                                                variant="outline"
                                                className={`font-medium ${entregador.aderencia_percentual >= 90
                                                    ? 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800'
                                                    : entregador.aderencia_percentual >= 70
                                                        ? 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
                                                        : 'text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800'
                                                    }`}
                                            >
                                                {(entregador.aderencia_percentual || 0).toFixed(1)}%
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                                {searchTerm
                                    ? `Nenhum entregador encontrado com o termo "${searchTerm}"`
                                    : 'Nenhum entregador disponível'}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});

