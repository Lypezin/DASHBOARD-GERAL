import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Entregador } from '@/types';
import { EntregadoresMainTableHeader } from './components/EntregadoresMainTableHeader';
import { EntregadoresMainTableRow } from './components/EntregadoresMainTableRow';

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
                    <EntregadoresMainTableHeader
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={onSort}
                    />

                    {/* Lista com scroll */}
                    <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
                        {sortedEntregadores.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {sortedEntregadores.map((entregador) => (
                                    <EntregadoresMainTableRow
                                        key={entregador.id_entregador}
                                        entregador={entregador}
                                    />
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
