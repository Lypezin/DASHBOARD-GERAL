import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PublicProfileData } from '../types';

interface ProfileHeaderProps {
    profile: PublicProfileData | null;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
    return (
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
    );
}
