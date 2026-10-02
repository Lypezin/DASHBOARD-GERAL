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
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="relative h-32 bg-[#173b2f]">
        <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">Perfil</p>
            <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-white" title={user.full_name}>
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
          <p className="truncate text-sm text-muted-foreground" title={user.email}>
            {user.email}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {user.is_admin ? (
            <Badge className="rounded-full border border-primary/20 bg-primary px-3 py-1 text-primary-foreground hover:bg-primary">
              <Shield className="mr-1.5 h-3.5 w-3.5" />
              Admin
            </Badge>
          ) : null}
          <Badge variant="outline" className="rounded-full border-border bg-background px-3 py-1 text-foreground">
            <User className="mr-1.5 h-3.5 w-3.5" />
            Membro
          </Badge>
        </div>
      </div>
    </section>
  );
});
