import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock } from 'lucide-react';
import { formatDuration } from './monitoringUtils';

interface EngagementLeaderboardProps {
    userTime: any[];
}

export function EngagementLeaderboard({ userTime }: EngagementLeaderboardProps) {
    return (
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
                            {userTime.slice(0, 10).map((stat) => (
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
    );
}
