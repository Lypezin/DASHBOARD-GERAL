'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserCircle } from 'lucide-react';
import { PublicProfileData } from './types';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileDetails } from './components/ProfileDetails';
import { SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';
import { getAppApiData } from '@/utils/app/fetchAppApi';

export default function PublicPerfilPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const profileId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const initialProfile = useMemo<PublicProfileData | null>(() => {
    if (!profileId) return null;

    return {
      id: profileId,
      full_name: searchParams.get('name') || 'Usuário',
      avatar_url: searchParams.get('avatar'),
      role: searchParams.get('role'),
      custom_status: searchParams.get('status'),
      current_tab: searchParams.get('tab'),
      online_at: searchParams.get('onlineAt'),
      is_idle: searchParams.get('idle') === '1',
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
        const { data } = await getAppApiData<Pick<PublicProfileData, 'id' | 'full_name' | 'avatar_url' | 'created_at'>>(
          `/api/profile/public/${profileId}`
        );

        if (cancelled || !data) return;

        setProfile((prev) => ({
          id: data.id,
          full_name: data.full_name || prev?.full_name || 'Usuário',
          avatar_url: data.avatar_url || prev?.avatar_url || null,
          created_at: data.created_at || prev?.created_at || null,
          role: prev?.role || null,
          custom_status: prev?.custom_status || null,
          current_tab: prev?.current_tab || null,
          online_at: prev?.online_at || null,
          is_idle: prev?.is_idle,
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
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_34%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <SaasPanel className="overflow-visible">
            <SaasPanelHeader
              eyebrow="Equipe"
              title="Perfil público"
              description="Informações públicas exibidas na equipe e no chat."
              icon={UserCircle}
              actions={(
                <Link href="/" prefetch>
                  <Button variant="outline" className="h-10 gap-2 rounded-xl border-slate-200/80 bg-white/85 px-4 text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white dark:border-slate-800/80 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:bg-slate-900">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Dashboard
                  </Button>
                </Link>
              )}
            />
          </SaasPanel>

          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <ProfileHeader profile={profile} />
            <ProfileDetails profile={profile} loading={loading} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
