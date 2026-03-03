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
    <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Prioridade/Promo
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Análise detalhada de entregadores
            </p>
          </div>
        </div>
      </div>

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
        {hasMore && (
          <div className="flex justify-center p-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-800/20">
            <button
              onClick={onLoadMore}
              className="px-6 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:text-slate-900 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white shadow-sm"
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
