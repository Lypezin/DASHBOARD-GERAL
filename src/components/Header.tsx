'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import Image from 'next/image';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';

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
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Adicionar estado de loading
  const [hasTriedAuth, setHasTriedAuth] = useState(false); // Flag para rastrear tentativas de auth
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu && !(event.target as Element).closest('.menu-container')) {
        setShowMenu(false);
      }
    };
    
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    // Timeout crítico: após 3 segundos, mostrar header mesmo sem usuário
    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        if (IS_DEV) {
          safeLog.warn('[Header] Timeout de loading atingido (3s), mostrando header mesmo sem usuário');
        }
        setIsLoading(false);
      }
    }, 3000);

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        checkUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        router.push('/login');
      } else if (event === 'TOKEN_REFRESHED') {
        // Token foi renovado - verificar usuário novamente
        checkUser();
      } else if (event === 'USER_UPDATED') {
        // Usuário foi atualizado - verificar novamente
        if (IS_DEV) safeLog.info('[Header] Evento USER_UPDATED recebido, atualizando perfil...');
        checkUser();
      }
    });

    // Listener para evento customizado de atualização de perfil
    const handleProfileUpdate = (event: CustomEvent) => {
      if (IS_DEV) safeLog.info('[Header] Evento customizado userProfileUpdated recebido, atualizando perfil...', event.detail);
      // Forçar atualização imediata do perfil
      checkUser();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      subscription.unsubscribe();
      // Remover listener de evento customizado
      if (typeof window !== 'undefined') {
        window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async () => {
    try {
      setIsLoading(true);
      
      // Verificar se cliente Supabase está usando mock
      try {
        // Tentar acessar a URL do cliente de forma segura
        const runtimeUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (IS_DEV) {
          safeLog.info('[Header] Verificando variáveis Supabase:', {
            hasUrl: !!runtimeUrl,
            isPlaceholder: runtimeUrl?.includes('placeholder')
          });
        }
        
        // Se estiver usando mock, tentar recriar
        if (runtimeUrl?.includes('placeholder.supabase.co') && typeof (supabase as any)._recreate === 'function') {
          if (IS_DEV) {
            safeLog.warn('[Header] Cliente Supabase está usando mock, tentando recriar...');
          }
          (supabase as any)._recreate();
          // Aguardar um pouco antes de continuar
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (clientErr) {
        if (IS_DEV) {
          safeLog.warn('[Header] Erro ao verificar cliente Supabase:', clientErr);
        }
      }
      
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        if (IS_DEV) {
          safeLog.warn('[Header] Erro ao obter usuário:', authError);
        }
        
        // Se é a primeira tentativa, aguardar um pouco e tentar novamente
        if (!hasTriedAuth) {
          setHasTriedAuth(true);
          setTimeout(() => checkUser(), 1000);
          return;
        }
        
        // Erro de autenticação após retry - mas NÃO redirecionar, apenas mostrar header sem usuário
        if (IS_DEV) safeLog.warn('[Header] Usuário não autenticado após retry, mostrando header sem usuário');
        setIsLoading(false);
        // NÃO redirecionar para login - deixar o usuário ver o header
        return;
      }
      
      setHasTriedAuth(true);

      // Tentar buscar perfil com retry e tratamento de erro melhorado
      let profile: UserProfile | null = null;
      let profileError: any = null;
      
      try {
        const result = await safeRpc<UserProfile>('get_current_user_profile', {}, {
          timeout: 10000,
          validateParams: false
        });
        
        profile = result.data;
        profileError = result.error;
      } catch (err) {
        profileError = err;
        if (IS_DEV) safeLog.warn('Erro ao buscar perfil (primeira tentativa):', err);
      }
      
      // Se houver erro, tentar novamente uma vez após 1 segundo
      if (profileError && !profile) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          const retryResult = await safeRpc<UserProfile>('get_current_user_profile', {}, {
            timeout: 10000,
            validateParams: false
          });
          profile = retryResult.data;
          profileError = retryResult.error;
        } catch (retryErr) {
          profileError = retryErr;
        }
      }

      // Se ainda houver erro, verificar se é erro temporário
      if (profileError) {
        const errorCode = (profileError as any)?.code || '';
        const errorMessage = String((profileError as any)?.message || '');
        const isTemporaryError = errorCode === 'TIMEOUT' || 
                                errorMessage.includes('timeout') ||
                                errorMessage.includes('network') ||
                                errorCode === 'PGRST301' ||
                                errorMessage.includes('placeholder.supabase.co') ||
                                errorMessage.includes('ERR_NAME_NOT_RESOLVED');
        
        if (isTemporaryError) {
          // Erro temporário - não fazer logout, apenas logar e mostrar header sem perfil
          if (IS_DEV) safeLog.warn('[Header] Erro temporário ao buscar perfil, mostrando header sem perfil:', profileError);
          setIsLoading(false);
          // Manter header visível mesmo com erro temporário
          return;
        }
        
        // Erro permanente - mas ainda assim mostrar header
        if (IS_DEV) safeLog.error('[Header] Erro ao carregar perfil:', profileError);
        setIsLoading(false);
        // Não fazer logout - apenas mostrar header sem perfil
        return;
      }

      // Verificar se usuário está aprovado
      if (!profile?.is_approved) {
        // Usuário não aprovado - fazer logout apenas se realmente necessário
        if (IS_DEV) safeLog.warn('[Header] Usuário não aprovado');
        // Não fazer logout imediatamente - mostrar header primeiro
        setIsLoading(false);
        // Tentar logout em background, mas não bloquear UI
        supabase.auth.signOut().catch(() => {});
        return;
      }

      // Tudo OK - definir usuário
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
          if (IS_DEV) safeLog.warn('Não foi possível carregar avatar:', err);
        }
      }
    } catch (err) {
      // Erro inesperado - apenas logar, não fazer logout forçado
      if (IS_DEV) safeLog.error('[Header] Erro inesperado ao verificar usuário:', err);
      // Sempre mostrar header mesmo com erro
      setIsLoading(false);
    } finally {
      // Sempre definir loading como false ao final
      setIsLoading(false);
      // Limpar timeout se ainda estiver ativo
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      // O onAuthStateChange no AuthProvider vai redirecionar para /login
    } catch (error) {
      safeLog.error('Erro ao fazer logout:', error);
      // Opcional: mostrar uma notificação de erro para o usuário
    }
  };


  // Não mostrar header nas páginas de login/registro
  if (typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/registro')) {
    return null;
  }

  // CRÍTICO: Sempre mostrar header após timeout ou se já tentou autenticar
  // Não bloquear a UI indefinidamente
  // Se ainda está carregando mas já passou do timeout, mostrar header mesmo assim
  if (isLoading && !hasTriedAuth) {
    // Apenas não mostrar se ainda não tentou autenticar E está carregando
    // O timeout vai forçar isLoading para false após 3 segundos
    return null;
  }

  // Mostrar header mesmo sem usuário - não bloquear a UI
  // O header pode mostrar estado "carregando" ou opções limitadas

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-2xl backdrop-blur-xl animate-slide-down overflow-hidden">
        <div className="container mx-auto flex h-16 md:h-18 items-center justify-between px-2 sm:px-3 md:px-4 lg:px-6 gap-1.5 sm:gap-2 min-w-0">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group min-w-0 flex-shrink overflow-hidden" prefetch={false}>
            <div className="bg-white/15 backdrop-blur-sm rounded-lg sm:rounded-xl p-1.5 sm:p-2 group-hover:bg-white/25 group-hover:scale-105 transition-all duration-300 shadow-lg flex-shrink-0">
              <span className="text-lg sm:text-xl">📊</span>
            </div>
            <div className="hidden sm:block min-w-0 overflow-hidden">
              <span className="font-bold text-sm sm:text-base md:text-lg text-white tracking-tight truncate block">Dashboard Operacional</span>
              <p className="text-blue-100/90 text-xs font-medium hidden md:block truncate">Sistema de Análise</p>
            </div>
            <span className="font-bold text-sm sm:text-base text-white sm:hidden truncate">Dashboard</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 md:gap-1.5 flex-shrink-0 min-w-0 overflow-hidden">
            <Link
              href="/"
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg transition-all duration-200 font-medium whitespace-nowrap flex-shrink-0 ${
                pathname === '/' 
                  ? 'bg-white/25 backdrop-blur-sm text-white shadow-lg border-2 border-white/40' 
                  : 'bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/15 hover:border-white/30 hover:shadow-lg'
              }`}
              prefetch={false}
            >
              <span className="text-sm sm:text-base">📈</span>
              <span className="text-xs sm:text-sm">Dashboard</span>
            </Link>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg transition-all duration-200 hover:shadow-lg border border-white/15 hover:border-white/30 font-medium whitespace-nowrap flex-shrink-0"
            title={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
          >
            <span className="text-sm sm:text-base">{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span className="text-xs sm:text-sm hidden xl:inline">
              {theme === 'dark' ? 'Escuro' : 'Claro'}
            </span>
          </button>
          
          {user?.is_admin && (
              <>
                <Link
                  href="/upload"
                  className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg transition-all duration-200 font-medium whitespace-nowrap flex-shrink-0 ${
                    pathname === '/upload'
                      ? 'bg-white/25 backdrop-blur-sm text-white shadow-lg border-2 border-white/40'
                      : 'bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/15 hover:border-white/30 hover:shadow-lg'
                  }`}
                  prefetch={false}
                >
                  <span className="text-sm sm:text-base">📤</span>
                  <span className="text-xs sm:text-sm hidden xl:inline">Upload</span>
                </Link>
                <Link
                  href="/admin"
                  className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg transition-all duration-200 font-medium whitespace-nowrap flex-shrink-0 ${
                    pathname === '/admin'
                      ? 'bg-white/25 backdrop-blur-sm text-white shadow-lg border-2 border-white/40'
                      : 'bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/15 hover:border-white/30 hover:shadow-lg'
                  }`}
                  prefetch={false}
                >
                  <span className="text-sm sm:text-base">⚙️</span>
                  <span className="text-xs sm:text-sm hidden xl:inline">Admin</span>
                </Link>
              </>
            )}

            <div className="relative menu-container flex-shrink-0">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg transition-all duration-200 font-medium whitespace-nowrap ${
                  showMenu
                    ? 'bg-white/25 backdrop-blur-sm text-white shadow-lg border-2 border-white/40'
                    : 'bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/15 hover:border-white/30 hover:shadow-lg'
                }`}
              >
                {avatarUrl || user?.avatar_url ? (
                  <Image
                    src={avatarUrl || user?.avatar_url || ''}
                    alt={user?.full_name || 'Usuário'}
                    width={32}
                    height={32}
                    className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 rounded-full object-cover border-2 border-white/40 shadow-md flex-shrink-0"
                  />
                ) : (
                  <div className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 flex-shrink-0">
                    <span className="text-xs sm:text-sm md:text-base">👤</span>
                  </div>
                )}
                <span className="text-xs sm:text-sm font-medium hidden xl:inline">Conta</span>
                <span className="text-xs transition-transform duration-200 flex-shrink-0" style={{transform: showMenu ? 'rotate(180deg)' : 'rotate(0deg)'}}>▼</span>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-56 sm:w-64 rounded-xl border border-slate-200/50 bg-white dark:bg-slate-900 dark:border-slate-700/50 shadow-2xl z-50 animate-scale-in overflow-hidden">
                  <div className="border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-900">
                    <div className="flex items-center gap-2.5 sm:gap-3 mb-3 min-w-0">
                      {avatarUrl || user?.avatar_url ? (
                        <Image
                          src={avatarUrl || user?.avatar_url || ''}
                          alt={user?.full_name || 'Usuário'}
                          width={48}
                          height={48}
                          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-md flex-shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-md flex-shrink-0">
                          {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">{user?.full_name || 'Usuário'}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">{user?.email || ''}</p>
                      </div>
                    </div>
                    {user?.is_admin && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-2.5 sm:px-3 py-1 text-xs font-bold text-white shadow-md whitespace-nowrap">
                        <span>⭐</span>
                        <span>Administrador</span>
                      </span>
                    )}
                  </div>
                  <Link
                    href="/perfil"
                    onClick={() => setShowMenu(false)}
                    className={`w-full p-3 sm:p-4 text-left text-sm font-semibold transition-all flex items-center gap-2.5 group border-b border-slate-100 dark:border-slate-700 whitespace-nowrap ${
                      pathname === '/perfil'
                        ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                        : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                    }`}
                  >
                    <span className="text-base sm:text-lg group-hover:scale-110 transition-transform flex-shrink-0">⚙️</span>
                    <span className="truncate">Meu Perfil</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full p-3 sm:p-4 text-left text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all rounded-b-xl flex items-center gap-2.5 group whitespace-nowrap"
                  >
                    <span className="text-base sm:text-lg group-hover:scale-110 transition-transform flex-shrink-0">🚪</span>
                    <span className="truncate">Sair da Conta</span>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden flex items-center justify-center w-10 h-10 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-lg transition-all duration-200 border border-white/15 hover:border-white/30"
            aria-label="Menu"
          >
            <span className="text-xl">{showMobileMenu ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-white/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-slide-down">
            <div className="container mx-auto px-3 sm:px-4 py-4 space-y-2">
              <Link
                href="/"
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  pathname === '/'
                    ? 'bg-white/25 backdrop-blur-sm text-white shadow-lg border-2 border-white/40'
                    : 'bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/15 hover:border-white/30'
                }`}
                prefetch={false}
              >
                <span className="text-lg">📈</span>
                <span>Dashboard</span>
              </Link>

              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-all duration-200 border border-white/15 hover:border-white/30 font-medium"
              >
                <span className="text-lg">{theme === 'dark' ? '🌙' : '☀️'}</span>
                <span>{theme === 'dark' ? 'Tema Escuro' : 'Tema Claro'}</span>
              </button>
              
              {user?.is_admin && (
                <>
                  <Link
                    href="/upload"
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                      pathname === '/upload'
                        ? 'bg-white/25 backdrop-blur-sm text-white shadow-lg border-2 border-white/40'
                        : 'bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/15 hover:border-white/30'
                    }`}
                    prefetch={false}
                  >
                    <span className="text-lg">📤</span>
                    <span>Upload</span>
                  </Link>
                  <Link
                    href="/admin"
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                      pathname === '/admin'
                        ? 'bg-white/25 backdrop-blur-sm text-white shadow-lg border-2 border-white/40'
                        : 'bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/15 hover:border-white/30'
                    }`}
                    prefetch={false}
                  >
                    <span className="text-lg">⚙️</span>
                    <span>Admin</span>
                  </Link>
                </>
              )}

              <div className="pt-2 border-t border-white/20">
                <Link
                  href="/perfil"
                  onClick={() => setShowMobileMenu(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                    pathname === '/perfil'
                      ? 'bg-white/25 backdrop-blur-sm text-white shadow-lg border-2 border-white/40'
                      : 'bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/15 hover:border-white/30'
                  }`}
                >
                  {avatarUrl || user?.avatar_url ? (
                    <Image
                      src={avatarUrl || user?.avatar_url || ''}
                      alt={user?.full_name || 'Usuário'}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover border-2 border-white/40 shadow-md"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                      <span className="text-base">👤</span>
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm">{user?.full_name || 'Usuário'}</p>
                    <p className="text-xs text-blue-100/80 truncate">{user?.email || ''}</p>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full mt-2 flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-all duration-200 border border-white/15 hover:border-white/30 font-medium text-rose-100"
                >
                  <span className="text-lg">🚪</span>
                  <span>Sair da Conta</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
