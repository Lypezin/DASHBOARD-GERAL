'use client';

import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { usePerfilData } from '@/hooks/perfil/usePerfilData';
import { PerfilUserInfo } from '@/components/perfil/PerfilUserInfo';
import { ProfileHeaderCard } from '@/components/perfil/ProfileHeaderCard';
import { ThemeSettingsCard } from '@/components/perfil/ThemeSettingsCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from 'lucide-react';
import { motion } from "framer-motion";

export default function PerfilPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, loading, memberSince, refreshUser } = usePerfilData();

  const handleAvatarUpdate = (newUrl: string | null) => {
    refreshUser();
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-6 md:p-8 space-y-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          <Skeleton className="h-[400px] w-full rounded-xl" /> <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
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
              <ProfileHeaderCard user={user} onAvatarUpdate={handleAvatarUpdate} />

              {/* Theme Settings Card */}
              <ThemeSettingsCard />
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
                  <PerfilUserInfo user={user} memberSince={memberSince} onProfileUpdate={refreshUser} />
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </ErrorBoundary>
  );
}

