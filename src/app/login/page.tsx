'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

      // Verificar se o usuário está aprovado com retry
      let profile: any = null;
      let profileError: any = null;
      
      try {
        const result = await supabase.rpc('get_current_user_profile') as { data: any; error: any };
        profile = result.data;
        profileError = result.error;
      } catch (err) {
        profileError = err;
      }
      
      // Se houver erro, tentar novamente uma vez
      if (profileError && !profile) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          const retryResult = await supabase.rpc('get_current_user_profile') as { data: any; error: any };
          profile = retryResult.data;
          profileError = retryResult.error;
        } catch (retryErr) {
          profileError = retryErr;
        }
      }

      if (profileError) {
        // Erro ao carregar perfil - fazer logout apenas se for erro permanente
        const errorCode = (profileError as any)?.code || '';
        const errorMessage = String((profileError as any)?.message || '');
        const isTemporaryError = errorCode === 'TIMEOUT' || 
                                errorMessage.includes('timeout') ||
                                errorMessage.includes('network');
        
        if (isTemporaryError) {
          // Erro temporário - tentar continuar
          if (IS_DEV) safeLog.warn('Erro temporário ao carregar perfil no login, continuando...');
        } else {
          await supabase.auth.signOut();
          throw new Error('Erro ao carregar perfil do usuário. Tente novamente.');
        }
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
      safeLog.error('Erro no login:', err);
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 px-4 py-12">
      {/* Background Animated Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute -top-40 -left-40 h-80 w-80 animate-pulse rounded-full bg-blue-500/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 h-96 w-96 animate-pulse rounded-full bg-indigo-500/20 blur-3xl" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-purple-500/10 blur-3xl" style={{ animationDelay: '2s' }}></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo Section */}
        <div className="mb-10 text-center">
          <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 backdrop-blur-xl shadow-2xl ring-1 ring-white/10 transition-all duration-500 hover:scale-110 hover:rotate-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
              <span className="text-4xl">📊</span>
            </div>
          </div>
          <h1 className="mb-2 bg-gradient-to-r from-white via-blue-100 to-indigo-100 bg-clip-text text-5xl font-black tracking-tight text-transparent">
            Dashboard
          </h1>
          <p className="text-lg font-semibold text-blue-200/90">Sistema de Análise Operacional</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs font-medium text-slate-400">Sistema Online</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="group relative">
          {/* Card Glow */}
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-20 blur-xl transition-opacity group-hover:opacity-30"></div>
          
          <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl shadow-2xl ring-1 ring-white/20">
            {/* Card Header */}
            <div className="mb-8">
              <h2 className="mb-2 text-3xl font-bold text-white">Bem-vindo de volta</h2>
              <p className="text-sm font-medium text-slate-400">Entre com suas credenciais para continuar</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 animate-scale-in rounded-2xl border border-rose-500/50 bg-rose-500/10 p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/20">
                    <span className="text-sm">⚠️</span>
                  </div>
                  <p className="flex-1 text-sm font-medium text-rose-200">{error}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder:text-slate-500 backdrop-blur-sm transition-all duration-200 focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="seu@email.com"
                  disabled={loading}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-300">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-white placeholder:text-slate-500 backdrop-blur-sm transition-all duration-200 focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-white"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-4 font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 opacity-0 transition-opacity group-hover:opacity-100"></div>
                <div className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                      <span>Entrando...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar</span>
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              <span className="text-xs font-medium text-slate-500">ou</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-slate-400">
                Não tem uma conta?{' '}
                <Link 
                  href="/registro" 
                  className="font-bold text-blue-400 transition-all hover:text-blue-300 hover:underline"
                >
                  Criar conta
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs font-medium text-slate-500">
            © 2024 Dashboard Operacional. Todos os direitos reservados.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) translateY(0);
          }
          100% {
            transform: translateX(100%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
