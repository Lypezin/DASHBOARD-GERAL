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
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    if (!showMenu) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current && 
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setShowMenu(false);
      }
    };
    
    // Usar setTimeout para evitar que o evento de abertura seja capturado
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
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
      <header className="sticky top-0 z-50 border-b border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-lg">
        <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4 sm:px-5 md:px-6 lg:px-8 gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0 flex-shrink overflow-hidden" prefetch={false}>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg p-1.5 sm:p-2 group-hover:from-blue-700 group-hover:to-indigo-700 transition-all duration-200 shadow-md flex-shrink-0">
              <span className="text-lg sm:text-xl block text-white">📊</span>
            </div>
            <div className="hidden sm:block min-w-0 overflow-hidden">
              <span className="font-bold text-sm sm:text-base md:text-lg text-slate-900 dark:text-white tracking-tight truncate block">Dashboard Operacional</span>
              <p className="text-slate-600 dark:text-slate-400 text-xs font-medium hidden md:block truncate">Sistema de Análise</p>
            </div>
            <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white sm:hidden truncate">Dashboard</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2.5 flex-shrink-0 min-w-0">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                pathname === '/' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              prefetch={false}
            >
              Dashboard
            </Link>

            {/* Toggle de Tema Moderno */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg px-1.5 py-1">
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  theme === 'dark' ? 'bg-indigo-600' : 'bg-yellow-400'
                }`}
                title={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
                aria-label={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                    theme === 'dark' ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          
            {user?.is_admin && (
              <>
                <Link
                  href="/upload"
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                    pathname === '/upload'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  prefetch={false}
                >
                  <span className="hidden xl:inline">Upload</span>
                  <span className="xl:hidden">📤</span>
                </Link>
                <Link
                  href="/admin"
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                    pathname === '/admin'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  prefetch={false}
                >
                  <span className="hidden xl:inline">Admin</span>
                  <span className="xl:hidden">⚙️</span>
                </Link>
              </>
            )}

            <div ref={menuRef} className="relative flex-shrink-0">
              <button
                ref={buttonRef}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu(prev => !prev);
                }}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap ${
                  showMenu
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-expanded={showMenu}
                aria-haspopup="true"
              >
                {avatarUrl || user?.avatar_url ? (
                  <Image
                    src={avatarUrl || user?.avatar_url || ''}
                    alt={user?.full_name || 'Usuário'}
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm flex-shrink-0">
                    {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="hidden xl:inline">{user?.full_name?.split(' ')[0] || 'Conta'}</span>
                <svg 
                  className={`w-3 h-3 transition-transform duration-200 flex-shrink-0 ${showMenu ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showMenu && (
                <div 
                  className="absolute right-0 top-full mt-1.5 w-56 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl z-[9999] overflow-hidden"
                  role="menu"
                  aria-orientation="vertical"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="border-b border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2.5 mb-2 min-w-0">
                      {avatarUrl || user?.avatar_url ? (
                        <Image
                          src={avatarUrl || user?.avatar_url || ''}
                          alt={user?.full_name || 'Usuário'}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm flex-shrink-0">
                          {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{user?.full_name || 'Usuário'}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{user?.email || ''}</p>
                      </div>
                    </div>
                    {user?.is_admin && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                        Administrador
                      </span>
                    )}
                  </div>
                  <Link
                    href="/perfil"
                    onClick={() => setShowMenu(false)}
                    className={`w-full px-3 py-2.5 text-left text-sm font-medium transition-colors flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-700/50 ${
                      pathname === '/perfil'
                        ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Meu Perfil</span>
                  </Link>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleLogout();
                    }}
                    className="w-full px-3 py-2.5 text-left text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-2.5"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sair da Conta</span>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden flex items-center justify-center w-9 h-9 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-all duration-200"
            aria-label="Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showMobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="container mx-auto px-4 py-3 space-y-1.5">
              <Link
                href="/"
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                  pathname === '/'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                prefetch={false}
              >
                Dashboard
              </Link>

              <div className="w-full flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tema</span>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' ? 'bg-indigo-600' : 'bg-yellow-400'
                  }`}
                  title={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                      theme === 'dark' ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              
              {user?.is_admin && (
                <>
                  <Link
                    href="/upload"
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                      pathname === '/upload'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    prefetch={false}
                  >
                    Upload
                  </Link>
                  <Link
                    href="/admin"
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                      pathname === '/admin'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    prefetch={false}
                  >
                    Admin
                  </Link>
                </>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <Link
                  href="/perfil"
                  onClick={() => setShowMobileMenu(false)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                    pathname === '/perfil'
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {avatarUrl || user?.avatar_url ? (
                    <Image
                      src={avatarUrl || user?.avatar_url || ''}
                      alt={user?.full_name || 'Usuário'}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                      {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-sm truncate">{user?.full_name || 'Usuário'}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{user?.email || ''}</p>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full mt-1.5 flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
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
