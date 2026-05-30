import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PublicProfileData } from '../types';

interface ProfileHeaderProps {
  profile: PublicProfileData | null;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  return (
    <section className="overflow-hidden rounded-[1.65rem] border border-slate-200/80 bg-white/95 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.45)] dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="h-28 bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.34),transparent_24%),linear-gradient(135deg,#2563eb_0%,#0891b2_58%,#0f172a_100%)]" />
      <div className="px-5 pb-8 text-center">
        <div className="-mt-12 flex justify-center">
          <Avatar className="h-24 w-24 border-4 border-white shadow-xl dark:border-slate-950">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Usuário'} />
            <AvatarFallback className="bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-300">
              {profile?.full_name?.slice(0, 2).toUpperCase() || 'US'}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="mt-4 space-y-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black tracking-tight text-slate-950 dark:text-white" title={profile?.full_name || 'Usuário'}>
              {profile?.full_name || 'Usuário'}
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Perfil público da equipe
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline" className="rounded-full border-slate-200 bg-white px-3 py-1 capitalize text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
              {profile?.role || 'usuário'}
            </Badge>
            <Badge className={profile?.is_idle ? 'rounded-full bg-amber-500 px-3 py-1 text-white hover:bg-amber-500' : 'rounded-full bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-600'}>
              {profile?.is_idle ? 'Ausente' : 'Online'}
            </Badge>
          </div>

          {profile?.custom_status ? (
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-3 py-2 text-sm font-medium text-slate-600 dark:border-slate-800/80 dark:bg-slate-900/55 dark:text-slate-300">
              {profile.custom_status}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
