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

    // Validações
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
        email,
        password,
        options: {
          data: {
            full_name: fullName,
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/20 bg-white/95 p-8 text-center shadow-2xl backdrop-blur-sm">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-slate-900">Cadastro Realizado!</h2>
            <p className="mb-4 text-slate-600">
              Sua conta foi criada com sucesso.
            </p>
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              <p className="font-semibold">⏳ Aguardando aprovação</p>
              <p className="mt-2">
                Um administrador precisa aprovar seu acesso antes que você possa entrar no sistema.
                Você receberá uma notificação quando sua conta for aprovada.
              </p>
            </div>
            <p className="mt-6 text-sm text-slate-500">Redirecionando para o login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <span className="text-4xl">📊</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Dashboard Operacional</h1>
          <p className="mt-2 text-blue-100">Crie sua conta</p>
        </div>

        {/* Card de Registro */}
        <div className="rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">Cadastro</h2>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              <div className="flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <p>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Nome Completo
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="João da Silva"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="seu@email.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="••••••••"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-slate-500">Mínimo de 6 caracteres</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Criando conta...</span>
                </div>
              ) : (
                'Criar Conta'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Fazer login
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-blue-100">
          <p>© 2024 Dashboard Operacional. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
