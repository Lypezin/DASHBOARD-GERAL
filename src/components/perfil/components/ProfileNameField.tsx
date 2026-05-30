import React, { useState } from 'react';
import { usePerfilUpdate } from '@/hooks/perfil/usePerfilUpdate';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { User, Check, X, Pencil, Loader2 } from 'lucide-react';

interface ProfileNameFieldProps {
  userId: string;
  currentName: string;
  onProfileUpdate: () => void;
}

export const ProfileNameField: React.FC<ProfileNameFieldProps> = ({ userId, currentName, onProfileUpdate }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(currentName);
  const { updateFullName, savingName } = usePerfilUpdate();

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      toast.error('O nome não pode estar vazio.');
      return;
    }

    if (editedName.trim() === currentName) {
      setIsEditingName(false);
      return;
    }

    await updateFullName(editedName, userId, () => {
      toast.success('Nome atualizado com sucesso.');
      setIsEditingName(false);
      onProfileUpdate();
    });
  };

  const handleCancel = () => {
    setEditedName(currentName);
    setIsEditingName(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="fullName" className="text-sm font-bold text-slate-800 dark:text-slate-100">
        Nome completo
      </Label>
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
                className="rounded-xl border-slate-200 bg-white pl-10 dark:border-slate-800 dark:bg-slate-950"
                placeholder="Seu nome completo"
              />
            </div>
            <Button onClick={handleSaveName} disabled={savingName} size="icon" className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
              {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
            <Button onClick={handleCancel} disabled={savingName} size="icon" variant="outline" className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="group flex gap-2">
            <div className="relative flex-1">
              <User className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <div className="flex min-h-10 w-full items-center rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 pl-10 text-sm font-medium text-slate-600 ring-offset-white dark:border-slate-800 dark:bg-slate-900/55 dark:text-slate-300 dark:ring-offset-slate-950">
                {currentName}
              </div>
            </div>
            <Button
              onClick={() => setIsEditingName(true)}
              variant="outline"
              size="icon"
              className="rounded-xl opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              title="Editar nome"
            >
              <Pencil className="h-4 w-4 text-slate-500" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
