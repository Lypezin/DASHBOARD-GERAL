import React, { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import type { Conquista } from '@/types/conquistas';
import type { RankingUsuario } from '@/hooks/useConquistas';
import ConquistaCard from './ConquistaCard';

// Componente para avatar do usuário com fallback
interface AvatarUsuarioProps {
  avatarUrl: string | null;
  nome: string;
  isTop3: boolean;
}

const AvatarUsuario = memo(function AvatarUsuario({ avatarUrl, nome, isTop3 }: AvatarUsuarioProps) {
  const [imageError, setImageError] = useState(false);
  const inicial = nome.charAt(0).toUpperCase();

  if (!avatarUrl || imageError) {
    return (
      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
        isTop3
          ? 'bg-gradient-to-br from-blue-400 to-purple-500 text-white'
          : 'bg-gradient-to-br from-gray-400 to-gray-500 text-white'
      }`}>
        {inicial}
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={avatarUrl} 
        alt={nome}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );
});

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

  // Carregar ranking quando a aba for ativada e atualizar quando necessário
  useEffect(() => {
    // Resetar flags quando mudar de aba
    if (abaAtiva !== 'ranking') {
      rankingCarregadoRef.current = false;
      rankingTentouCarregarRef.current = false;
      return;
    }

    // Carregar ranking sempre que a aba for ativada (para garantir dados atualizados)
    // Forçar atualização quando mudar para a aba de ranking
    if (onLoadRanking && !loadingRanking) {
      rankingTentouCarregarRef.current = true;
      // Chamar imediatamente e também após um delay para garantir atualização
      if (onLoadRanking) {
        onLoadRanking(); // Chamar imediatamente
      }
      // Também chamar após delay para garantir que está atualizado
      setTimeout(() => {
        if (onLoadRanking && !loadingRanking) {
          onLoadRanking();
        }
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abaAtiva]); // Recarregar sempre que mudar para a aba de ranking

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
        {/* Header - Melhorado */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 p-4 md:p-6 dark:border-gray-700 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="text-3xl md:text-4xl">🏆</span>
                {stats.conquistadas > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full">
                    {stats.conquistadas}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  Conquistas
                </h2>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {stats.conquistadas} de {stats.total} conquistadas • <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.pontos} pontos</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
              aria-label="Fechar"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Barra de progresso melhorada */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs md:text-sm mb-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Progresso Geral</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{stats.progresso}%</span>
            </div>
            <div className="h-2.5 md:h-3 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out shadow-sm"
                style={{ width: `${stats.progresso}%` }}
              />
            </div>
          </div>

          {/* Abas */}
          <div className="mt-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
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
            {/* Botão de atualizar ranking */}
            {abaAtiva === 'ranking' && onLoadRanking && (
              <button
                onClick={() => {
                  rankingTentouCarregarRef.current = false;
                  // Forçar atualização do ranking
                  if (onLoadRanking) {
                    onLoadRanking();
                  }
                }}
                disabled={loadingRanking}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Atualizar ranking"
              >
                <svg 
                  className={`w-5 h-5 ${loadingRanking ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
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
        /* Lista de conquistas - Otimizada para performance */
        <div 
          className="overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent" 
          style={{ 
            maxHeight: 'calc(90vh - 280px)',
            contain: 'layout style paint',
            contentVisibility: 'auto'
          }}
        >
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          )}
          
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {conquistasFiltradas.map(conquista => (
                <div
                  key={conquista.conquista_id}
                  style={{ contentVisibility: 'auto' }}
                >
                  <ConquistaCard 
                    conquista={conquista}
                    getRaridadeColor={getRaridadeColor}
                    getRaridadeLabel={getRaridadeLabel}
                    getCategoriaLabel={getCategoriaLabel}
                  />
                </div>
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
        /* Ranking de usuários - Otimizado para performance */
        <div 
          className="overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent" 
          style={{ 
            maxHeight: 'calc(90vh - 280px)',
            contain: 'layout style paint',
            contentVisibility: 'auto'
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
            <div className="space-y-2 md:space-y-3">
              {ranking.map((usuario) => {
                const isTop3 = usuario.posicao <= 3;
                const medalha = usuario.posicao === 1 ? '🥇' : usuario.posicao === 2 ? '🥈' : usuario.posicao === 3 ? '🥉' : null;
                
                return (
                  <div
                    key={usuario.user_id}
                    className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl transition-all ${
                      isTop3
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-2 border-yellow-300 dark:border-yellow-700 shadow-lg'
                        : 'bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 hover:shadow-md'
                    }`}
                    style={{ contentVisibility: 'auto' }}
                  >
                    {/* Posição */}
                    <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-base md:text-lg ${
                      isTop3
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {medalha || usuario.posicao}
                    </div>

                    {/* Avatar do usuário */}
                    <AvatarUsuario 
                      avatarUrl={usuario.avatar_url}
                      nome={usuario.nome_usuario}
                      isTop3={isTop3}
                    />

                    {/* Informações do usuário */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-bold text-base md:text-lg truncate ${
                          isTop3
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-800 dark:text-gray-200'
                        }`}>
                          {usuario.nome_usuario}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-600 dark:text-gray-400">
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
                          {usuario.conquistas_recentes.map((conquista, idx) => (
                            <span
                              key={`${usuario.user_id}-${idx}`}
                              className="text-xs px-2 py-0.5 md:py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
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
