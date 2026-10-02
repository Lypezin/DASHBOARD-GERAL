import { Activity, Clock3, Shield, User2 } from 'lucide-react';
import { PublicProfileData } from '../types';
import { SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';
import type { ElementType, ReactNode } from 'react';

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
    <SaasPanel className="h-full">
      <SaasPanelHeader
        eyebrow="Detalhes"
        title="Detalhes do perfil"
        description="Informações públicas exibidas na equipe e no chat."
        icon={User2}
        tone="slate"
      />
      <div className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoTile icon={User2} label="Nome" value={profile?.full_name || 'Usuário'} />
          <InfoTile icon={Shield} label="Cargo" value={profile?.role || 'usuário'} capitalize />
        </div>

        {profile?.current_tab ? (
          <InfoTile icon={Activity} label="Atividade atual" value={formatTabLabel(profile.current_tab)} />
        ) : null}

        {(profile?.online_at || profile?.created_at) ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {profile?.online_at ? (
              <InfoTile icon={Clock3} label="Online desde" value={new Date(profile.online_at).toLocaleString('pt-BR')} />
            ) : null}
            {profile?.created_at ? (
              <InfoTile icon={Clock3} label="Membro desde" value={new Date(profile.created_at).toLocaleDateString('pt-BR')} />
            ) : null}
          </div>
        ) : null}

        {loading ? (
          <p className="rounded-md border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            Carregando informações adicionais do perfil...
          </p>
        ) : null}
      </div>
    </SaasPanel>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  capitalize,
}: {
  icon: ElementType;
  label: string;
  value: ReactNode;
  capitalize?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>
      <p className={`mt-2 min-w-0 break-words text-sm text-foreground ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </p>
    </div>
  );
}
