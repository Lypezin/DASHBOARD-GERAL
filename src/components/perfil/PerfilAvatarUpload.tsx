import React, { useRef, useState } from 'react';
import { usePerfilUpdate } from '@/hooks/perfil/usePerfilUpdate';
import { validateImageFile } from '@/utils/perfil/validation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { toast } from "sonner";

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
      toast.loading("Enviando foto...", { id: "upload-avatar" });
      const newUrl = await uploadAvatar(file, userId, avatarUrl);
      if (newUrl) {
        onAvatarUpdate(newUrl);
        toast.success("Foto atualizada!", { id: "upload-avatar" });
      }
    } catch (error) {
      toast.error("Erro ao atualizar foto", { id: "upload-avatar" });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!avatarUrl) return;

    try {
      toast.loading("Removendo foto...", { id: "remove-avatar" });
      await removeAvatar(avatarUrl, userId);
      onAvatarUpdate(null);
      toast.success("Foto removida!", { id: "remove-avatar" });
    } catch (error) {
      toast.error("Erro ao remover foto", { id: "remove-avatar" });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative group">
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
        <Avatar className="h-32 w-32 border-4 border-white dark:border-slate-900 shadow-xl cursor-pointer ring-2 ring-slate-100 dark:ring-slate-800 transition-all hover:ring-blue-500">
          <AvatarImage src={avatarUrl || ''} alt="Foto de perfil" className="object-cover" />
          <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-400 text-4xl font-bold">
            {uploading ? <Loader2 className="h-10 w-10 animate-spin text-blue-600" /> : <Camera className="h-10 w-10" />}
          </AvatarFallback>
        </Avatar>

        {/* Upload Overlay */}
        <div
          onClick={triggerFileInput}
          className={`absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer transition-opacity duration-200 ${isHovered && !uploading ? 'opacity-100' : 'opacity-0'}`}
        >
          <Camera className="h-8 w-8 text-white drop-shadow-md" />
        </div>

        {/* Remove Button */}
        {avatarUrl && !uploading && (
          <div className="absolute bottom-0 right-0">
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8 rounded-full shadow-md border-2 border-white dark:border-slate-900"
              onClick={handleRemovePhoto}
              title="Remover foto"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
