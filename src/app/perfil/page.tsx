'use client';

import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { usePerfilData } from '@/hooks/perfil/usePerfilData';
import { PerfilUserInfo } from '@/components/perfil/PerfilUserInfo';
import { PerfilAvatarUpload } from '@/components/perfil/PerfilAvatarUpload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Moon, Sun, Shield, User } from 'lucide-react';
import { motion } from "framer-motion";

export default function PerfilPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, loading, memberSince, refreshUser } = usePerfilData();

  const handleAvatarUpdate = (newUrl: string | null) => {
    refreshUser();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-6 md:p-8 space-y-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-[300px_1fr]">
            <Skeleton className="h-[400px] w-full rounded-xl" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 py-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto space-y-6"
        >
          {/* Header Navigation */}
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="gap-2 pl-0 hover:pl-2 transition-all">
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-[350px_1fr]">

            {/* Left Column: Avatar & Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                  <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                    <PerfilAvatarUpload
                      avatarUrl={user.avatar_url}
                      onAvatarUpdate={handleAvatarUpdate}
                      userId={user.id}
                    />
                  </div>
                </div>
                <CardContent className="pt-20 pb-8 text-center space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {user.full_name}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                      {user.email}
                    </p>
                  </div>

                  <div className="flex justify-center gap-2">
                    {user.is_admin && (
                      <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    <Badge variant="outline" className="border-slate-300 dark:border-slate-700">
                      <User className="w-3 h-3 mr-1" />
                      Membro
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Theme Settings Card */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Aparência</CardTitle>
                  <CardDescription>Personalize sua experiência</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-orange-500/10 text-orange-500'}`}>
                        {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Modo Escuro</p>
                        <p className="text-xs text-slate-500 capitalize">
                          {theme === 'dark' ? 'Ativado' : 'Desativado'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleTheme}
                      className="ml-auto"
                    >
                      Alternar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Column: User Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="h-full border-slate-200 dark:border-slate-800 shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Detalhes da Conta</CardTitle>
                  <CardDescription>Gerencie suas informações pessoais</CardDescription>
                </CardHeader>
                <CardContent>
                  <PerfilUserInfo
                    user={user}
                    memberSince={memberSince}
                    onProfileUpdate={refreshUser}
                  />
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </ErrorBoundary>
  );
}

