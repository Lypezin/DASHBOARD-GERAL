import React, { useState } from 'react';
import { usePerfilUpdate } from '@/hooks/perfil/usePerfilUpdate';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Mail, User, Check, X, Pencil, Loader2, Shield } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_approved: boolean;
  avatar_url?: string | null;
  created_at?: string;
}

interface PerfilUserInfoProps {
  user: UserProfile;
  memberSince: string | null;
  onProfileUpdate: () => void;
}

export const PerfilUserInfo: React.FC<PerfilUserInfoProps> = ({
  user,
  memberSince,
  onProfileUpdate,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(user.full_name);
  const { updateFullName, savingName } = usePerfilUpdate();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      toast.error("O nome não pode estar vazio.");
      return;
    }

    if (editedName.trim() === user.full_name) {
      setIsEditingName(false);
      return;
    }

    await updateFullName(editedName, user.id, () => {
      toast.success("Nome atualizado com sucesso!");
      setIsEditingName(false);
      onProfileUpdate();
    });
  };

  const handleCancel = () => {
    setEditedName(user.full_name);
    setIsEditingName(false);
  };

  return (
    <div className="space-y-6">

      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-base font-semibold">Nome Completo</Label>
        <div className="relative">
          {isEditingName ? (
            <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="relative flex-1">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <Input
                  id="fullName"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  disabled={savingName}
                  className="pl-10"
                  placeholder="Seu nome completo"
                />
              </div>
              <Button
                onClick={handleSaveName}
                disabled={savingName}
                size="icon"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
              <Button
                onClick={handleCancel}
                disabled={savingName}
                size="icon"
                variant="outline"
                className="hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 group">
              <div className="relative flex-1">
                <div className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none">
                  <User className="h-5 w-5" />
                </div>
                <div className="w-full flex items-center rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 pl-10 text-sm ring-offset-white dark:ring-offset-slate-950 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-80">
                  {user.full_name}
                </div>
              </div>
              <Button
                onClick={() => setIsEditingName(true)}
                variant="outline"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                title="Editar nome"
              >
                <Pencil className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-base font-semibold">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <Input
              id="email"
              value={user.email}
              readOnly
              disabled
              className="pl-10 bg-slate-50 dark:bg-slate-900/50"
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pl-1">
            O e-mail não pode ser alterado.
          </p>
        </div>

        {/* Member Since */}
        {memberSince && (
          <div className="space-y-2">
            <Label className="text-base font-semibold">Membro desde</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <div className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 pl-10 text-sm text-slate-500 dark:text-slate-400 items-center">
                {formatDate(memberSince)}
              </div>
            </div>
          </div>
        )}
      </div>

      {user.is_admin && (
        <div className="pt-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-none px-3 py-1">
            <Shield className="w-3 h-3 mr-1.5" />
            Conta de Administrador
          </Badge>
        </div>
      )}

    </div>
  );
};
