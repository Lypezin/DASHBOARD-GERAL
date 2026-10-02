
import React from 'react';
import {
  Users,
  Building2,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminStatsProps {
  totalUsers: number;
  pendingUsers: number;
  totalOrganizations: number;
}

export function AdminStats({ totalUsers, pendingUsers, totalOrganizations }: AdminStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="group border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Total Usuários
          </CardTitle>
          <div className="rounded-full bg-accent p-2 transition-transform duration-200 group-hover:scale-105">
            <Users className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalUsers}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cadastrados no sistema
          </p>
        </CardContent>
      </Card>

      <Card className="group border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Pendentes
          </CardTitle>
          <div className="rounded-full bg-amber-100 p-2 transition-transform duration-200 group-hover:scale-105 dark:bg-amber-900/30">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{pendingUsers}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aguardando aprovação
          </p>
        </CardContent>
      </Card>

      <Card className="group border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Organizações
          </CardTitle>
          <div className="rounded-full bg-accent p-2 transition-transform duration-200 group-hover:scale-105">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalOrganizations}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ativas na plataforma
          </p>
        </CardContent>
      </Card>

      <Card className="border-primary bg-primary text-primary-foreground shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-100">
            Atividade
          </CardTitle>
            <div className="rounded-full bg-primary-foreground/10 p-2">
            <ArrowUpRight className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+5.2%</div>
          <p className="text-xs text-green-100 mt-1">
            Desde o último mês
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
