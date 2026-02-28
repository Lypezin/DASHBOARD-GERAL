import React, { useState } from 'react';
import { usePerfilUpdate } from '@/hooks/perfil/usePerfilUpdate';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
        if (!editedName.trim()) return toast.error("O nome não pode estar vazio.");
        if (editedName.trim() === currentName) return setIsEditingName(false);
        await updateFullName(editedName, userId, () => {
            toast.success("Nome atualizado com sucesso!");
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
            <Label htmlFor="fullName" className="text-base font-semibold">Nome Completo</Label>
            <div className="relative">
                {isEditingName ? (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className="relative flex-1">
                            <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                            <Input id="fullName" value={editedName} onChange={(e) => setEditedName(e.target.value)} disabled={savingName} className="pl-10" placeholder="Seu nome completo" />
                        </div>
                        <Button onClick={handleSaveName} disabled={savingName} size="icon" className="bg-green-600 hover:bg-green-700 text-white">
                            {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button onClick={handleCancel} disabled={savingName} size="icon" variant="outline" className="hover:bg-slate-100 dark:hover:bg-slate-800">
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
                                {currentName}
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
    );
};
