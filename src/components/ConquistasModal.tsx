import React, { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import type { Conquista } from '@/types/conquistas';
import type { RankingUsuario } from '@/hooks/useConquistas';
import ConquistaCard from './ConquistaCard';

interface ConquistasModalProps {
  conquistas: Conquista[];
  stats: {
    total: number;
    conquistadas: number;
    pontos: number;
    progresso: number;
  };
  ranking?: RankingUsuario[];
  loadingRanking?: boolean;
  onClose: () => void;
  onLoadRanking?: () => void;
  loading?: boolean;
}

const ConquistasModal = memo(function ConquistasModal({ 
  conquistas, 
  stats, 
  ranking = [],
  loadingRanking = false,
  onClose, 
  onLoadRanking,
  loading = false 
}: ConquistasModalProps) {
  const [abaAtiva, setAbaAtiva] = useState<'conquistas' | 'ranking'>('conquistas');
  const [filtro, setFiltro] = useState<'todas' | 'conquistadas' | 'pendentes'>('todas');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const rankingCarregadoRef = useRef(false);
  const rankingTentouCarregarRef = useRef(false);

  // Carregar ranking quando a aba for ativada (apenas uma vez)
  useEffect(() => {
    // Resetar flags quando mudar de aba
    if (abaAtiva !== 'ranking') {
      rankingCarregadoRef.current = false;
      rankingTentouCarregarRef.current = false;
      return;
    }

    // Se já temos dados, marcar como carregado
    if (ranking.length > 0) {
      rankingCarregadoRef.current = true;
      rankingTentouCarregarRef.current = true;
      return;
    }

    // Carregar ranking apenas se:
    // 1. Estamos na aba de ranking
    // 2. Temos a função de carregamento
    // 3. Não está carregando no momento
    // 4. Ainda não tentamos carregar nesta sessão (evita loop em caso de erro)
    if (onLoadRanking && !loadingRanking && !rankingTentouCarregarRef.current) {
      rankingTentouCarregarRef.current = true;
      onLoadRanking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abaAtiva, loadingRanking, ranking.length]); // Adicionado loadingRanking e ranking.length para reagir quando dados chegarem

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

          {/* Abas */}
          <div className="mt-4 flex gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setAbaAtiva('conquistas')}
              className={`px-4 py-2 font-medium transition-colors ${
                abaAtiva === 'conquistas'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              🏆 Minhas Conquistas
            </button>
            <button
              onClick={() => setAbaAtiva('ranking')}
              className={`px-4 py-2 font-medium transition-colors ${
                abaAtiva === 'ranking'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              📊 Ranking
            </button>
          </div>

          {/* Filtros - apenas na aba de conquistas */}
          {abaAtiva === 'conquistas' && (
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
          )}
        </div>

        {/* Conteúdo das abas */}
        {abaAtiva === 'conquistas' ? (
        /* Lista de conquistas */
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
        ) : (
        /* Ranking de usuários */
        <div 
          className="overflow-y-auto p-6 scrollbar-thin" 
          style={{ 
            maxHeight: 'calc(90vh - 300px)',
            willChange: 'scroll-position',
            transform: 'translateZ(0)',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {loadingRanking && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          )}
          
          {!loadingRanking && ranking.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📊</span>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                Nenhum usuário no ranking ainda
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Seja o primeiro a conquistar!
              </p>
            </div>
          )}

          {!loadingRanking && ranking.length > 0 && (
            <div className="space-y-3">
              {ranking.map((usuario) => {
                const isTop3 = usuario.posicao <= 3;
                const medalha = usuario.posicao === 1 ? '🥇' : usuario.posicao === 2 ? '🥈' : usuario.posicao === 3 ? '🥉' : null;
                
                return (
                  <div
                    key={usuario.user_id}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      isTop3
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-2 border-yellow-300 dark:border-yellow-700 shadow-lg'
                        : 'bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 hover:shadow-md'
                    }`}
                    style={{ willChange: 'transform', transform: 'translateZ(0)' }}
                  >
                    {/* Posição */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      isTop3
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {medalha || usuario.posicao}
                    </div>

                    {/* Informações do usuário */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-bold text-lg truncate ${
                          isTop3
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-800 dark:text-gray-200'
                        }`}>
                          {usuario.nome_usuario}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">{usuario.total_conquistas}</span>
                          <span>conquistas</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">{usuario.total_pontos}</span>
                          <span>pontos</span>
                        </span>
                      </div>
                      {usuario.conquistas_recentes && usuario.conquistas_recentes.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {usuario.conquistas_recentes.slice(0, 3).map((conquista, idx) => (
                            <span
                              key={`${usuario.user_id}-${idx}`}
                              className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            >
                              {conquista}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
});

ConquistasModal.displayName = 'ConquistasModal';

export default ConquistasModal;
