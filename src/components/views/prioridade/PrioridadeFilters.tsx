import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';

interface PrioridadeFiltersProps {
  filtroAderencia: string; filtroRejeicao: string; filtroCompletadas: string; filtroAceitas: string;
  onAderenciaChange: (value: string) => void; onRejeicaoChange: (value: string) => void;
  onCompletadasChange: (value: string) => void; onAceitasChange: (value: string) => void; onClearFilters: () => void;
}

export const PrioridadeFilters: React.FC<PrioridadeFiltersProps> = ({
  filtroAderencia, filtroRejeicao, filtroCompletadas, filtroAceitas,
  onAderenciaChange, onRejeicaoChange, onCompletadasChange, onAceitasChange, onClearFilters,
}) => {
  const hasFilters = filtroAderencia || filtroRejeicao || filtroCompletadas || filtroAceitas;

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Filtros Avançados</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              % Aderência Mínima
            </label>
            <input
              type="number"
              placeholder="Ex: 90"
              value={filtroAderencia}
              onChange={(e) => onAderenciaChange(e.target.value)}
              min="0"
              max="100"
              step="0.1"
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              % Rejeição Máxima
            </label>
            <input
              type="number"
              placeholder="Ex: 10"
              value={filtroRejeicao}
              onChange={(e) => onRejeicaoChange(e.target.value)}
              min="0"
              max="100"
              step="0.1"
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              % Completadas Mínima
            </label>
            <input
              type="number"
              placeholder="Ex: 80"
              value={filtroCompletadas}
              onChange={(e) => onCompletadasChange(e.target.value)}
              min="0"
              max="100"
              step="0.1"
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              % Aceitas Mínima
            </label>
            <input
              type="number"
              placeholder="Ex: 85"
              value={filtroAceitas}
              onChange={(e) => onAceitasChange(e.target.value)}
              min="0"
              max="100"
              step="0.1"
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
          </div>
        </div>
        {hasFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
