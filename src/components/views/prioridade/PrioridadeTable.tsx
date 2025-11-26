import React from 'react';
import { Entregador } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, ArrowUp, ArrowDown, Star } from 'lucide-react';

interface PrioridadeTableProps {
  sortedEntregadores: Entregador[];
  sortField: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas') => void;
  calcularPercentualAceitas: (entregador: Entregador) => number;
  calcularPercentualCompletadas: (entregador: Entregador) => number;
  getAderenciaColor: (aderencia: number) => string;
  getAderenciaBg: (aderencia: number) => string;
  getRejeicaoColor: (rejeicao: number) => string;
  getRejeicaoBg: (rejeicao: number) => string;
  getAceitasColor: (percentual: number) => string;
  getAceitasBg: (percentual: number) => string;
  getCompletadasColor: (percentual: number) => string;
  getCompletadasBg: (percentual: number) => string;
}

const SortIcon = ({
  field,
  currentField,
  direction
}: {
  field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';
  currentField: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas';
  direction: 'asc' | 'desc';
}) => {
  if (currentField !== field) {
    return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400 inline" />;
  }
  return direction === 'asc' ?
    <ArrowUp className="ml-1 h-3 w-3 text-slate-900 dark:text-white inline" /> :
    <ArrowDown className="ml-1 h-3 w-3 text-slate-900 dark:text-white inline" />;
};

export const PrioridadeTable: React.FC<PrioridadeTableProps> = ({
  sortedEntregadores,
  sortField,
  sortDirection,
  onSort,
  calcularPercentualAceitas,
  calcularPercentualCompletadas,
  getAderenciaColor,
  getAderenciaBg,
  getRejeicaoColor,
  getRejeicaoBg,
  getAceitasColor,
  getAceitasBg,
  getCompletadasColor,
  getCompletadasBg,
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
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th
                  className="cursor-pointer px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  onClick={() => onSort('nome_entregador')}
                >
                  Entregador <SortIcon field="nome_entregador" currentField={sortField} direction={sortDirection} />
                </th>
                <th
                  className="cursor-pointer px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  onClick={() => onSort('corridas_ofertadas')}
                >
                  Ofertadas <SortIcon field="corridas_ofertadas" currentField={sortField} direction={sortDirection} />
                </th>
                <th
                  className="cursor-pointer px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  onClick={() => onSort('corridas_aceitas')}
                >
                  Aceitas <SortIcon field="corridas_aceitas" currentField={sortField} direction={sortDirection} />
                </th>
                <th
                  className="cursor-pointer px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  onClick={() => onSort('corridas_rejeitadas')}
                >
                  Rejeitadas <SortIcon field="corridas_rejeitadas" currentField={sortField} direction={sortDirection} />
                </th>
                <th
                  className="cursor-pointer px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  onClick={() => onSort('percentual_aceitas')}
                >
                  % Aceitas <SortIcon field="percentual_aceitas" currentField={sortField} direction={sortDirection} />
                </th>
                <th
                  className="cursor-pointer px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  onClick={() => onSort('corridas_completadas')}
                >
                  Completadas <SortIcon field="corridas_completadas" currentField={sortField} direction={sortDirection} />
                </th>
                <th
                  className="cursor-pointer px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  onClick={() => onSort('percentual_completadas')}
                >
                  % Completadas <SortIcon field="percentual_completadas" currentField={sortField} direction={sortDirection} />
                </th>
                <th
                  className="cursor-pointer px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  onClick={() => onSort('aderencia_percentual')}
                >
                  Aderência <SortIcon field="aderencia_percentual" currentField={sortField} direction={sortDirection} />
                </th>
                <th
                  className="cursor-pointer px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  onClick={() => onSort('rejeicao_percentual')}
                >
                  % Rejeição <SortIcon field="rejeicao_percentual" currentField={sortField} direction={sortDirection} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedEntregadores.map((entregador, index) => {
                const ranking = index + 1;
                const percentualAceitas = calcularPercentualAceitas(entregador);
                const percentualCompletadas = calcularPercentualCompletadas(entregador);

                return (
                  <tr
                    key={`${entregador.id_entregador}-${sortField}-${sortDirection}-${ranking}`}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{entregador.nome_entregador}</td>
                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400 whitespace-nowrap">{entregador.corridas_ofertadas.toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 text-center text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{entregador.corridas_aceitas.toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 text-center text-rose-600 dark:text-rose-400 whitespace-nowrap">{entregador.corridas_rejeitadas.toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className={`font-normal ${getAceitasBg(percentualAceitas)} ${getAceitasColor(percentualAceitas)} whitespace-nowrap`}>
                        {percentualAceitas.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center text-blue-600 dark:text-blue-400 whitespace-nowrap">{entregador.corridas_completadas.toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className={`font-normal ${getCompletadasBg(percentualCompletadas)} ${getCompletadasColor(percentualCompletadas)} whitespace-nowrap`}>
                        {percentualCompletadas.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className={`font-medium ${getAderenciaBg(entregador.aderencia_percentual ?? 0)} ${getAderenciaColor(entregador.aderencia_percentual ?? 0)} whitespace-nowrap`}>
                        {(entregador.aderencia_percentual ?? 0).toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className={`font-medium ${getRejeicaoBg(entregador.rejeicao_percentual ?? 0)} ${getRejeicaoColor(entregador.rejeicao_percentual ?? 0)} whitespace-nowrap`}>
                        {(entregador.rejeicao_percentual ?? 0).toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
