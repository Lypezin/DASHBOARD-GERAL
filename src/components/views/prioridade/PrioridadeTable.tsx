import React from 'react';
import { Entregador } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { PrioridadeTableHeader } from './components/PrioridadeTableHeader';
import { PrioridadeTableRow } from './components/PrioridadeTableRow';

interface PrioridadeTableProps {
  sortedEntregadores: Entregador[];
  sortField: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas') => void;
}

export const PrioridadeTable = React.memo<PrioridadeTableProps>(({
  sortedEntregadores,
  sortField,
  sortDirection,
  onSort,
}) => {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Prioridade/Promo
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Análise detalhada de entregadores para priorização e promoções
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-h-[600px] overflow-auto">
          <table className="w-full">
            <PrioridadeTableHeader
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedEntregadores.map((entregador, index) => {
                const ranking = index + 1;
                return (
                  <PrioridadeTableRow
                    key={`${entregador.id_entregador}-${sortField}-${sortDirection}-${ranking}`}
                    entregador={entregador}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
});

PrioridadeTable.displayName = 'PrioridadeTable';
