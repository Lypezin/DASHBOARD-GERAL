import React from 'react';
import { useOrganizations } from '@/hooks/auth/useOrganizations';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PracaSelection } from "./PracaSelection";

interface AdminUserAccessFormProps {
    pracasDisponiveis: string[];
    organizations: Organization[];
    selectedPracas: string[];
    selectedRole: 'admin' | 'marketing' | 'user' | 'master';
    selectedOrganizationId: string | null;
    onPracasChange: (pracas: string[]) => void;
    onRoleChange: (role: 'admin' | 'marketing' | 'user' | 'master') => void;
    onOrganizationChange: (orgId: string | null) => void;
    hideOrganization?: boolean;
}

export const AdminUserAccessForm: React.FC<AdminUserAccessFormProps> = ({
    pracasDisponiveis,
    organizations,
    selectedPracas,
    selectedRole,
    selectedOrganizationId,
    onPracasChange,
    onRoleChange,
    onOrganizationChange,
    hideOrganization = false,
}) => {
    const togglePracaSelection = (praca: string) => {
        if (selectedPracas.includes(praca)) {
            onPracasChange(selectedPracas.filter((p) => p !== praca));
        } else {
            onPracasChange([...selectedPracas, praca]);
        }
    };

    return (
        <div className="grid gap-4 py-4">
            {!hideOrganization && (
                <div className="grid gap-2">
                    <Label htmlFor="organization">Organização *</Label>
                    <Select
                        value={selectedOrganizationId || ''}
                        onValueChange={(value) => onOrganizationChange(value || null)}
                    >
                        <SelectTrigger id="organization">
                            <SelectValue placeholder="Selecione uma organização" />
                        </SelectTrigger>
                        <SelectContent>
                            {organizations
                                .filter(org => org.is_active)
                                .map((org) => (
                                    <SelectItem key={org.id} value={org.id}>
                                        {org.name} ({org.user_count || 0}/{org.max_users} usuários)
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">
                        Organização à qual o usuário pertence
                    </p>
                </div>
            )}

            <div className="grid gap-2">
                <Label htmlFor="role">Cargo</Label>
                <Select
                    value={selectedRole}
                    onValueChange={(value) => onRoleChange(value as 'admin' | 'marketing' | 'user')}
                >
                    <SelectTrigger id="role">
                        <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                    {selectedRole === 'marketing' && 'Marketing tem acesso a todas as cidades, mas sem privilégios de admin'}
                    {selectedRole === 'admin' && 'Administrador tem acesso total ao sistema'}
                    {selectedRole === 'user' && 'Usuário comum com acesso apenas às praças selecionadas'}
                </p>
            </div>

            <PracaSelection
                pracasDisponiveis={pracasDisponiveis}
                selectedPracas={selectedPracas}
                onPracaToggle={togglePracaSelection}
            />
        </div>
    );
};
