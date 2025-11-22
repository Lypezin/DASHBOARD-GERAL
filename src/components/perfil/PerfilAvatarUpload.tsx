import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { usePerfilUpdate } from '@/hooks/perfil/usePerfilUpdate';
import { validateImageFile } from '@/utils/perfil/validation';

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
        <div className="flex-shrink-0">
          <div className="relative">
            <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-700 shadow-lg">
              {displayUrl ? (
                <Image
                  src={displayUrl}
                  alt="Foto de perfil"
                  width={160}
                  height={160}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-4xl sm:text-5xl text-white">👤</span>
              )}
            </div>
            {displayUrl && (
              <button
                onClick={handleRemovePhoto}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remover foto"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Selecionar Imagem
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-slate-700 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer dark:file:bg-blue-500 dark:hover:file:bg-blue-600"
              disabled={uploading}
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB
            </p>
          </div>

          {previewUrl && previewUrl !== avatarUrl && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <span>📤</span>
                  <span>Salvar Foto</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

