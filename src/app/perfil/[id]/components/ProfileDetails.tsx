import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock3, Shield, User2 } from 'lucide-react';
import { PublicProfileData } from '../types';

interface ProfileDetailsProps {
    profile: PublicProfileData | null;
    loading?: boolean;
}

function formatTabLabel(currentTab?: string | null) {
    if (!currentTab) return null;
    return currentTab.replace(/-/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase());
}

export function ProfileDetails({ profile, loading }: ProfileDetailsProps) {
    return (
        <Card className="border-slate-200 shadow-lg dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
            <CardHeader>
                <CardTitle>Detalhes do perfil</CardTitle>
                <CardDescription>Informacoes publicas exibidas na equipe e no chat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                            <User2 className="h-4 w-4 text-blue-500" />
                            Nome
                        </div>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            {profile?.full_name || 'Usuario'}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                            <Shield className="h-4 w-4 text-indigo-500" />
                            Cargo
                        </div>
                        <p className="mt-2 text-sm capitalize text-slate-600 dark:text-slate-300">
                            {profile?.role || 'usuario'}
                        </p>
                    </div>
                </div>

                {profile?.current_tab && (
                    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                            <Activity className="h-4 w-4 text-emerald-500" />
                            Atividade atual
                        </div>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            {formatTabLabel(profile.current_tab)}
                        </p>
                    </div>
                )}

                {(profile?.online_at || profile?.created_at) && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {profile?.online_at && (
                            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                    <Clock3 className="h-4 w-4 text-slate-400" />
                                    Online desde
                                </div>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                    {new Date(profile.online_at).toLocaleString()}
                                </p>
                            </div>
                        )}

                        {profile?.created_at && (
                            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                    <Clock3 className="h-4 w-4 text-slate-400" />
                                    Membro desde
                                </div>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                    {new Date(profile.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {loading && (
                    <p className="text-sm text-slate-400">
                        Carregando informacoes adicionais do perfil...
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
