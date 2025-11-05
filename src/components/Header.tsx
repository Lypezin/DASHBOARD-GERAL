'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const IS_DEV = process.env.NODE_ENV === 'development';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_approved: boolean;
  avatar_url?: string | null;
}

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        checkUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      router.push('/login');
      return;
    }

    try {
      const { data: profile, error } = await supabase.rpc('get_current_user_profile') as { data: UserProfile | null; error: any };
      
      if (error) throw error;

      if (!profile?.is_approved) {
        await supabase.auth.signOut();
        router.push('/login');
        return;
      }

      setUser(profile);
      
      // Buscar avatar_url da tabela de perfil se existir
      if (profile?.id) {
        try {
          const { data: profileData, error: profileDataError } = await supabase
            .from('user_profiles')
            .select('avatar_url')
            .eq('id', profile.id)
            .single();
          
          if (!profileDataError && profileData?.avatar_url) {
            setAvatarUrl(profileData.avatar_url);
            setUser(prev => prev ? { ...prev, avatar_url: profileData.avatar_url } : null);
          } else if (profile.avatar_url) {
            setAvatarUrl(profile.avatar_url);
          }
        } catch (err) {
          // Se a tabela não existir ou houver erro, continuar sem avatar
          if (IS_DEV) console.warn('Não foi possível carregar avatar:', err);
        }
      }
    } catch (err) {
      if (IS_DEV) console.error('Erro ao carregar perfil:', err);
      await supabase.auth.signOut();
      router.push('/login');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Fechar modal ao pressionar ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showHistory) {
        setShowHistory(false);
      }
    };

    if (showHistory) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll do body quando modal está aberto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showHistory]);

  // Handler para fechar modal ao clicar fora
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Fechar apenas se clicar diretamente no backdrop (não no conteúdo do modal)
    if (e.target === e.currentTarget) {
      setShowHistory(false);
    }
  }, []);

  // Não mostrar header nas páginas de login/registro
  if (typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/registro')) {
    return null;
  }

  // Não mostrar header se não houver usuário autenticado
  if (!user) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl backdrop-blur-lg animate-slide-down">
        <div className="container mx-auto flex h-16 md:h-18 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group" prefetch={false}>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 sm:p-2.5 group-hover:bg-white/25 group-hover:scale-105 transition-all duration-300 shadow-lg">
              <span className="text-xl sm:text-2xl">📊</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg sm:text-xl text-white tracking-tight">Dashboard Operacional</span>
              <p className="text-blue-100/90 text-xs sm:text-sm font-medium">Sistema de Análise</p>
            </div>
            <span className="font-bold text-lg text-white sm:hidden">Dashboard</span>
          </Link>
          
          <nav className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 hover:shadow-lg border border-white/15 hover:border-white/30 font-medium"
              prefetch={false}
            >
              <span className="text-base sm:text-lg">📈</span>
              <span className="text-sm sm:text-base hidden xs:inline">Dashboard</span>
            </Link>
            
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 hover:shadow-lg border border-white/15 hover:border-white/30 font-medium"
              title="Histórico de Atualizações"
            >
              <span className="text-base sm:text-lg">📋</span>
              <span className="text-sm sm:text-base hidden md:inline">Histórico</span>
            </button>
            
            {user.is_admin && (
              <>
                <Link
                  href="/upload"
                  className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 hover:shadow-lg border border-white/15 hover:border-white/30 font-medium"
                  prefetch={false}
                >
                  <span className="text-base sm:text-lg">📤</span>
                  <span className="text-sm sm:text-base hidden md:inline">Upload</span>
                </Link>
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 hover:shadow-lg border border-white/15 hover:border-white/30 font-medium"
                  prefetch={false}
                >
                  <span className="text-base sm:text-lg">⚙️</span>
                  <span className="text-sm sm:text-base hidden md:inline">Admin</span>
                </Link>
              </>
            )}

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 sm:gap-2.5 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 border border-white/15 hover:border-white/30 font-medium hover:shadow-lg"
              >
                {avatarUrl || user.avatar_url ? (
                  <img
                    src={avatarUrl || user.avatar_url || ''}
                    alt={user.full_name}
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover border-2 border-white/40 shadow-md"
                  />
                ) : (
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                    <span className="text-base sm:text-lg">👤</span>
                  </div>
                )}
                <span className="text-sm sm:text-base font-medium">Conta</span>
                <span className="text-xs hidden sm:inline transition-transform duration-200" style={{transform: showMenu ? 'rotate(180deg)' : 'rotate(0deg)'}}>▼</span>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-3 w-60 sm:w-64 rounded-xl border border-slate-200/50 bg-white shadow-2xl z-50 animate-scale-in overflow-hidden">
                  <div className="border-b border-slate-200 p-4 bg-gradient-to-br from-slate-50 to-blue-50">
                    <div className="flex items-center gap-3 mb-3">
                      {avatarUrl || user.avatar_url ? (
                        <img
                          src={avatarUrl || user.avatar_url || ''}
                          alt={user.full_name}
                          className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-md"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base text-slate-900 truncate">{user.full_name}</p>
                        <p className="text-xs text-slate-600 truncate mt-0.5">{user.email}</p>
                      </div>
                    </div>
                    {user.is_admin && (
                      <span className="inline-flex items-center gap-1 rounded-full gradient-primary px-3 py-1 text-xs font-bold text-white shadow-md">
                        <span>⭐</span>
                        <span>Administrador</span>
                      </span>
                    )}
                  </div>
                  <Link
                    href="/perfil"
                    onClick={() => setShowMenu(false)}
                    className="w-full p-4 text-left text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-2.5 group border-b border-slate-100"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">⚙️</span>
                    <span>Meu Perfil</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full p-4 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all rounded-b-xl flex items-center gap-2.5 group"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">🚪</span>
                    <span>Sair da Conta</span>
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Modal de Histórico de Atualizações - Renderizado fora do header */}
      {showHistory && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4 overflow-y-auto"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div 
            className="relative w-full max-w-4xl my-8 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-in transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-5 border-b border-white/20 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-xl p-2 backdrop-blur-sm">
                    <span className="text-3xl">📋</span>
                  </div>
                  <div>
                    <h2 id="modal-title" className="text-xl font-bold text-white">Histórico de Atualizações</h2>
                    <p className="text-sm text-blue-100">Registro de melhorias e mudanças no sistema</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-white hover:bg-white/30 rounded-xl p-2.5 transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl border-2 border-white/30 hover:border-white/50"
                  title="Fechar (ESC)"
                  aria-label="Fechar modal"
                >
                  <span className="text-2xl font-bold block leading-none">✕</span>
                </button>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
              <div className="space-y-6">
                {/* Histórico de Atualizações - Mais Recente Primeiro */}
                <div className="space-y-4">
                  {/* 04/11/2025 - Sistema de Refresh Automático de MVs */}
                  {/* 17:30 */}
                  <div className="relative pl-8 border-l-4 border-emerald-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">04/11/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">17:30</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Implementado sistema completo de automação de refresh de Materialized Views: função `refresh_dashboard_mvs()` para atualizar todas as MVs, tabela de controle `mv_refresh_control`, trigger automático que marca necessidade de refresh após INSERT/UPDATE/DELETE em `dados_corridas`, e agendamento via pg_cron para execução periódica a cada 5 minutos, eliminando completamente a necessidade de refresh manual.
                      </p>
                    </div>
                  </div>

                  {/* 17:00 */}
                  <div className="relative pl-8 border-l-4 border-emerald-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">04/11/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">17:00</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Resolvido problema de timeout ao atualizar Materialized Views. Implementada função `refresh_dashboard_mvs()` sem CONCURRENTLY para evitar conflitos de lock, com `statement_timeout = &apos;0&apos;` para permitir execução completa mesmo em volumes grandes de dados.
                      </p>
                    </div>
                  </div>

                  {/* 16:30 */}
                  <div className="relative pl-8 border-l-4 border-emerald-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">04/11/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">16:30</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Criada função centralizada `refresh_dashboard_mvs()` para atualizar todas as Materialized Views do sistema de uma vez: `mv_planejado_detalhe`, `mv_entregue_detalhe`, `mv_aderencia_agregada`, `mv_aderencia_dia`, `mv_aderencia_semana`, `mv_corridas_detalhe`, `mv_dashboard_admin`, `mv_dashboard_lite` e `mv_dashboard_micro`.
                      </p>
                    </div>
                  </div>

                  {/* 16:00 */}
                  <div className="relative pl-8 border-l-4 border-emerald-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">04/11/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">16:00</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Diagnosticado e resolvido problema onde dados importados não apareciam no dashboard. Identificado que Materialized Views (MVs) não se atualizam automaticamente após importação. Implementado processo de refresh manual e posteriormente automatizado para garantir atualização imediata dos dados após cada importação.
                      </p>
                    </div>
                  </div>

                  {/* 15:45 */}
                  <div className="relative pl-8 border-l-4 border-emerald-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">04/11/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">15:45</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Identificado que guia de Evolução utiliza funções `listar_evolucao_mensal` e `listar_evolucao_semanal` que leem diretamente de `dados_corridas`, não necessitando de refresh de MV específica. Documentado quais MVs são necessárias para cada funcionalidade do dashboard.
                      </p>
                    </div>
                  </div>

                  {/* 10:00 */}
                  <div className="relative pl-8 border-l-4 border-blue-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-blue-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-blue-700 dark:text-blue-300">04/11/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">10:00</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Foi otimizada a guia de Evolução, melhorando significativamente o tempo de carregamento e a visualização dos gráficos com gradientes modernos e animações aprimoradas.
                      </p>
                    </div>
                  </div>

                  {/* 09:30 */}
                  <div className="relative pl-8 border-l-4 border-blue-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-blue-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-blue-700 dark:text-blue-300">04/11/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">09:30</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Corrigido problema na guia de Monitor onde as atividades recentes não apareciam. Agora o sistema exibe corretamente todas as ações dos usuários com ícones e descrições detalhadas.
                      </p>
                    </div>
                  </div>

                  {/* 03/11/2025 */}
                  {/* 16:00 */}
                  <div className="relative pl-8 border-l-4 border-indigo-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-indigo-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">03/11/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">16:00</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Implementadas otimizações de performance em todo o sistema, incluindo memoização de componentes, cache de requisições e debounce em chamadas de API para melhorar a responsividade.
                      </p>
                    </div>
                  </div>

                  {/* 14:20 */}
                  <div className="relative pl-8 border-l-4 border-indigo-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-indigo-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">03/11/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">14:20</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Adicionado filtro de TURNO ao sistema, permitindo filtrar dados por turno específico ou múltiplos turnos, seguindo a mesma lógica dos demais filtros existentes.
                      </p>
                    </div>
                  </div>

                  {/* 11:00 */}
                  <div className="relative pl-8 border-l-4 border-indigo-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-indigo-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">03/11/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">11:00</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Realizada auditoria completa do sistema, corrigindo bugs, melhorando validações de formulários, prevenindo memory leaks e adicionando tratamento de erros mais robusto.
                      </p>
                    </div>
                  </div>

                  {/* 02/11/2025 */}
                  {/* 15:30 */}
                  <div className="relative pl-8 border-l-4 border-purple-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-purple-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-purple-700 dark:text-purple-300">02/11/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">15:30</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Implementada guia de Monitoramento para administradores, exibindo usuários online em tempo real e atividades recentes do sistema com informações detalhadas de ações realizadas.
                      </p>
                    </div>
                  </div>

                  {/* 10:00 */}
                  <div className="relative pl-8 border-l-4 border-purple-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-purple-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-purple-700 dark:text-purple-300">02/11/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">10:00</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Adicionada guia de Evolução com visualização de dados mensais e semanais, gráficos interativos mostrando evolução de corridas completadas e horas trabalhadas ao longo do tempo.
                      </p>
                    </div>
                  </div>

                  {/* 01/11/2025 */}
                  {/* 16:00 */}
                  <div className="relative pl-8 border-l-4 border-pink-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-pink-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-pink-700 dark:text-pink-300">01/11/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">16:00</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Implementada guia de Prioridade/Promo com análise detalhada de entregadores por categoria, exibindo métricas específicas de prioridade e promoção com filtros avançados.
                      </p>
                    </div>
                  </div>

                  {/* 10:30 */}
                  <div className="relative pl-8 border-l-4 border-pink-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-pink-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-pink-700 dark:text-pink-300">01/11/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">10:30</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Criada guia de Valores com análise financeira detalhada de entregadores, exibindo valores totais, médios e por categoria com gráficos e tabelas interativas.
                      </p>
                    </div>
                  </div>

                  {/* 31/10/2025 */}
                  {/* 14:00 */}
                  <div className="relative pl-8 border-l-4 border-rose-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-rose-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-rose-700 dark:text-rose-300">31/10/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">14:00</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Implementada guia de Entregadores com lista completa de entregadores, métricas individuais de desempenho, filtros por status e visualização detalhada de cada entregador.
                      </p>
                    </div>
                  </div>

                  {/* 30/10/2025 */}
                  {/* 15:00 */}
                  <div className="relative pl-8 border-l-4 border-orange-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-orange-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-orange-700 dark:text-orange-300">30/10/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">15:00</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Adicionada guia de UTR (Unidade de Tempo Real) com análise de eficiência de entregadores, cálculo de UTR por período e visualização de métricas de produtividade.
                      </p>
                    </div>
                  </div>

                  {/* 29/10/2025 */}
                  {/* 11:00 */}
                  <div className="relative pl-8 border-l-4 border-amber-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-amber-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-amber-700 dark:text-amber-300">29/10/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">11:00</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Criada guia de Comparação com análise comparativa entre diferentes períodos, praças e métricas, permitindo visualização lado a lado de dados históricos.
                      </p>
                    </div>
                  </div>

                  {/* 28/10/2025 */}
                  {/* 16:30 */}
                  <div className="relative pl-8 border-l-4 border-yellow-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-yellow-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-yellow-50 to-lime-50 dark:from-yellow-950/30 dark:to-lime-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">28/10/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">16:30</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Implementada guia de Análise com visualizações detalhadas de dados, gráficos interativos e análises profundas de métricas de aderência e desempenho.
                      </p>
                    </div>
                  </div>

                  {/* 27/10/2025 */}
                  {/* 13:00 */}
                  <div className="relative pl-8 border-l-4 border-lime-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-lime-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-lime-50 to-green-50 dark:from-lime-950/30 dark:to-green-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-lime-700 dark:text-lime-300">27/10/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">13:00</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Adicionados filtros avançados de Sub-Praça e Origem ao sistema, permitindo análises mais granulares e específicas dos dados de corridas.
                      </p>
                    </div>
                  </div>

                  {/* 26/10/2025 */}
                  {/* 10:00 */}
                  <div className="relative pl-8 border-l-4 border-green-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-green-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-green-700 dark:text-green-300">26/10/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">10:00</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Implementado filtro de Praça com suporte a múltiplas seleções, permitindo análise comparativa entre diferentes praças simultaneamente.
                      </p>
                    </div>
                  </div>

                  {/* 25/10/2025 */}
                  {/* 14:30 */}
                  <div className="relative pl-8 border-l-4 border-teal-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-teal-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-teal-700 dark:text-teal-300">25/10/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">14:30</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Adicionados filtros de Ano e Semana ao dashboard principal, permitindo navegação temporal e análise de períodos específicos.
                      </p>
                    </div>
                  </div>

                  {/* 24/10/2025 */}
                  {/* 09:00 */}
                  <div className="relative pl-8 border-l-4 border-cyan-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-cyan-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-cyan-700 dark:text-cyan-300">24/10/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">09:00</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Criado sistema de Materialized Views para otimização de performance, incluindo MVs para dashboard admin, lite e micro, melhorando significativamente a velocidade de consultas.
                      </p>
                    </div>
                  </div>

                  {/* 23/10/2025 */}
                  {/* 15:00 */}
                  <div className="relative pl-8 border-l-4 border-sky-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-sky-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-sky-700 dark:text-sky-300">23/10/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">15:00</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Implementado painel administrativo com funcionalidades de gerenciamento de usuários, aprovação de contas, controle de acesso por praça e visualização de permissões.
                      </p>
                    </div>
                  </div>

                  {/* 22/10/2025 */}
                  {/* 11:30 */}
                  <div className="relative pl-8 border-l-4 border-blue-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-blue-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-blue-700 dark:text-blue-300">22/10/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">11:30</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Adicionada página de perfil de usuário com edição de informações pessoais, upload de avatar e gerenciamento de preferências de conta.
                      </p>
                    </div>
                  </div>

                  {/* 21/10/2025 */}
                  {/* 10:00 */}
                  <div className="relative pl-8 border-l-4 border-indigo-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-indigo-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">21/10/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">10:00</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Criada página de upload de dados com suporte a arquivos Excel (.xlsx, .xls), processamento em lote, validação de dados e tratamento de erros de importação.
                      </p>
                    </div>
                  </div>

                  {/* 20/10/2025 */}
                  {/* 14:00 */}
                  <div className="relative pl-8 border-l-4 border-purple-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-purple-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-purple-700 dark:text-purple-300">20/10/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">14:00</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Implementado dashboard principal com visualização de aderência geral, métricas de corridas, gráficos de aderência por dia, turno, sub-praça e origem, com cards interativos e responsivos.
                      </p>
                    </div>
                  </div>

                  {/* 19/10/2025 */}
                  {/* 09:30 */}
                  <div className="relative pl-8 border-l-4 border-pink-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-pink-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-pink-700 dark:text-pink-300">19/10/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">09:30</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Criadas funções SQL no Supabase para cálculo de aderência, agregação de dados e consultas otimizadas, incluindo `dashboard_resumo`, `calcular_utr`, `listar_entregadores` e outras funções essenciais.
                      </p>
                    </div>
                  </div>

                  {/* 18/10/2025 */}
                  {/* 16:00 */}
                  <div className="relative pl-8 border-l-4 border-rose-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-rose-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-rose-700 dark:text-rose-300">18/10/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">16:00</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Implementado sistema de autenticação completo com Supabase Auth, incluindo login, registro, controle de acesso baseado em roles (admin/usuário) e aprovação de contas.
                      </p>
                    </div>
                  </div>

                  {/* 17/10/2025 */}
                  {/* 10:30 */}
                  <div className="relative pl-8 border-l-4 border-red-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-red-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-red-700 dark:text-red-300">17/10/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">10:30</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Criada estrutura de banco de dados no Supabase com tabelas principais: `dados_corridas`, `user_profiles`, `user_activity`, configuração de RLS (Row Level Security) e políticas de acesso.
                      </p>
                    </div>
                  </div>

                  {/* 16/10/2025 */}
                  {/* 09:00 */}
                  <div className="relative pl-8 border-l-4 border-slate-500">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-slate-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md"></div>
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-slate-700 dark:text-slate-300">16/10/2025</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">09:00</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Projeto inicial criado com Next.js 14, TypeScript, Tailwind CSS e integração com Supabase. Configuração inicial do ambiente de desenvolvimento, estrutura de pastas e componentes base do sistema.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rodapé do Modal */}
                <div className="pt-6 border-t-2 border-slate-200 dark:border-slate-800 mt-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-900">
                    <p className="text-center text-sm font-medium text-slate-700 dark:text-slate-300">
                      <span className="text-blue-600 dark:text-blue-400">💡</span> O sistema é continuamente atualizado para melhorar a experiência do usuário e adicionar novas funcionalidades.
                    </p>
                  </div>
                  <p className="text-center text-xs text-slate-500 dark:text-slate-500 mt-3">
                    Pressione <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono">ESC</kbd> ou clique fora para fechar
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
