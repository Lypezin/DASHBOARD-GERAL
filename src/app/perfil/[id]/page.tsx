'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PublicProfileData } from './types';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileDetails } from './components/ProfileDetails';

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
                        <ProfileHeader profile={profile} />
                        <ProfileDetails profile={profile} loading={loading} />
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}
