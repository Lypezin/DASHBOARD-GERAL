'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegistroPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      console.error('Erro no registro:', err);
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-4 py-12 relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="w-full max-w-md relative z-10 animate-scale-in">
          <div className="rounded-2xl border border-white/20 bg-white/95 p-8 text-center shadow-2xl backdrop-blur-sm">
            <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 shadow-lg">
              <span className="text-5xl">✅</span>
            </div>
            <h2 className="mb-2 text-3xl font-bold text-slate-900">Cadastro Realizado!</h2>
            <p className="mb-6 text-slate-600 text-lg">
              Sua conta foi criada com sucesso.
            </p>
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-5 text-sm border-2 border-blue-200">
              <p className="font-bold text-blue-900 flex items-center justify-center gap-2 text-base">
                <span>⏳</span>
                <span>Aguardando aprovação</span>
              </p>
              <p className="mt-3 text-blue-800 leading-relaxed">
                Um administrador precisa aprovar seu acesso antes que você possa entrar no sistema.
                Você receberá uma notificação quando sua conta for aprovada.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              <p className="ml-2 text-sm text-slate-600 font-medium">Redirecionando para o login...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <p className="mt-2 text-lg text-blue-100/90 font-medium">Crie sua conta</p>
        </div>

        {/* Card de Registro */}
        <div className="rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm animate-slide-up">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-900">Criar Conta</h2>
            <p className="text-sm text-slate-600 mt-1">Preencha os dados para começar</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 animate-scale-in">
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">⚠️</span>
                <p className="font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="mb-2 block text-sm font-bold text-slate-700">
                👤 Nome Completo
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 font-medium transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:border-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
                placeholder="João da Silva"
                disabled={loading}
              />
            </div>

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
                minLength={6}
                className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 font-medium transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:border-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
                disabled={loading}
              />
              <p className="mt-1.5 text-xs text-slate-500 font-medium">✓ Mínimo de 6 caracteres</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-bold text-slate-700">
                🔐 Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
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
                  <span>Criando conta...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>Criar Conta</span>
                  <span>→</span>
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-600">Já tem uma conta?</span>{' '}
            <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all">
              Fazer login
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
