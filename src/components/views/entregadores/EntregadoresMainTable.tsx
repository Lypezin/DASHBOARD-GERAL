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
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                <th
                                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors"
                                    onClick={() => onSort('nome_entregador')}
                                >
                                    Nome {getSortIcon('nome_entregador')}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors"
                                    onClick={() => onSort('corridas_ofertadas')}
                                >
                                    Ofertadas {getSortIcon('corridas_ofertadas')}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors"
                                    onClick={() => onSort('corridas_aceitas')}
                                >
                                    Aceitas {getSortIcon('corridas_aceitas')}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors"
                                    onClick={() => onSort('percentual_aceitas')}
                                >
                                    % Aceitas {getSortIcon('percentual_aceitas')}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors"
                                    onClick={() => onSort('corridas_completadas')}
                                >
                                    Completadas {getSortIcon('corridas_completadas')}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors"
                                    onClick={() => onSort('percentual_completadas')}
                                >
                                    % Completadas {getSortIcon('percentual_completadas')}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors"
                                    onClick={() => onSort('aderencia_percentual')}
                                >
                                    Aderência {getSortIcon('aderencia_percentual')}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors"
                                    onClick={() => onSort('rejeicao_percentual')}
                                >
                                    Rejeição {getSortIcon('rejeicao_percentual')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {sortedEntregadores.map((entregador, index) => (
                                <tr
                                    key={entregador.id_entregador}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                                            {entregador.nome_entregador}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            {entregador.id_entregador}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                                        {entregador.corridas_ofertadas.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                                        {entregador.corridas_aceitas.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge variant="outline" className="font-normal">
                                            {calcularPercentualAceitas(entregador).toFixed(1)}%
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                                        {entregador.corridas_completadas.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge variant="outline" className="font-normal">
                                            {calcularPercentualCompletadas(entregador).toFixed(1)}%
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge
                                            variant="outline"
                                            className={`font-medium ${entregador.aderencia_percentual >= 90
                                                ? 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800'
                                                : entregador.aderencia_percentual >= 70
                                                    ? 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
                                                    : 'text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800'
                                                }`}
                                        >
                                            {entregador.aderencia_percentual.toFixed(1)}%
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge
                                            variant="outline"
                                            className={`font-medium ${entregador.rejeicao_percentual <= 10
                                                ? 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800'
                                                : entregador.rejeicao_percentual <= 30
                                                    ? 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
                                                    : 'text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800'
                                                }`}
                                        >
                                            {entregador.rejeicao_percentual.toFixed(1)}%
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {sortedEntregadores.length === 0 && searchTerm && (
                    <div className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        Nenhum entregador encontrado com o termo &quot;{searchTerm}&quot;
                    </div>
                )}
            </CardContent>
        </Card>
    );
});
