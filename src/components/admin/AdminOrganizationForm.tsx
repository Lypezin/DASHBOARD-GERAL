import React from 'react';
import { useOrganizations } from '@/hooks/auth/useOrganizations';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

interface AdminOrganizationFormProps {
    formData: OrganizationFormData;
    setFormData: React.Dispatch<React.SetStateAction<OrganizationFormData>>;
    handleSlugChange: (value: string) => void;
    disabled: boolean;
    error: string | null;
}

export const AdminOrganizationForm: React.FC<AdminOrganizationFormProps> = ({
    formData,
    setFormData,
    handleSlugChange,
    disabled,
    error,
}) => {
    return (
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Nome da Organização *</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                        setFormData(prev => ({ ...prev, name: e.target.value }));
                        handleSlugChange(e.target.value);
                    }}
                    placeholder="Ex: Empresa XYZ"
                    disabled={disabled}
                    required
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                    placeholder="empresa-xyz"
                    disabled={disabled}
                    required
                />
                <p className="text-[10px] text-muted-foreground">
                    Identificador único (apenas letras minúsculas, números e hífens)
                </p>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="max_users">Limite de Usuários *</Label>
                <Input
                    id="max_users"
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.max_users}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_users: parseInt(e.target.value) || 10 }))}
                    disabled={disabled}
                    required
                />
                <p className="text-[10px] text-muted-foreground">
                    Número máximo de colaboradores permitidos
                </p>
            </div>

            {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}
        </div>
    );
};
