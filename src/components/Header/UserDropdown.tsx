import React, { useRef } from 'react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, Upload, Loader2 } from 'lucide-react';
import { UserProfile } from '@/hooks/auth/types';
import { usePerfilUpdate } from '@/hooks/perfil/usePerfilUpdate';
import { validateImageFile } from '@/utils/perfil/validation';
import { toast } from 'sonner';

interface UserDropdownProps {
  user: UserProfile | null;
  avatarUrl: string | null;
  onLogout: () => void;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({
  user,
  avatarUrl,
  onLogout,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar, uploading } = usePerfilUpdate();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Arquivo inválido');
      return;
    }

    try {
      toast.loading('Enviando foto...', { id: 'upload-avatar-dropdown' });
      const newUrl = await uploadAvatar(file, user?.id || '', avatarUrl);
      if (newUrl) {
        toast.success('Foto atualizada com sucesso!', { id: 'upload-avatar-dropdown' });
        // Dispara o evento global que força a atualização do bootstrap e de todos os avatares na tela
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('userProfileUpdated'));
        }
      }
    } catch (err) {
      toast.error('Erro ao atualizar foto.', { id: 'upload-avatar-dropdown' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/png,image/gif"
        className="hidden"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative ml-1 h-9 w-9 rounded-full group focus:outline-none"
          >
            <Avatar className="h-9 w-9 border border-border transition-transform duration-200 group-hover:scale-105">
              <AvatarImage src={avatarUrl || user?.avatar_url || undefined} alt={user?.full_name || 'Usuário'} />
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 rounded-2xl border-slate-200/80 p-2 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.42)] dark:border-slate-800/80">
          <DropdownMenuLabel className="font-normal">
            <div className="flex min-w-0 flex-col space-y-1">
              <p className="truncate text-sm font-semibold leading-none text-slate-900 dark:text-slate-100" title={user?.full_name || 'Usuário'}>
                {user?.full_name || 'Usuário'}
              </p>
              <p className="truncate text-xs leading-none text-muted-foreground" title={user?.email || ''}>
                {user?.email || ''}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="cursor-pointer rounded-xl transition-colors duration-150"
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-600" />
            ) : (
              <Upload className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
            )}
            <span className="font-medium">Alterar foto</span>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/perfil" className="w-full cursor-pointer rounded-xl">
              <Settings className="mr-2 h-4 w-4" />
              <span className="font-medium">Meu perfil</span>
            </Link>
          </DropdownMenuItem>

          {user?.is_admin ? (
            <DropdownMenuItem asChild>
              <Link href="/admin" className="w-full cursor-pointer rounded-xl">
                <Settings className="mr-2 h-4 w-4" />
                <span className="font-medium">Administração</span>
              </Link>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={onLogout}
            className="cursor-pointer rounded-xl text-destructive focus:text-destructive font-medium"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair da conta</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
