import React, { useState } from 'react';
import type { Conquista } from '@/types/conquistas';

interface ConquistasModalProps {
  conquistas: Conquista[];
  stats: {
    total: number;
    conquistadas: number;
    pontos: number;
    progresso: number;
  };
  onClose: () => void;
}

export default function ConquistasModal({ conquistas, stats, onClose }: ConquistasModalProps) {
  const [filtro, setFiltro] = useState<'todas' | 'conquistadas' | 'pendentes'>('todas');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);

  const getRaridadeColor = (raridade: string) => {
    switch (raridade) {
      case 'lendaria': return 'from-yellow-400 to-orange-500';
      case 'epica': return 'from-purple-400 to-pink-500';
      case 'rara': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getRaridadeLabel = (raridade: string) => {
    switch (raridade) {
      case 'lendaria': return '💎 Lendária';
      case 'epica': return '🔮 Épica';
      case 'rara': return '⭐ Rara';
      default: return '⚪ Comum';
    }
  };

  const getCategoriaLabel = (categoria: string) => {
    switch (categoria) {
      case 'dados': return '📊 Dados';
      case 'analise': return '🔍 Análise';
      case 'frequencia': return '📅 Frequência';
      case 'social': return '👥 Social';
      default: return categoria;
    }
  };

  const conquistasFiltradas = conquistas.filter(c => {
    if (filtro === 'conquistadas' && !c.conquistada) return false;
    if (filtro === 'pendentes' && c.conquistada) return false;
    if (categoriaFiltro && c.categoria !== categoriaFiltro) return false;
    return true;
  });

  const categorias = Array.from(new Set(conquistas.map(c => c.categoria)));

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
        <div className="overflow-y-auto p-6 scrollbar-thin" style={{ maxHeight: 'calc(90vh - 300px)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conquistasFiltradas.map(conquista => (
              <div
                key={conquista.conquista_id}
                className={`relative overflow-hidden rounded-xl border-2 p-4 transition-all hover:shadow-lg ${
                  conquista.conquistada
                    ? 'bg-white border-blue-200 dark:bg-slate-800 dark:border-blue-700'
                    : 'bg-gray-50 border-gray-200 dark:bg-slate-900/50 dark:border-gray-700 opacity-60'
                }`}
              >
                {/* Badge de raridade */}
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getRaridadeColor(conquista.raridade)} shadow-md`}>
                    {getRaridadeLabel(conquista.raridade).split(' ')[0]}
                  </span>
                </div>

                {/* Ícone */}
                <div className="flex items-start gap-3">
                  <div className={`flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${getRaridadeColor(conquista.raridade)} shadow-lg ${conquista.conquistada ? '' : 'grayscale opacity-50'}`}>
                    <span className="text-3xl">{conquista.icone}</span>
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
                      {conquista.nome}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {conquista.descricao}
                    </p>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {getCategoriaLabel(conquista.categoria)}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        {conquista.pontos} pts
                      </span>
                      {conquista.conquistada && conquista.conquistada_em && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(conquista.conquistada_em).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>

                    {/* Barra de progresso */}
                    {!conquista.conquistada && conquista.progresso > 0 && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${conquista.progresso}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                          {conquista.progresso}% concluído
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selo de conquistada */}
                {conquista.conquistada && (
                  <div className="absolute bottom-2 right-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Conquistada
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {conquistasFiltradas.length === 0 && (
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

