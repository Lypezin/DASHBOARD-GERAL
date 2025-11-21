import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface PrioridadeFiltersProps {
  filtroAderencia: string;
  filtroRejeicao: string;
  filtroCompletadas: string;
  filtroAceitas: string;
  onAderenciaChange: (value: string) => void;
  onRejeicaoChange: (value: string) => void;
  onCompletadasChange: (value: string) => void;
  onAceitasChange: (value: string) => void;
  onClearFilters: () => void;
}

export const PrioridadeFilters: React.FC<PrioridadeFiltersProps> = ({
  filtroAderencia,
  filtroRejeicao,
  filtroCompletadas,
  filtroAceitas,
  onAderenciaChange,
  onRejeicaoChange,
  onCompletadasChange,
  onAceitasChange,
  onClearFilters,
}) => {
  const hasFilters = filtroAderencia || filtroRejeicao || filtroCompletadas || filtroAceitas;

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300/20 to-blue-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <Card className="relative border-0 shadow-xl bg-gradient-to-br from-white via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/10 rounded-3xl overflow-hidden">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/5 to-blue-400/5 rounded-full blur-3xl"></div>
        
        <CardContent className="relative p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
                className="w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-blue-800 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Este % ou acima</p>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
                className="w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-blue-800 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Este % ou abaixo</p>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
                className="w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-blue-800 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Este % ou acima</p>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
                className="w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-blue-800 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Este % ou acima</p>
            </div>
          </div>
          {hasFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={onClearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                ✕ Limpar todos os filtros
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

