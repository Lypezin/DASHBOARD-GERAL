import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, User } from 'lucide-react';
import { PerfilAvatarUpload } from './PerfilAvatarUpload';
import { UserProfile } from '@/hooks/perfil/usePerfilData';

interface ProfileHeaderCardProps {
    user: UserProfile;
    onAvatarUpdate: (newUrl: string | null) => void;
}

export const ProfileHeaderCard = React.memo(function ProfileHeaderCard({ user, onAvatarUpdate }: ProfileHeaderCardProps) {
    return (
        <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                    <PerfilAvatarUpload
                        avatarUrl={user.avatar_url || null}
                        onAvatarUpdate={onAvatarUpdate}
                        userId={user.id}
                    />
                </div>
            </div>
            <CardContent className="pt-20 pb-8 text-center space-y-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {user.full_name}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        {user.email}
                    </p>
                </div>

                <div className="flex justify-center gap-2">
                    {user.is_admin && (
                        <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                        </Badge>
                    )}
                    <Badge variant="outline" className="border-slate-300 dark:border-slate-700">
                        <User className="w-3 h-3 mr-1" />
                        Membro
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
});
