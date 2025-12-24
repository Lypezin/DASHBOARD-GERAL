
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { ValoresEntregador } from '@/types';
import { ValoresTableRow } from './components/ValoresTableRow';

interface ValoresTableProps {
    sortedValores: ValoresEntregador[];
    sortField: keyof ValoresEntregador;
    sortDirection: 'asc' | 'desc';
    onSort: (field: keyof ValoresEntregador) => void;
    formatarReal: (valor: number | null | undefined) => string;
}

export const ValoresTable = React.memo(function ValoresTable({
    sortedValores,
    sortField,
    sortDirection,
    onSort,
    formatarReal,
}: ValoresTableProps) {

    const SortIcon = ({ field }: { field: keyof ValoresEntregador }) => {
        if (sortField !== field) {
            return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400" />;
        }
        return sortDirection === 'asc' ?
            <ArrowUp className="ml-1 h-3 w-3 text-slate-900 dark:text-white" /> :
            <ArrowDown className="ml-1 h-3 w-3 text-slate-900 dark:text-white" />;
    };

    return (
        <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <DollarSign className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="bg-emerald-500 w-1.5 h-5 rounded-full inline-block"></span>
                            Valores por Entregador
                        </CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400">
                            Detalhamento financeiro individual
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-hidden">
                    {/* Cabeçalho fixo */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-4 gap-4 px-6 py-3 min-w-[600px]">
                            <div
                                className="cursor-pointer text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
                                onClick={() => onSort('nome_entregador')}
                            >
                                Entregador
                                <SortIcon field="nome_entregador" />
                            </div>
                            <div
                                className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                                onClick={() => onSort('total_taxas')}
                            >
                                Total
                                <SortIcon field="total_taxas" />
                            </div>
                            <div
                                className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                                onClick={() => onSort('numero_corridas_aceitas')}
                            >
                                Corridas
                                <SortIcon field="numero_corridas_aceitas" />
                            </div>
                            <div
                                className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                                onClick={() => onSort('taxa_media')}
                            >
                                Média
                                <SortIcon field="taxa_media" />
                            </div>
                        </div>
                    </div>

                    {/* Lista otimizada */}
                    <div className="max-h-[500px] sm:max-h-[600px] overflow-x-auto overflow-y-auto">
                        {sortedValores.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {sortedValores.map((entregador, index) => {
                                    if (!entregador) return null;
                                    return (
                                        <ValoresTableRow
                                            key={`${entregador.id_entregador}-${index}`}
                                            entregador={entregador}
                                            ranking={index + 1}
                                            formatarReal={formatarReal}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                                Nenhum dado para exibir
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});
