'use client';

import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { usePerfilData } from '@/hooks/perfil/usePerfilData';
import { PerfilUserInfo } from '@/components/perfil/PerfilUserInfo';
import { ProfileHeaderCard } from '@/components/perfil/ProfileHeaderCard';
import { ThemeSettingsCard } from '@/components/perfil/ThemeSettingsCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';

export default function PerfilPage() {
  const { user, loading, memberSince, refreshUser } = usePerfilData();

  const handleAvatarUpdate = () => {
    refreshUser();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] p-6 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_34%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] md:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <Skeleton className="h-24 w-full rounded-[1.65rem]" />
          <div className="grid gap-6 md:grid-cols-[300px_1fr]">
            <Skeleton className="h-[400px] w-full rounded-[1.65rem]" />
            <Skeleton className="h-[400px] w-full rounded-[1.65rem]" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_34%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-5xl space-y-6"
        >
          <SaasPanel className="overflow-visible">
            <SaasPanelHeader
              eyebrow="Conta"
              title="Meu perfil"
              description="Gerencie suas informações pessoais, foto e preferências de interface."
              icon={UserCircle}
              actions={(
                <Link href="/">
                  <Button variant="outline" className="h-10 gap-2 rounded-xl border-slate-200/80 bg-white/85 px-4 text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white dark:border-slate-800/80 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:bg-slate-900">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Dashboard
                  </Button>
                </Link>
              )}
            />
          </SaasPanel>

          <div className="grid gap-6 md:grid-cols-[350px_1fr]">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12, duration: 0.35 }}
              className="space-y-6"
            >
              <ProfileHeaderCard user={user} onAvatarUpdate={handleAvatarUpdate} />
              <ThemeSettingsCard />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18, duration: 0.35 }}
            >
              <SaasPanel className="h-full">
                <SaasPanelHeader
                  eyebrow="Perfil"
                  title="Detalhes da conta"
                  description="Gerencie suas informações pessoais."
                  icon={UserCircle}
                  tone="slate"
                />
                <div className="p-5">
                  <PerfilUserInfo user={user} memberSince={memberSince} onProfileUpdate={refreshUser} />
                </div>
              </SaasPanel>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </ErrorBoundary>
  );
}
