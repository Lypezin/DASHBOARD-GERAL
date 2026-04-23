'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Activity, Clock3, User2, Shield } from 'lucide-react';

interface PublicProfileData {
    id: string;
    full_name: string;
    avatar_url?: string | null;
    created_at?: string | null;
    role?: string | null;
    custom_status?: string | null;
    current_tab?: string | null;
    online_at?: string | null;
    is_idle?: boolean;
}

function formatTabLabel(currentTab?: string | null) {
    if (!currentTab) return null;
    return currentTab.replace(/-/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase());
}

export default function PublicPerfilPage() {
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const profileId = Array.isArray(params?.id) ? params.id[0] : params?.id;

    const initialProfile = useMemo<PublicProfileData | null>(() => {
        if (!profileId) return null;

        return {
            id: profileId,
            full_name: searchParams.get('name') || 'Usuario',
            avatar_url: searchParams.get('avatar'),
            role: searchParams.get('role'),
            custom_status: searchParams.get('status'),
            current_tab: searchParams.get('tab'),
            online_at: searchParams.get('onlineAt'),
            is_idle: searchParams.get('idle') === '1'
        };
    }, [profileId, searchParams]);

    const [profile, setProfile] = useState<PublicProfileData | null>(initialProfile);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setProfile(initialProfile);
    }, [initialProfile]);

    useEffect(() => {
        if (!profileId) return;

        let cancelled = false;

        const fetchProfile = async () => {
            try {
                const { data, error } = await supabase
                    .from('user_profiles')
                    .select('id, full_name, avatar_url, created_at')
                    .eq('id', profileId)
                    .maybeSingle();

                if (cancelled || error || !data) return;

                setProfile(prev => ({
                    id: data.id,
                    full_name: data.full_name || prev?.full_name || 'Usuario',
                    avatar_url: data.avatar_url || prev?.avatar_url || null,
                    created_at: data.created_at || prev?.created_at || null,
                    role: prev?.role || null,
                    custom_status: prev?.custom_status || null,
                    current_tab: prev?.current_tab || null,
                    online_at: prev?.online_at || null,
                    is_idle: prev?.is_idle
                }));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void fetchProfile();

        return () => {
            cancelled = true;
        };
    }, [profileId]);

    if (!profileId) return null;

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-slate-50/50 px-4 py-8 dark:bg-slate-950/50 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl space-y-6">
                    <div className="flex items-center justify-between">
                        <Link href="/">
                            <Button variant="ghost" className="gap-2 pl-0 hover:pl-2 transition-all">
                                <ArrowLeft className="h-4 w-4" />
                                Voltar ao Dashboard
                            </Button>
                        </Link>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                        <Card className="overflow-hidden border-slate-200 shadow-lg dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
                            <div className="h-28 bg-gradient-to-r from-blue-600 to-indigo-600" />
                            <CardContent className="pt-0 pb-8 text-center">
                                <div className="-mt-12 flex justify-center">
                                    <Avatar className="h-24 w-24 border-4 border-white shadow-xl dark:border-slate-900">
                                        <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Usuario'} />
                                        <AvatarFallback>{profile?.full_name?.slice(0, 2).toUpperCase() || 'US'}</AvatarFallback>
                                    </Avatar>
                                </div>

                                <div className="mt-4 space-y-3">
                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {profile?.full_name || 'Usuario'}
                                        </h1>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Perfil publico da equipe
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap justify-center gap-2">
                                        <Badge variant="outline" className="capitalize">
                                            {profile?.role || 'usuario'}
                                        </Badge>
                                        <Badge className={profile?.is_idle ? 'bg-amber-500 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-600'}>
                                            {profile?.is_idle ? 'Ausente' : 'Online'}
                                        </Badge>
                                    </div>

                                    {profile?.custom_status && (
                                        <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                                            {profile.custom_status}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

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
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}
