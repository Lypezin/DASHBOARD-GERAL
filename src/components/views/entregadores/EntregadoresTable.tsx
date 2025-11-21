'use client';

import React from 'react';
import { EntregadorMarketing } from '@/types';

interface EntregadoresTableProps {
  entregadores: EntregadorMarketing[];
  formatarSegundosParaHoras: (segundos: number) => string;
}

export const EntregadoresTable = React.memo(function EntregadoresTable({
  entregadores,
  formatarSegundosParaHoras,
}: EntregadoresTableProps) {
  if (entregadores.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                Nome
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                Cidade
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                Ofertadas
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                Aceitas
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                Completadas
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                Rejeitadas
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                Horas
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                Dias sem Rodar
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                Rodando
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {entregadores.map((entregador) => {
              const estaRodando = entregador.total_completadas > 30;
              return (
                <tr
                  key={entregador.id_entregador}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                      {entregador.id_entregador.substring(0, 8)}...
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {entregador.nome}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {entregador.regiao_atuacao || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {entregador.total_ofertadas.toLocaleString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {entregador.total_aceitas.toLocaleString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {entregador.total_completadas.toLocaleString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                      {entregador.total_rejeitadas.toLocaleString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      {formatarSegundosParaHoras(entregador.total_segundos || 0)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={`text-sm font-semibold ${
                      entregador.dias_sem_rodar === null || entregador.dias_sem_rodar === undefined
                        ? 'text-slate-400 dark:text-slate-500'
                        : entregador.dias_sem_rodar === 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : entregador.dias_sem_rodar <= 3
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {entregador.dias_sem_rodar === null || entregador.dias_sem_rodar === undefined
                        ? 'N/A'
                        : entregador.dias_sem_rodar === 0
                        ? 'Hoje'
                        : `${entregador.dias_sem_rodar} dia${entregador.dias_sem_rodar !== 1 ? 's' : ''}`
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`text-sm font-semibold ${
                      estaRodando
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {estaRodando ? 'SIM' : 'NÃO'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

EntregadoresTable.displayName = 'EntregadoresTable';

