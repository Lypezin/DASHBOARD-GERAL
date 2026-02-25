import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { updateUserName, updateUserAvatar, removeUserAvatar } from '@/utils/profile/profileActions';

export const usePerfilUpdate = () => {
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateFullName = useCallback(async (newName: string, userId: string, onSuccess?: () => void) => {
    if (!newName.trim()) return setError('O nome não pode estar vazio.');

    setSavingName(true); setError(null); setSuccess(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      await updateUserName(user.id, newName.trim());
      setSuccess('Nome atualizado com sucesso!');
      onSuccess?.();
    } catch (err: unknown) {
      safeLog.error('Erro atualizar nome:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar nome.');
    } finally {
      setSavingName(false);
    }
  }, []);

  const uploadAvatar = useCallback(async (file: File, userId: string, currentAvatarUrl?: string | null) => {
    setUploading(true); setError(null); setSuccess(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const url = await updateUserAvatar(user.id, file, currentAvatarUrl);
      setSuccess('Foto atualizada com sucesso!');
      return url;
    } catch (err: unknown) {
      safeLog.error('Erro upload:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar foto.');
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const removeAvatar = useCallback(async (currentAvatarUrl: string, userId: string) => {
    setUploading(true); setError(null); setSuccess(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      await removeUserAvatar(user.id, currentAvatarUrl);
      setSuccess('Foto removida com sucesso!');
    } catch (err: unknown) {
      safeLog.error('Erro remover foto:', err);
      setError(err instanceof Error ? err.message : 'Erro ao remover foto.');
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return {
    updateFullName, uploadAvatar, removeAvatar,
    savingName, uploading, error, success, setError, setSuccess
  };
};
