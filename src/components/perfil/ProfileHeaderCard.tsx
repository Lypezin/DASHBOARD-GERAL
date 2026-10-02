import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, User } from 'lucide-react';
import { PerfilAvatarUpload } from './PerfilAvatarUpload';
import { UserProfile } from '@/hooks/perfil/usePerfilData';

interface ProfileHeaderCardProps {
  user: UserProfile;
  onAvatarUpdate: (newUrl: string | null) => void;
}

export const ProfileHeaderCard = React.memo(function ProfileHeaderCard({ user, onAvatarUpdate }: ProfileHeaderCardProps) {
  return (
    <section className="overflow-hidden rounded-[1.65rem] border border-slate-200/80 bg-white/95 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.45)] dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="relative h-36 bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.34),transparent_24%),linear-gradient(135deg,#2563eb_0%,#0891b2_58%,#0f172a_100%)]">
        <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">Perfil</p>
            <h2 className="mt-1 truncate text-2xl font-black tracking-tight text-white" title={user.full_name}>
              {user.full_name}
            </h2>
          </div>
          <div className="shrink-0">
            <PerfilAvatarUpload
              avatarUrl={user.avatar_url || null}
              onAvatarUpdate={onAvatarUpdate}
              userId={user.id}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5 pt-7">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-500 dark:text-slate-400" title={user.email}>
            {user.email}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {user.is_admin ? (
            <Badge className="rounded-full border border-blue-500/20 bg-blue-600 px-3 py-1 text-white hover:bg-blue-600">
              <Shield className="mr-1.5 h-3.5 w-3.5" />
              Admin
            </Badge>
          ) : null}
          <Badge variant="outline" className="rounded-full border-slate-200 bg-white px-3 py-1 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            <User className="mr-1.5 h-3.5 w-3.5" />
            Membro
          </Badge>
        </div>
      </div>
    </section>
  );
});
