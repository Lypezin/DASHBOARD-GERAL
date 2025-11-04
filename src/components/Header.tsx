'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

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
          console.warn('Não foi possível carregar avatar:', err);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
      await supabase.auth.signOut();
      router.push('/login');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Não mostrar header nas páginas de login/registro
  if (typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/registro')) {
    return null;
  }

  // Não mostrar header se não houver usuário autenticado
  if (!user) {
    return null;
  }

  return (
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
  );
}
