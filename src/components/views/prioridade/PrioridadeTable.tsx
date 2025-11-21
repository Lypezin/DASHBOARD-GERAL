import React from 'react';
import { Entregador } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    return <span className="ml-1 text-slate-400">⇅</span>;
  }
  return <span className="ml-1">{direction === 'asc' ? '↑' : '↓'}</span>;
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
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300/20 to-blue-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <Card className="relative border-0 shadow-xl bg-gradient-to-br from-white via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/10 rounded-3xl overflow-hidden">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/5 to-blue-400/5 rounded-full blur-3xl"></div>
        
        <CardHeader className="relative pb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl">⭐</span>
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                Prioridade/Promo
              </CardTitle>
              <CardDescription className="text-base mt-1 text-slate-600 dark:text-slate-400">
                Análise detalhada de entregadores para priorização e promoções
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="relative">
          <div className="max-h-[600px] overflow-auto">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/50 shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-slate-800 dark:to-slate-700 border-b-2 border-blue-200 dark:border-slate-600">
                    <th 
                      className="cursor-pointer px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-blue-100 dark:text-slate-300 dark:hover:bg-blue-950/20"
                      onClick={() => onSort('nome_entregador')}
                    >
                      Entregador <SortIcon field="nome_entregador" currentField={sortField} direction={sortDirection} />
                    </th>
                    <th 
                      className="cursor-pointer px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-blue-100 dark:text-slate-300 dark:hover:bg-blue-950/20"
                      onClick={() => onSort('corridas_ofertadas')}
                    >
                      Ofertadas <SortIcon field="corridas_ofertadas" currentField={sortField} direction={sortDirection} />
                    </th>
                    <th 
                      className="cursor-pointer px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-blue-100 dark:text-slate-300 dark:hover:bg-blue-950/20"
                      onClick={() => onSort('corridas_aceitas')}
                    >
                      Aceitas <SortIcon field="corridas_aceitas" currentField={sortField} direction={sortDirection} />
                    </th>
                    <th 
                      className="cursor-pointer px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-blue-100 dark:text-slate-300 dark:hover:bg-blue-950/20"
                      onClick={() => onSort('corridas_rejeitadas')}
                    >
                      Rejeitadas <SortIcon field="corridas_rejeitadas" currentField={sortField} direction={sortDirection} />
                    </th>
                    <th 
                      className="cursor-pointer px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-blue-100 dark:text-slate-300 dark:hover:bg-blue-950/20"
                      onClick={() => onSort('percentual_aceitas')}
                    >
                      % Aceitas <SortIcon field="percentual_aceitas" currentField={sortField} direction={sortDirection} />
                    </th>
                    <th 
                      className="cursor-pointer px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-blue-100 dark:text-slate-300 dark:hover:bg-blue-950/20"
                      onClick={() => onSort('corridas_completadas')}
                    >
                      Completadas <SortIcon field="corridas_completadas" currentField={sortField} direction={sortDirection} />
                    </th>
                    <th 
                      className="cursor-pointer px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-blue-100 dark:text-slate-300 dark:hover:bg-blue-950/20"
                      onClick={() => onSort('percentual_completadas')}
                    >
                      % Completadas <SortIcon field="percentual_completadas" currentField={sortField} direction={sortDirection} />
                    </th>
                    <th 
                      className="cursor-pointer px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-blue-100 dark:text-slate-300 dark:hover:bg-blue-950/20"
                      onClick={() => onSort('aderencia_percentual')}
                    >
                      Aderência <SortIcon field="aderencia_percentual" currentField={sortField} direction={sortDirection} />
                    </th>
                    <th 
                      className="cursor-pointer px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-blue-100 dark:text-slate-300 dark:hover:bg-blue-950/20"
                      onClick={() => onSort('rejeicao_percentual')}
                    >
                      % Rejeição <SortIcon field="rejeicao_percentual" currentField={sortField} direction={sortDirection} />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {sortedEntregadores.map((entregador, index) => {
                    const ranking = index + 1;
                    const percentualAceitas = calcularPercentualAceitas(entregador);
                    const percentualCompletadas = calcularPercentualCompletadas(entregador);
                    
                    return (
                      <tr
                        key={`${entregador.id_entregador}-${sortField}-${sortDirection}-${ranking}`}
                        className="transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/20"
                      >
                        <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">{entregador.nome_entregador}</td>
                        <td className="px-4 py-4 text-center text-slate-700 dark:text-slate-300 whitespace-nowrap">{entregador.corridas_ofertadas.toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-4 text-center text-emerald-700 dark:text-emerald-400 whitespace-nowrap">{entregador.corridas_aceitas.toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-4 text-center text-red-700 dark:text-red-400 whitespace-nowrap">{entregador.corridas_rejeitadas.toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-4">
                          <Badge className={`text-xs font-semibold ${getAceitasBg(percentualAceitas)} ${getAceitasColor(percentualAceitas)} whitespace-nowrap`}>
                            {percentualAceitas.toFixed(2)}%
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-center text-blue-700 dark:text-blue-400 whitespace-nowrap">{entregador.corridas_completadas.toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-4">
                          <Badge className={`text-xs font-semibold ${getCompletadasBg(percentualCompletadas)} ${getCompletadasColor(percentualCompletadas)} whitespace-nowrap`}>
                            {percentualCompletadas.toFixed(2)}%
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={`text-xs font-semibold ${getAderenciaBg(entregador.aderencia_percentual ?? 0)} ${getAderenciaColor(entregador.aderencia_percentual ?? 0)} whitespace-nowrap`}>
                            {(entregador.aderencia_percentual ?? 0).toFixed(2)}%
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={`text-xs font-semibold ${getRejeicaoBg(entregador.rejeicao_percentual ?? 0)} ${getRejeicaoColor(entregador.rejeicao_percentual ?? 0)} whitespace-nowrap`}>
                            {(entregador.rejeicao_percentual ?? 0).toFixed(2)}%
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

