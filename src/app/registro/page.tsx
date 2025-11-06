'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const IS_DEV = process.env.NODE_ENV === 'development';

export default function RegistroPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { strength: 0, label: '', color: '' };
    if (pwd.length < 6) return { strength: 1, label: 'Muito fraca', color: 'bg-rose-500' };
    if (pwd.length < 8) return { strength: 2, label: 'Fraca', color: 'bg-orange-500' };
    if (pwd.length < 10) return { strength: 3, label: 'Média', color: 'bg-yellow-500' };
    if (pwd.length < 12) return { strength: 4, label: 'Forte', color: 'bg-blue-500' };
    return { strength: 5, label: 'Muito forte', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validações melhoradas
    if (!fullName.trim()) {
      setError('Por favor, informe seu nome completo');
      setLoading(false);
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor, informe um email válido');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      // Criar usuário no Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;

      setSuccess(true);
      
      // Redirecionar após 10 segundos
      setTimeout(() => {
        router.push('/login');
      }, 10000);
    } catch (err: any) {
      if (IS_DEV) console.error('Erro no registro:', err);
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-950 px-4 py-12">
        {/* Background Animated Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 h-80 w-80 animate-pulse rounded-full bg-emerald-500/20 blur-3xl"></div>
          <div className="absolute -bottom-40 -right-40 h-96 w-96 animate-pulse rounded-full bg-teal-500/20 blur-3xl" style={{ animationDelay: '1s' }}></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="group relative">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 opacity-20 blur-xl"></div>
            <div className="relative rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-2xl shadow-2xl ring-1 ring-white/20">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg ring-4 ring-emerald-500/20">
                <span className="text-4xl">✓</span>
              </div>
              <h2 className="mb-3 text-3xl font-bold text-white">Conta Criada!</h2>
              <p className="mb-8 text-slate-300">Seu cadastro foi realizado com sucesso.</p>
              
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6 backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400"></div>
                  <p className="font-bold text-blue-300">Aguardando Aprovação</p>
                </div>
                <p className="text-sm leading-relaxed text-blue-200/80">
                  Um administrador precisa aprovar seu acesso antes que você possa entrar no sistema.
                  Você receberá uma notificação quando sua conta for aprovada.
                </p>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }}></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }}></div>
                <p className="ml-2 text-sm font-medium text-slate-400">Redirecionando para o login...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 px-4 py-12">
      {/* Background Animated Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-80 w-80 animate-pulse rounded-full bg-blue-500/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 h-96 w-96 animate-pulse rounded-full bg-indigo-500/20 blur-3xl" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-purple-500/10 blur-3xl" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
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
          <p className="text-lg font-semibold text-blue-200/90">Crie sua conta</p>
        </div>

        {/* Register Card */}
        <div className="group relative">
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-20 blur-xl transition-opacity group-hover:opacity-30"></div>
          
          <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl shadow-2xl ring-1 ring-white/20">
            <div className="mb-8">
              <h2 className="mb-2 text-3xl font-bold text-white">Criar Conta</h2>
              <p className="text-sm font-medium text-slate-400">Preencha os dados para começar</p>
            </div>

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

            <form onSubmit={handleRegister} className="space-y-5">
              {/* Full Name Field */}
              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-sm font-semibold text-slate-300">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-slate-400">👤</span>
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-12 py-3.5 text-white placeholder:text-slate-500 backdrop-blur-sm transition-all duration-200 focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="João da Silva"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-300">
                  Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-slate-400">📧</span>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-12 py-3.5 text-white placeholder:text-slate-500 backdrop-blur-sm transition-all duration-200 focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="seu@email.com"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-300">
                  Senha
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-slate-400">🔒</span>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-12 py-3.5 pr-12 text-white placeholder:text-slate-500 backdrop-blur-sm transition-all duration-200 focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
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
                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div 
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs font-medium text-slate-400">
                      {passwordStrength.label && `Força: ${passwordStrength.label}`}
                      {!passwordStrength.label && 'Mínimo de 6 caracteres'}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-300">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-slate-400">🔐</span>
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-12 py-3.5 pr-12 text-white placeholder:text-slate-500 backdrop-blur-sm transition-all duration-200 focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-white"
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="text-xs font-medium text-rose-400">As senhas não coincidem</p>
                )}
                {confirmPassword.length > 0 && password === confirmPassword && (
                  <p className="text-xs font-medium text-emerald-400">✓ Senhas coincidem</p>
                )}
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
                      <span>Criando conta...</span>
                    </>
                  ) : (
                    <>
                      <span>Criar Conta</span>
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

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-slate-400">
                Já tem uma conta?{' '}
                <Link 
                  href="/login" 
                  className="font-bold text-blue-400 transition-all hover:text-blue-300 hover:underline"
                >
                  Fazer login
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
