import React from 'react';
import { useMonitoringData } from '@/hooks/admin/useMonitoringData';
import { RefreshCcw, AlertCircle, Activity } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { MonitoringStatsGrid } from './monitoring/MonitoringStatsGrid';
import { ActiveUsersCard } from './monitoring/ActiveUsersCard';
import { TopPagesCard } from './monitoring/TopPagesCard';
import { EngagementLeaderboard } from './monitoring/EngagementLeaderboard';

export function AdminMonitoringTab() {
    const { stats, loading, refreshing, error, lastUpdated, refresh } = useMonitoringData();

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Carregando dados de monitoramento...</div>;
    }

    if (error && error.includes('Tabela de logs não encontrada')) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Configuração Necessária</AlertTitle>
                <AlertDescription>
                    A tabela de logs de atividade não foi encontrada. Por favor, execute o script SQL <strong>create_activity_logs.sql</strong> no Supabase para habilitar o monitoramento.
                </AlertDescription>
            </Alert>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Falha ao carregar monitoramento</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in-50 duration-500">
            <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-emerald-600" />
                        <h3 className="font-semibold">Monitoramento em tempo quase real</h3>
                        <Badge variant="secondary">{refreshing ? 'Atualizando...' : 'Auto-refresh 30s'}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Usuários ativos usam janela de 5 minutos e o painel prioriza a atividade mais recente por last_seen.
                    </p>
                    {lastUpdated && (
                        <p className="text-xs text-muted-foreground">
                            Última atualização: {new Date(lastUpdated).toLocaleString()}
                        </p>
                    )}
                </div>

                <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
                    <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Atualizar agora
                </Button>
            </div>

            <MonitoringStatsGrid stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ActiveUsersCard activeUsers={stats.activeUsers} />
                <TopPagesCard topPages={stats.topPages} />
            </div>

            <EngagementLeaderboard userTime={stats.userTime} />
        </div>
    );
}
