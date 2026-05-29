import React from 'react';
import { Entregador } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { PrioridadeTableHeader } from './components/PrioridadeTableHeader';
import { PrioridadeTableRow } from './components/PrioridadeTableRow';

interface PrioridadeTableProps {
  sortedEntregadores: Entregador[];
  sortField: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';
  sortDirection: 'asc' | 'desc';
  hasMore: boolean;
  onLoadMore: () => void;
  onSort: (field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas') => void;
}

export const PrioridadeTable = React.memo<PrioridadeTableProps>(({
  sortedEntregadores,
  sortField,
  sortDirection,
  hasMore,
  onLoadMore,
  onSort,
}) => {
  return (
    <Card className="border-none bg-white/50 shadow-xl backdrop-blur-sm dark:bg-slate-900/50">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800/60 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-yellow-50 p-2 dark:bg-yellow-900/20">
            <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Prioridade/Promo
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Analise detalhada de entregadores
            </p>
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        <div className="max-h-[600px] overflow-auto">
          <table className="w-full min-w-[960px]">
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
        {hasMore && (
          <div className="flex justify-center border-t border-slate-100 bg-slate-50 p-4 dark:border-slate-800/60 dark:bg-slate-800/20">
            <button
              onClick={onLoadMore}
              className="rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
            >
              Carregar mais resultados
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

PrioridadeTable.displayName = 'PrioridadeTable';
