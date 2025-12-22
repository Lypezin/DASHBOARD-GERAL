import React, { useRef, useState } from 'react';
import { usePerfilUpdate } from '@/hooks/perfil/usePerfilUpdate';
import { validateImageFile } from '@/utils/perfil/validation';
import { ProfileAvatarDisplay } from './components/ProfileAvatarDisplay';
import { ProfileAvatarUploader } from './components/ProfileAvatarUploader';

interface PerfilAvatarUploadProps {
  avatarUrl: string | null | undefined;
  onAvatarUpdate: (newUrl: string | null) => void;
  userId: string;
}

export const PerfilAvatarUpload: React.FC<PerfilAvatarUploadProps> = ({
  avatarUrl,
  onAvatarUpdate,
  userId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { uploadAvatar, removeAvatar, uploading, error, success, setError, setSuccess } = usePerfilUpdate();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Arquivo inválido');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Por favor, selecione uma imagem.');
      return;
    }

    try {
      const newUrl = await uploadAvatar(file, userId, avatarUrl);
      if (newUrl) {
        setPreviewUrl(newUrl);
        onAvatarUpdate(newUrl);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      // Error já é tratado no hook
    }
  };

  const handleRemovePhoto = async () => {
    if (!avatarUrl) return;

    try {
      await removeAvatar(avatarUrl, userId);
      setPreviewUrl(null);
      onAvatarUpdate(null);
    } catch (err) {
      // Error já é tratado no hook
    }
  };

  const displayUrl = previewUrl || avatarUrl;

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Foto de Perfil</h2>
      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
          <p className="font-semibold">⚠️ Erro</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <p className="font-semibold">✅ Sucesso</p>
          <p className="text-sm mt-1">{success}</p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <ProfileAvatarDisplay
          displayUrl={displayUrl}
          onRemove={handleRemovePhoto}
          canRemove={!!displayUrl}
          uploading={uploading}
        />

        <ProfileAvatarUploader
          ref={fileInputRef}
          onFileSelect={handleFileSelect}
          onUpload={handleUpload}
          uploading={uploading}
          hasPreview={!!previewUrl && previewUrl !== avatarUrl}
        />
      </div>
    </div>
  );
};
