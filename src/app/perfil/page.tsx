'use client';

import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { usePerfilData } from '@/hooks/perfil/usePerfilData';
import { PerfilUserInfo } from '@/components/perfil/PerfilUserInfo';
import { PerfilAvatarUpload } from '@/components/perfil/PerfilAvatarUpload';

export default function PerfilPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, loading, memberSince, refreshUser } = usePerfilData();

  const handleAvatarUpdate = (newUrl: string | null) => {
    refreshUser();
  };

  if (loading) {
    return (
      <ErrorBoundary>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-lg font-semibold text-blue-700 dark:text-blue-300">Carregando perfil...</p>
        </div>
      </div>
      </ErrorBoundary>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
          >
            <span>←</span>
            <span>Voltar ao Dashboard</span>
          </Link>
        </div>

        {/* Card Principal */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header do Card */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Meu Perfil</h1>
            <p className="text-blue-100 mt-1">Gerencie suas informações e foto de perfil</p>
          </div>

          {/* Conteúdo */}
          <div className="p-6 sm:p-8">
            {user && (
              <>
                <PerfilUserInfo
                  user={user}
                  memberSince={memberSince}
                  onProfileUpdate={refreshUser}
                />

            {/* Configurações de Tema */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Aparência</h2>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Tema</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Alterar entre tema claro e escuro
                    </p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="relative inline-flex h-8 w-14 items-center rounded-full bg-slate-300 dark:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    role="switch"
                    aria-checked={theme === 'dark'}
                    aria-label="Alternar tema"
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                        theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    >
                      <span className="absolute inset-0 flex items-center justify-center">
                        {theme === 'dark' ? '🌙' : '☀️'}
                      </span>
                    </span>
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span>Tema atual:</span>
                  <span className="font-semibold text-slate-900 dark:text-white capitalize">
                    {theme === 'dark' ? '🌙 Escuro' : '☀️ Claro'}
                  </span>
                </div>
              </div>
            </div>

                <PerfilAvatarUpload
                  avatarUrl={user.avatar_url}
                  onAvatarUpdate={handleAvatarUpdate}
                  userId={user.id}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}

