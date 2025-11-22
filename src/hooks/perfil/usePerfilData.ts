import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';

const IS_DEV = process.env.NODE_ENV === 'development';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_approved: boolean;
  avatar_url?: string | null;
  created_at?: string;
}

export const usePerfilData = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberSince, setMemberSince] = useState<string | null>(null);

  const checkUser = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push('/login');
        return;
      }

      const { data: profile, error: profileError } = await safeRpc<UserProfile>('get_current_user_profile', {}, {
        timeout: 10000,
        validateParams: false
      });
      
      if (profileError) throw profileError;

      if (!profile?.is_approved) {
        await supabase.auth.signOut();
        router.push('/login');
        return;
      }

      let fullName = profile.full_name;
      if (!fullName || fullName.trim() === '') {
        fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.fullName || authUser.email?.split('@')[0] || 'Usuário';
      }

      const updatedProfile = { ...profile, full_name: fullName };
      setUser(updatedProfile);
      
      let userCreatedAt: string | null = null;
      if (authUser?.created_at) {
        userCreatedAt = authUser.created_at;
        setMemberSince(authUser.created_at);
      }
      
      if (profile?.id) {
        try {
          if (IS_DEV) safeLog.info('🔍 Buscando avatar_url para usuário:', profile.id);
          
          const { data: profileData, error: profileDataError } = await supabase
            .from('user_profiles')
            .select('avatar_url, id, updated_at, created_at')
            .eq('id', profile.id)
            .single();
          
          if (!userCreatedAt && profileData?.created_at) {
            setMemberSince(profileData.created_at);
          }
          
          if (IS_DEV) safeLog.info('📥 Resultado da busca:', { profileData, profileDataError });
          
          if (!profileDataError && profileData?.avatar_url) {
            if (IS_DEV) safeLog.info('✅ Avatar encontrado:', profileData.avatar_url);
            setUser(prev => prev ? { ...prev, avatar_url: profileData.avatar_url } : null);
          } else if (profileDataError) {
            if (IS_DEV) {
              safeLog.warn('⚠️ Não foi possível buscar avatar_url:', {
                error: profileDataError,
                code: profileDataError.code,
                message: profileDataError.message,
                details: profileDataError.details,
                hint: profileDataError.hint
              });
            }
            
            if (profileDataError.code === 'PGRST116') {
              if (IS_DEV) safeLog.info('📝 Registro não existe, criando registro vazio...');
              try {
                const { error: createError } = await supabase
                  .from('user_profiles')
                  .insert({
                    id: profile.id,
                    avatar_url: null,
                    updated_at: new Date().toISOString()
                  });
                
                if (createError) {
                  if (IS_DEV) safeLog.warn('⚠️ Erro ao criar registro vazio:', createError);
                } else {
                  if (IS_DEV) safeLog.info('✅ Registro vazio criado com sucesso');
                }
              } catch (err) {
                if (IS_DEV) safeLog.warn('⚠️ Erro ao criar registro:', err);
              }
            }
          } else if (profileData && !profileData.avatar_url) {
            if (IS_DEV) safeLog.info('ℹ️ Usuário não tem avatar ainda');
          }
        } catch (err) {
          if (IS_DEV) safeLog.warn('⚠️ Erro ao buscar avatar_url:', err);
        }
      }
    } catch (err) {
      safeLog.error('Erro ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  return {
    user,
    loading,
    memberSince,
    refreshUser: checkUser,
  };
};

