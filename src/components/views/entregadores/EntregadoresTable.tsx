'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { EntregadorMarketing } from '@/types';
import { EntregadoresTableHeader } from './components/EntregadoresTableHeader';
import { EntregadoresTableRow } from './components/EntregadoresTableRow';

interface EntregadoresTableProps {
  entregadores: EntregadorMarketing[];
  formatarSegundosParaHoras: (segundos: number) => string;
  sortField: keyof EntregadorMarketing | 'rodando';
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof EntregadorMarketing | 'rodando') => void;
}

export const EntregadoresTable = React.memo(function EntregadoresTable({
  entregadores,
  formatarSegundosParaHoras,
  sortField,
  sortDirection,
  onSort,
}: EntregadoresTableProps) {
  if (entregadores.length === 0) {
    return null;
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Lista de Entregadores
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Detalhamento de performance e status dos entregadores
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-hidden">
          <EntregadoresTableHeader
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          />

          {/* Lista com scroll */}
          <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {entregadores.map((entregador) => (
                <EntregadoresTableRow
                  key={entregador.id_entregador}
                  entregador={entregador}
                  formatarSegundosParaHoras={formatarSegundosParaHoras}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

EntregadoresTable.displayName = 'EntregadoresTable';
