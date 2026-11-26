import React from 'react';
import {
  Users,
  Building2,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger';

interface AdminStatsProps {
  totalUsers: number;
  pendingUsers: number;
  totalOrganizations: number;
}

export function AdminStats({ totalUsers, pendingUsers, totalOrganizations }: AdminStatsProps) {
  const approvedUsers = Math.max(0, totalUsers - pendingUsers);
  const approvalRate = totalUsers > 0 ? Math.round((approvedUsers / totalUsers) * 100) : 0;

  return (
    <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" staggerDelay={0.04}>
      <StaggerItem>
        <Card className="h-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-lg group hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Usuários
            </CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              <AnimatedCounter value={totalUsers} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Cadastrados no sistema
            </p>
          </CardContent>
        </Card>
      </StaggerItem>

      <StaggerItem>
        <Card className="h-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-lg group hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Pendentes
            </CardTitle>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              <AnimatedCounter value={pendingUsers} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>
      </StaggerItem>

      <StaggerItem>
        <Card className="h-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-lg group hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Organizações
            </CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              <AnimatedCounter value={totalOrganizations} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ativas na plataforma
            </p>
          </CardContent>
        </Card>
      </StaggerItem>

      <StaggerItem>
        <Card className="h-full bg-gradient-to-br from-emerald-500 to-teal-600 border-none shadow-lg text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-50">
              Aprovados
            </CardTitle>
            <div className="p-2 bg-white/20 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              <AnimatedCounter value={approvedUsers} />
            </div>
            <p className="text-xs text-emerald-50/90 tabular-nums mt-1">
              {approvalRate}% da base com acesso ativo
            </p>
          </CardContent>
        </Card>
      </StaggerItem>
    </StaggerContainer>
  );
}
