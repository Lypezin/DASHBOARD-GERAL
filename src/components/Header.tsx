'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import Image from 'next/image';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Settings, LogOut, ChevronDown, Menu, Moon, Sun } from 'lucide-react';

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
  const { theme, toggleTheme, setTheme } = useTheme();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTriedAuth, setHasTriedAuth] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    // handleProfileUpdate é estável e não precisa estar nas dependências
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
        
        // Erro de autenticação após retry - redirecionar para login
        if (IS_DEV) safeLog.warn('[Header] Usuário não autenticado após retry, redirecionando para login');
        setIsLoading(false);
        // Redirecionar para login se não estiver na página de login
        if (pathname !== '/login' && pathname !== '/registro') {
          router.push('/login');
        }
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
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4 sm:px-5 md:px-6 lg:px-8 gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0 flex-shrink overflow-hidden" prefetch={true}>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg p-1.5 sm:p-2 group-hover:from-blue-700 group-hover:to-indigo-700 transition-all duration-200 shadow-sm flex-shrink-0">
              <span className="text-lg sm:text-xl block text-white">📊</span>
            </div>
            <div className="hidden sm:block min-w-0 overflow-hidden">
              <span className="font-bold text-sm sm:text-base md:text-lg text-foreground tracking-tight truncate block">Dashboard Operacional</span>
              <p className="text-muted-foreground text-xs font-medium hidden md:block truncate">Sistema de Análise</p>
            </div>
            <span className="font-bold text-sm sm:text-base text-foreground sm:hidden truncate">Dashboard</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2 flex-shrink-0 min-w-0">
            <Button
              asChild
              variant={pathname === '/' ? 'default' : 'ghost'}
              size="sm"
            >
              <Link href="/" prefetch={true}>
                Dashboard
            </Link>
            </Button>

            {/* Toggle de Tema com Switch */}
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                aria-label={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
              />
              <Moon className="h-4 w-4 text-muted-foreground" />
            </div>
          
          {user?.is_admin && (
              <>
                <Button
                  asChild
                  variant={pathname === '/upload' ? 'default' : 'ghost'}
                  size="sm"
                  className="hidden xl:inline-flex"
                >
                  <Link href="/upload" prefetch={true}>
                    Upload
                </Link>
                </Button>
                <Button
                  asChild
                  variant={pathname === '/upload' ? 'default' : 'ghost'}
                  size="sm"
                  className="xl:hidden"
                >
                  <Link href="/upload" prefetch={true}>
                    📤
                </Link>
                </Button>
                <Button
                  asChild
                  variant={pathname === '/admin' ? 'default' : 'ghost'}
                  size="sm"
                  className="hidden xl:inline-flex"
                >
                  <Link href="/admin" prefetch={true}>
                    Admin
                  </Link>
                </Button>
                <Button
                  asChild
                  variant={pathname === '/admin' ? 'default' : 'ghost'}
                  size="sm"
                  className="xl:hidden"
                >
                  <Link href="/admin" prefetch={true}>
                    ⚙️
                  </Link>
                </Button>
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 px-2.5 h-9"
                >
                  <Avatar className="h-7 w-7 border-2 border-slate-200 dark:border-slate-700">
                    <AvatarImage src={avatarUrl || user?.avatar_url || undefined} alt={user?.full_name || 'Usuário'} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-semibold">
                          {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden xl:inline text-sm font-medium">
                    {user?.full_name?.split(' ')[0] || 'Conta'}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="p-3">
                  <div className="flex items-center gap-2.5 mb-2">
                    <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-700">
                      <AvatarImage src={avatarUrl || user?.avatar_url || undefined} alt={user?.full_name || 'Usuário'} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-semibold">
                        {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground truncate">{user?.full_name || 'Usuário'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
                      </div>
                    </div>
                    {user?.is_admin && (
                    <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                      Administrador
                    </Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/perfil" className="flex items-center gap-2.5 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    <span>Meu Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleLogout}
                  className="text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-950/20 cursor-pointer"
                  >
                  <LogOut className="h-4 w-4 mr-2.5" />
                    <span>Sair da Conta</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Mobile Menu com Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2.5">
                  <Avatar className="h-10 w-10 border-2 border-border">
                    <AvatarImage src={avatarUrl || user?.avatar_url || undefined} alt={user?.full_name || 'Usuário'} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-semibold">
                      {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground truncate">{user?.full_name || 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
        </div>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                <Button
                  asChild
                  variant={pathname === '/' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                >
                  <Link href="/" prefetch={true}>
                    Dashboard
              </Link>
                </Button>

                <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Tema</span>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    aria-label={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
                  />
                  <Moon className="h-4 w-4 text-muted-foreground" />
                </div>
              
              {user?.is_admin && (
                <>
                    <Button
                      asChild
                      variant={pathname === '/upload' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                    >
                      <Link href="/upload" prefetch={true}>
                        Upload
                  </Link>
                    </Button>
                    <Button
                      asChild
                      variant={pathname === '/admin' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                    >
                      <Link href="/admin" prefetch={true}>
                        Admin
                  </Link>
                    </Button>
                </>
              )}

                <Separator className="my-4" />

                <Button
                  asChild
                  variant={pathname === '/perfil' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                >
                  <Link href="/perfil" prefetch={true}>
                    <Settings className="mr-2 h-4 w-4" />
                    Meu Perfil
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair da Conta
                </Button>
                  </div>
            </SheetContent>
          </Sheet>
                  </div>
      </header>
    </>
  );
}
