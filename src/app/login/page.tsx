'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Verificar se o usuário está aprovado
      const { data: profile, error: profileError } = await supabase
        .rpc('get_current_user_profile') as { data: any; error: any };

      if (profileError) {
        await supabase.auth.signOut();
        throw new Error('Erro ao carregar perfil do usuário');
      }

      if (!profile?.is_approved) {
        await supabase.auth.signOut();
        setError('Sua conta ainda não foi aprovada. Aguarde a aprovação de um administrador.');
        setLoading(false);
        return;
      }

      // Login bem-sucedido
      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error('Erro no login:', err);
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-4 py-12 relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <div className="mb-8 text-center animate-fade-in">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md shadow-2xl border border-white/20">
            <span className="text-5xl">📊</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Dashboard Operacional</h1>
          <p className="mt-2 text-lg text-blue-100/90 font-medium">Sistema de Análise de Dados</p>
        </div>

        {/* Card de Login */}
        <div className="rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm animate-slide-up">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-900">Bem-vindo!</h2>
            <p className="text-sm text-slate-600 mt-1">Entre com suas credenciais para continuar</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 animate-scale-in">
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">⚠️</span>
                <p className="font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">
                📧 Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 font-medium transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:border-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
                placeholder="seu@email.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-700">
                🔒 Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 font-medium transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:border-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 active:scale-95"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-3 border-white border-t-transparent"></div>
                  <span>Entrando...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>Entrar</span>
                  <span>→</span>
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-600">Não tem uma conta?</span>{' '}
            <Link href="/registro" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all">
              Cadastre-se aqui
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-blue-100/80">
          <p>© 2024 Dashboard Operacional. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
