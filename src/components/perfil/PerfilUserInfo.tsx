import React from 'react';
import { ProfileNameField } from './components/ProfileNameField';
import { ProfileEmailField } from './components/ProfileEmailField';
import { ProfileDateField } from './components/ProfileDateField';
import { ProfileAdminBadge } from './components/ProfileAdminBadge';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_approved: boolean;
  avatar_url?: string | null;
  created_at?: string;
}

interface PerfilUserInfoProps {
  user: UserProfile;
  memberSince: string | null;
  onProfileUpdate: () => void;
}

export const PerfilUserInfo: React.FC<PerfilUserInfoProps> = ({
  user,
  memberSince,
  onProfileUpdate,
}) => {
  return (
    <div className="space-y-6">

      {/* Name Field */}
      <ProfileNameField
        userId={user.id}
        currentName={user.full_name}
        onProfileUpdate={onProfileUpdate}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Email Field */}
        <ProfileEmailField email={user.email} />

        {/* Member Since */}
        <ProfileDateField date={memberSince} label="Membro desde" />
      </div>

      {user.is_admin && <ProfileAdminBadge />}

    </div>
  );
};
