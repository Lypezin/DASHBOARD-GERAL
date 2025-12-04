'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowUpDown, ArrowUp, ArrowDown, Clock, MapPin } from 'lucide-react';
import { EntregadorMarketing } from '@/types';

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

  const getSortIcon = (field: keyof EntregadorMarketing | 'rodando') => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400 inline" />;
    return sortDirection === 'asc' ?
      <ArrowUp className="ml-1 h-3 w-3 text-slate-900 dark:text-white inline" /> :
      <ArrowDown className="ml-1 h-3 w-3 text-slate-900 dark:text-white inline" />;
  };

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
          {/* Cabeçalho fixo */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-10 gap-4 px-6 py-3 min-w-[1200px]">
              <div
                className="cursor-pointer text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 col-span-2"
                onClick={() => onSort('nome')}
              >
                Nome / ID {getSortIcon('nome')}
              </div>
              <div
                className="cursor-pointer text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
                onClick={() => onSort('regiao_atuacao')}
              >
                Cidade {getSortIcon('regiao_atuacao')}
              </div>
              <div
                className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                onClick={() => onSort('total_ofertadas')}
              >
                Ofertadas {getSortIcon('total_ofertadas')}
              </div>
              <div
                className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                onClick={() => onSort('total_aceitas')}
              >
                Aceitas {getSortIcon('total_aceitas')}
              </div>
              <div
                className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                onClick={() => onSort('total_completadas')}
              >
                Completadas {getSortIcon('total_completadas')}
              </div>
              <div
                className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                onClick={() => onSort('total_rejeitadas')}
              >
                Rejeitadas {getSortIcon('total_rejeitadas')}
              </div>
              <div
                className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                onClick={() => onSort('total_segundos')}
              >
                Horas {getSortIcon('total_segundos')}
              </div>
              <div
                className="cursor-pointer text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center gap-1"
                onClick={() => onSort('dias_sem_rodar')}
              >
                Dias s/ Rodar {getSortIcon('dias_sem_rodar')}
              </div>
              <div
                className="cursor-pointer text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center gap-1"
                onClick={() => onSort('rodando')}
              >
                Status {getSortIcon('rodando')}
              </div>
            </div>
          </div>

          {/* Lista com scroll */}
          <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {entregadores.map((entregador) => {
                const estaRodando = entregador.total_completadas > 30; // Lógica simplificada baseada no original

                return (
                  <div
                    key={entregador.id_entregador}
                    className="grid grid-cols-10 gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors min-w-[1200px]"
                  >
                    <div className="col-span-2">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {entregador.nome}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate flex items-center gap-1">
                        {entregador.id_entregador.substring(0, 8)}...
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                      <MapPin className="h-3 w-3" />
                      {entregador.regiao_atuacao || 'N/A'}
                    </div>

                    <div className="text-right text-sm text-slate-600 dark:text-slate-400 font-mono">
                      {entregador.total_ofertadas.toLocaleString('pt-BR')}
                    </div>

                    <div className="text-right text-sm text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                      {entregador.total_aceitas.toLocaleString('pt-BR')}
                    </div>

                    <div className="text-right text-sm text-blue-600 dark:text-blue-400 font-mono font-medium">
                      {entregador.total_completadas.toLocaleString('pt-BR')}
                    </div>

                    <div className="text-right text-sm text-rose-600 dark:text-rose-400 font-mono font-medium">
                      {entregador.total_rejeitadas.toLocaleString('pt-BR')}
                    </div>

                    <div className="text-right text-sm text-indigo-600 dark:text-indigo-400 font-mono flex items-center justify-end gap-1">
                      <Clock className="h-3 w-3" />
                      {formatarSegundosParaHoras(entregador.total_segundos || 0)}
                    </div>

                    <div className="text-center">
                      <Badge
                        variant="outline"
                        className={`font-medium ${entregador.dias_sem_rodar === null || entregador.dias_sem_rodar === undefined
                            ? 'text-slate-500 border-slate-200 bg-slate-50'
                            : entregador.dias_sem_rodar === 0
                              ? 'text-emerald-600 border-emerald-200 bg-emerald-50'
                              : entregador.dias_sem_rodar <= 3
                                ? 'text-amber-600 border-amber-200 bg-amber-50'
                                : 'text-rose-600 border-rose-200 bg-rose-50'
                          }`}
                      >
                        {entregador.dias_sem_rodar === null || entregador.dias_sem_rodar === undefined
                          ? 'N/A'
                          : entregador.dias_sem_rodar === 0
                            ? 'Hoje'
                            : `${entregador.dias_sem_rodar} dia${entregador.dias_sem_rodar !== 1 ? 's' : ''}`
                        }
                      </Badge>
                    </div>

                    <div className="text-center">
                      <Badge
                        variant={estaRodando ? "default" : "secondary"}
                        className={estaRodando ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                      >
                        {estaRodando ? 'Rodando' : 'Parado'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

EntregadoresTable.displayName = 'EntregadoresTable';
