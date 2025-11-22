import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';

const IS_DEV = process.env.NODE_ENV === 'development';

export const usePerfilUpdate = () => {
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateFullName = useCallback(async (newName: string, userId: string, onSuccess?: () => void) => {
    if (!newName.trim()) {
      setError('O nome não pode estar vazio.');
      return;
    }

    setSavingName(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Usuário não autenticado');

      const trimmedName = newName.trim();
      if (!trimmedName) {
        throw new Error('O nome não pode estar vazio');
      }

      try {
        const { data: rpcData, error: rpcError } = await safeRpc<{ success?: boolean; error?: string }>('update_user_full_name', {
          p_user_id: authUser.id,
          p_full_name: trimmedName
        }, {
          timeout: 30000,
          validateParams: true
        });

        if (!rpcError && rpcData && (rpcData as any).success) {
          if (IS_DEV) safeLog.info('✅ Nome atualizado via RPC');
        } else if (rpcError) {
          if (IS_DEV) safeLog.warn('Função update_user_full_name não disponível ou erro:', rpcError);
        }
      } catch (err) {
        if (IS_DEV) safeLog.warn('Erro ao atualizar nome via RPC:', err);
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...authUser.user_metadata,
          full_name: trimmedName
        }
      });

      if (updateError) throw updateError;

      try {
        const { error: profileUpdateError } = await supabase
          .from('user_profiles')
          .upsert({
            id: authUser.id,
            full_name: trimmedName,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (profileUpdateError && IS_DEV) {
          safeLog.warn('Erro ao atualizar user_profiles:', profileUpdateError);
        }
      } catch (err) {
        if (IS_DEV) safeLog.warn('Erro ao atualizar user_profiles:', err);
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('userProfileUpdated', {
          detail: { full_name: trimmedName }
        }));
      }

      setSuccess('Nome atualizado com sucesso!');
      onSuccess?.();
    } catch (err: any) {
      safeLog.error('Erro ao atualizar nome:', err);
      setError(err.message || 'Erro ao atualizar nome. Tente novamente.');
    } finally {
      setSavingName(false);
    }
  }, []);

  const uploadAvatar = useCallback(async (file: File, userId: string, currentAvatarUrl: string | null | undefined) => {
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Usuário não autenticado');

      if (currentAvatarUrl) {
        try {
          let oldFilePath = '';
          if (currentAvatarUrl.includes('/avatars/')) {
            const urlParts = currentAvatarUrl.split('/avatars/');
            if (urlParts.length > 1) {
              oldFilePath = urlParts[1];
            }
          } else {
            const urlParts = currentAvatarUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
            oldFilePath = `${authUser.id}/${fileName}`;
          }
          
          if (oldFilePath) {
            await supabase.storage
              .from('avatars')
              .remove([oldFilePath]);
          }
        } catch (err) {
          if (IS_DEV) safeLog.warn('Não foi possível remover foto antiga:', err);
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${authUser.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('does not exist')) {
          throw new Error('O bucket "avatars" não existe no Supabase Storage. Por favor, crie o bucket seguindo as instruções no arquivo CRIAR_PERFIL_FOTO.sql');
        }
        throw new Error(`Erro ao fazer upload da imagem: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (IS_DEV) {
        safeLog.info('🔍 URL pública gerada:', { publicUrl, filePath });
      }

      const { data: upsertData, error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          id: authUser.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select();

      if (IS_DEV) safeLog.info('💾 Resultado do upsert:', { upsertData, updateError });

      if (updateError) {
        if (IS_DEV) safeLog.error('❌ Erro no upsert direto:', updateError);
        
        const { error: rpcError } = await safeRpc('update_user_avatar', {
          p_user_id: authUser.id,
          p_avatar_url: publicUrl
        }, {
          timeout: 30000,
          validateParams: true
        });

        if (rpcError) {
          if (IS_DEV) safeLog.error('❌ Erro ao atualizar avatar via RPC:', rpcError);
          throw new Error(`Erro ao salvar URL da foto: ${rpcError.message}`);
        } else {
          if (IS_DEV) safeLog.info('✅ Avatar atualizado via RPC com sucesso');
        }
      } else {
        if (IS_DEV) safeLog.info('✅ Avatar atualizado na tabela com sucesso');
      }

      setSuccess('Foto atualizada com sucesso!');

      await new Promise(resolve => setTimeout(resolve, 300));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('userProfileUpdated', {
          detail: { avatar_url: publicUrl }
        }));
      }

      return publicUrl;
    } catch (err: any) {
      safeLog.error('Erro ao fazer upload:', err);
      setError(err.message || 'Erro ao fazer upload da imagem. Tente novamente.');
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const removeAvatar = useCallback(async (currentAvatarUrl: string, userId: string) => {
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Usuário não autenticado');

      let filePath = '';
      if (currentAvatarUrl.includes('/avatars/')) {
        const urlParts = currentAvatarUrl.split('/avatars/');
        if (urlParts.length > 1) {
          filePath = urlParts[1];
        }
      } else {
        const urlParts = currentAvatarUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        filePath = `${authUser.id}/${fileName}`;
      }

      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (deleteError) {
        if (IS_DEV) safeLog.warn('Erro ao remover arquivo do storage:', deleteError);
      }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          id: authUser.id,
          avatar_url: null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (updateError) {
        const { error: rpcError } = await safeRpc('update_user_avatar', {
          p_user_id: authUser.id,
          p_avatar_url: null
        }, {
          timeout: 30000,
          validateParams: true
        });

        if (rpcError) {
          if (IS_DEV) safeLog.warn('Erro ao remover avatar via RPC:', rpcError);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('userProfileUpdated', {
          detail: { avatar_url: null }
        }));
      }

      setSuccess('Foto removida com sucesso!');
    } catch (err: any) {
      safeLog.error('Erro ao remover foto:', err);
      setError(err.message || 'Erro ao remover foto. Tente novamente.');
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return {
    updateFullName,
    uploadAvatar,
    removeAvatar,
    savingName,
    uploading,
    error,
    success,
    setError,
    setSuccess,
  };
};

