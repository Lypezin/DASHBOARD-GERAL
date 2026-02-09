import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, BarChart3, Clock } from 'lucide-react';
import { formatDuration } from './monitoringUtils';

interface MonitoringStatsGridProps {
    stats: {
        activeUsers: any[];
        userTime: any[];
    };
}

export const MonitoringStatsGrid = React.memo(function MonitoringStatsGrid({ stats }: MonitoringStatsGridProps) {
    const { totalVisits, totalTimeSeconds } = React.useMemo(() => {
        return {
            totalVisits: stats.userTime.reduce((acc, curl) => acc + curl.totalVisits, 0),
            totalTimeSeconds: stats.userTime.reduce((acc, curl) => acc + curl.totalTimeSeconds, 0)
        };
    }, [stats.userTime]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-white dark:from-slate-900 dark:to-slate-900 border-green-200/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Usuários Online</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                        <Activity className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.activeUsers.length}</div>
                    <p className="text-xs text-muted-foreground">Ativos nos últimos 5 min</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Visitas (24h)</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <BarChart3 className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {totalVisits}
                    </div>
                    <p className="text-xs text-muted-foreground">Visualizações de página</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Total (24h)</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                        <Clock className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatDuration(totalTimeSeconds)}
                    </div>
                    <p className="text-xs text-muted-foreground">Tempo somado de todos usuários</p>
                </CardContent>
            </Card>
        </div>
    );
});
