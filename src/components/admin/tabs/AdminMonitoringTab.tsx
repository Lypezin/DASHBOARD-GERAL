import React from 'react';
import { useMonitoringData } from '@/hooks/admin/useMonitoringData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Clock, MapPin, AlertCircle, BarChart3, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { MonitoringStatsGrid } from './monitoring/MonitoringStatsGrid';
import { ActiveUsersCard } from './monitoring/ActiveUsersCard';
import { TopPagesCard } from './monitoring/TopPagesCard';
import { EngagementLeaderboard } from './monitoring/EngagementLeaderboard';

export function AdminMonitoringTab() {
    const { stats, loading, error } = useMonitoringData();

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Carregando dados de monitoramento...</div>;
    }

    if (error && error.includes("Tabela de logs não encontrada")) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Configuração Necessária</AlertTitle>
                <AlertDescription>
                    A tabela de logs de atividade não foi encontrada. Por favor, execute o script SQL <strong>create_activity_logs.sql</strong> no Supabase para habilitar o monitoramento.
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in-50 duration-500">
            {/* Header Stats */}
            <MonitoringStatsGrid stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Users List */}
                <ActiveUsersCard activeUsers={stats.activeUsers} />

                {/* Top Pages */}
                <TopPagesCard topPages={stats.topPages} />
            </div>

            {/* Engagement Leaderboard */}
            {/* Engagement Leaderboard */}
            <EngagementLeaderboard userTime={stats.userTime} />
        </div>
    );
}
