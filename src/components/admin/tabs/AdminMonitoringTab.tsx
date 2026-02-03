import React from 'react';
import { useMonitoringData } from '@/hooks/admin/useMonitoringData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Clock, MapPin, AlertCircle, BarChart3, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function getPathName(path: string) {
    if (path === '/') return 'Dashboard Principal';
    return path.replace('/', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

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
                            {stats.userTime.reduce((acc, curl) => acc + curl.totalVisits, 0)}
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
                            {formatDuration(stats.userTime.reduce((acc, curl) => acc + curl.totalTimeSeconds, 0))}
                        </div>
                        <p className="text-xs text-muted-foreground">Tempo somado de todos usuários</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Users List */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-green-600" />
                            Usuários Ativos Agora
                        </CardTitle>
                        <CardDescription>Quem está usando o dashboard neste momento</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[350px] pr-4">
                            {stats.activeUsers.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">Nenhum usuário ativo no momento.</div>
                            ) : (
                                <div className="space-y-4">
                                    {stats.activeUsers.map((user) => (
                                        <div key={user.userId} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <Avatar>
                                                        <AvatarImage src={user.profile?.avatar_url} />
                                                        <AvatarFallback>{user.profile?.full_name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-slate-900"></span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium leading-none">{user.profile?.full_name || 'Usuário Desconhecido'}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">{user.profile?.email}</p>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {getPathName(user.currentPath)}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Top Pages */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            Páginas Mais Acessadas
                        </CardTitle>
                        <CardDescription>Baseado nas visitas das últimas 24 horas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[350px] pr-4">
                            <div className="space-y-4">
                                {stats.topPages.map((page, i) => (
                                    <div key={page.path} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{getPathName(page.path)}</p>
                                                <p className="text-xs text-muted-foreground">Tempo médio: {formatDuration(page.avgDuration)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-bold text-slate-700 dark:text-slate-200">{page.visits}</span>
                                            <p className="text-xs text-muted-foreground">visitas</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Engagement Leaderboard */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-600" />
                        Engajamento por Usuário
                    </CardTitle>
                    <CardDescription>Tempo total online nas últimas 24 horas</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Usuário</th>
                                    <th className="h-10 px-4 text-center font-medium text-muted-foreground">Visitas</th>
                                    <th className="h-10 px-4 text-right font-medium text-muted-foreground">Tempo Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.userTime.slice(0, 10).map((stat) => (
                                    <tr key={stat.userId} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={stat.profile?.avatar_url} />
                                                    <AvatarFallback>{stat.profile?.full_name?.substring(0, 2) || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{stat.profile?.full_name || 'Desconhecido'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center align-middle">
                                            {stat.totalVisits}
                                        </td>
                                        <td className="p-4 text-right align-middle font-medium">
                                            {formatDuration(stat.totalTimeSeconds)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
