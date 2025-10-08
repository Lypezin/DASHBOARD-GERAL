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
}

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showMenu, setShowMenu] = useState(false);

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
      const { data: profile, error } = await supabase.rpc('get_current_user_profile').single() as { data: UserProfile | null; error: any };
      
      if (error) throw error;

      if (!profile?.is_approved) {
        await supabase.auth.signOut();
        router.push('/login');
        return;
      }

      setUser(profile);
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

  return (
    <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 group" prefetch={false}>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 group-hover:bg-white/30 transition-colors">
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <span className="font-bold text-xl text-white">Dashboard Operacional</span>
            <p className="text-blue-100 text-sm">Sistema de Análise</p>
          </div>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all duration-200 transform hover:-translate-y-1 border border-white/20"
            prefetch={false}
          >
            <span>📈</span>
            <span className="font-medium">Dashboard</span>
          </Link>
          
          {user?.is_admin && (
            <>
              <Link
                href="/upload"
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all duration-200 transform hover:-translate-y-1 border border-white/20"
                prefetch={false}
              >
                <span>📤</span>
                <span className="font-medium">Upload</span>
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all duration-200 transform hover:-translate-y-1 border border-white/20"
                prefetch={false}
              >
                <span>⚙️</span>
                <span className="font-medium">Admin</span>
              </Link>
            </>
          )}

          {user && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all duration-200 border border-white/20"
              >
                <span>👤</span>
                <span className="font-medium">{user.full_name.split(' ')[0]}</span>
                <span className="text-xs">▼</span>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-white/20 bg-white shadow-xl">
                  <div className="border-b border-slate-200 p-4">
                    <p className="font-semibold text-slate-900">{user.full_name}</p>
                    <p className="text-sm text-slate-600">{user.email}</p>
                    {user.is_admin && (
                      <span className="mt-2 inline-block rounded bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700">
                        Administrador
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full p-4 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors rounded-b-xl"
                  >
                    🚪 Sair
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
