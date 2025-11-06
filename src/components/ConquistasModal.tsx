import React, { useState, useMemo, useCallback } from 'react';
import type { Conquista } from '@/types/conquistas';
import ConquistaCard from './ConquistaCard';

interface ConquistasModalProps {
  conquistas: Conquista[];
  stats: {
    total: number;
    conquistadas: number;
    pontos: number;
    progresso: number;
  };
  onClose: () => void;
  loading?: boolean;
}

export default function ConquistasModal({ conquistas, stats, onClose, loading = false }: ConquistasModalProps) {
  const [filtro, setFiltro] = useState<'todas' | 'conquistadas' | 'pendentes'>('todas');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);

  // Funções memoizadas com useCallback
  const getRaridadeColor = useCallback((raridade: string) => {
    switch (raridade) {
      case 'lendaria': return 'from-yellow-400 to-orange-500';
      case 'epica': return 'from-purple-400 to-pink-500';
      case 'rara': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  }, []);

  const getRaridadeLabel = useCallback((raridade: string) => {
    switch (raridade) {
      case 'lendaria': return '💎 Lendária';
      case 'epica': return '🔮 Épica';
      case 'rara': return '⭐ Rara';
      default: return '⚪ Comum';
    }
  }, []);

  const getCategoriaLabel = useCallback((categoria: string) => {
    switch (categoria) {
      case 'dados': return '📊 Dados';
      case 'analise': return '🔍 Análise';
      case 'frequencia': return '📅 Frequência';
      case 'social': return '👥 Social';
      default: return categoria;
    }
  }, []);

  // Memoizar filtros para evitar re-renders
  const conquistasFiltradas = useMemo(() => {
    return conquistas.filter(c => {
      if (filtro === 'conquistadas' && !c.conquistada) return false;
      if (filtro === 'pendentes' && c.conquistada) return false;
      if (categoriaFiltro && c.categoria !== categoriaFiltro) return false;
      return true;
    });
  }, [conquistas, filtro, categoriaFiltro]);

  const categorias = useMemo(() => 
    Array.from(new Set(conquistas.map(c => c.categoria))),
    [conquistas]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6 dark:border-gray-700 dark:from-blue-950/30 dark:to-purple-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Conquistas
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.conquistadas} de {stats.total} conquistadas • {stats.pontos} pontos
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
              aria-label="Fechar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Barra de progresso */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Progresso Geral</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{stats.progresso}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${stats.progresso}%` }}
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="mt-4 flex flex-wrap gap-2">
            {/* Filtro de status */}
            <div className="flex gap-2">
              {(['todas', 'conquistadas', 'pendentes'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filtro === f
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {f === 'todas' ? 'Todas' : f === 'conquistadas' ? 'Conquistadas' : 'Pendentes'}
                </button>
              ))}
            </div>

            {/* Filtro de categoria */}
            <div className="flex gap-2 ml-2 border-l pl-2 border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setCategoriaFiltro(null)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  !categoriaFiltro
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700'
                }`}
              >
                Todas
              </button>
              {categorias.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoriaFiltro(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    categoriaFiltro === cat
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {getCategoriaLabel(cat).split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de conquistas */}
        <div 
          className="overflow-y-auto p-6 scrollbar-thin" 
          style={{ 
            maxHeight: 'calc(90vh - 300px)',
            willChange: 'scroll-position',
            transform: 'translateZ(0)',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          )}
          
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conquistasFiltradas.map(conquista => (
                <ConquistaCard 
                  key={conquista.conquista_id}
                  conquista={conquista}
                  getRaridadeColor={getRaridadeColor}
                  getRaridadeLabel={getRaridadeLabel}
                  getCategoriaLabel={getCategoriaLabel}
                />
              ))}
            </div>
          )}

          {!loading && conquistasFiltradas.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">🔍</span>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                Nenhuma conquista encontrada
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Tente ajustar os filtros
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
