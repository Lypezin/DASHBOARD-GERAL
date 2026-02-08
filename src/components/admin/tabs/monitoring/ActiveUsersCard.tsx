import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, MapPin } from 'lucide-react';
import { getPathName } from './monitoringUtils';

interface ActiveUsersCardProps {
    activeUsers: any[];
}

export function ActiveUsersCard({ activeUsers }: ActiveUsersCardProps) {
    return (
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
                    {activeUsers.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">Nenhum usuário ativo no momento.</div>
                    ) : (
                        <div className="space-y-4">
                            {activeUsers.map((user) => (
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
    );
}
