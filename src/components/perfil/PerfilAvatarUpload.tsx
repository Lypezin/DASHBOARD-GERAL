import React, { useRef, useState } from 'react';
import { usePerfilUpdate } from '@/hooks/perfil/usePerfilUpdate';
import { validateImageFile } from '@/utils/perfil/validation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface PerfilAvatarUploadProps {
  avatarUrl: string | null | undefined;
  onAvatarUpdate: (newUrl: string | null) => void;
  userId: string;
}

export const PerfilAvatarUpload: React.FC<PerfilAvatarUploadProps> = ({ avatarUrl, onAvatarUpdate, userId }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { uploadAvatar, removeAvatar, uploading } = usePerfilUpdate();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Arquivo inválido');
      return;
    }

    try {
      toast.loading('Enviando foto...', { id: 'upload-avatar' });
      const newUrl = await uploadAvatar(file, userId, avatarUrl);
      if (newUrl) {
        onAvatarUpdate(newUrl);
        toast.success('Foto atualizada.', { id: 'upload-avatar' });
      }
    } catch {
      toast.error('Erro ao atualizar foto.', { id: 'upload-avatar' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!avatarUrl) return;

    try {
      toast.loading('Removendo foto...', { id: 'remove-avatar' });
      await removeAvatar(avatarUrl, userId);
      onAvatarUpdate(null);
      toast.success('Foto removida.', { id: 'remove-avatar' });
    } catch {
      toast.error('Erro ao remover foto.', { id: 'remove-avatar' });
    }
  };

  return (
    <div className="group relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/png,image/gif"
        className="hidden"
      />
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Avatar className="h-28 w-28 cursor-pointer border-4 border-white shadow-2xl ring-1 ring-white/50 transition-all duration-200 hover:ring-blue-300 dark:border-slate-950 dark:ring-slate-700">
          <AvatarImage src={avatarUrl || ''} alt="Foto de perfil" className="object-cover" />
          <AvatarFallback className="bg-slate-100 text-slate-400 dark:bg-slate-900">
            {uploading ? <Loader2 className="h-9 w-9 animate-spin text-blue-600" /> : <Camera className="h-9 w-9" />}
          </AvatarFallback>
        </Avatar>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/50 text-white transition-opacity duration-200 ${isHovered && !uploading ? 'opacity-100' : 'opacity-0'}`}
          aria-label="Alterar foto de perfil"
        >
          <Camera className="h-7 w-7 drop-shadow-md" />
        </button>

        {avatarUrl && !uploading ? (
          <Button
            size="icon"
            variant="destructive"
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full border-2 border-white shadow-md dark:border-slate-950"
            onClick={handleRemovePhoto}
            title="Remover foto"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
};
