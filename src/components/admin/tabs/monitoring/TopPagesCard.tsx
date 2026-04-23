import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin } from 'lucide-react';
import { formatDuration, getPathName } from './monitoringUtils';

interface TopPagesCardProps {
    topPages: Array<{
        path: string;
        visits: number;
        avgDuration: number;
    }>;
}

export function TopPagesCard({ topPages }: TopPagesCardProps) {
    return (
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
                    {topPages.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">Nenhum acesso registrado nas últimas 24h.</div>
                    ) : (
                        <div className="space-y-4">
                            {topPages.map((page, i) => (
                                <div
                                    key={page.path}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-8 w-8 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                                            {i + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{getPathName(page.path)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Tempo médio: {formatDuration(page.avgDuration)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-lg font-bold text-slate-700 dark:text-slate-200">{page.visits}</span>
                                        <p className="text-xs text-muted-foreground">visitas</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
