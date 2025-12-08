import React from 'react';
import { Organization } from '@/hooks/useOrganizations';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

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

            <div className="grid gap-2">
                <div className="flex items-center justify-between">
                    <Label>Selecione as praças de acesso</Label>
                    <span className="text-xs text-muted-foreground">
                        {selectedPracas.length} de {pracasDisponiveis.length} selecionadas
                    </span>
                </div>

                <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    {pracasDisponiveis.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <span className="text-2xl mb-2">⚠️</span>
                            <p className="text-sm">Nenhuma praça disponível</p>
                            <p className="text-xs mt-1">O usuário não poderá ser aprovado sem praças</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pracasDisponiveis.map((praca) => (
                                <div key={praca} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`praca-${praca}`}
                                        checked={selectedPracas.includes(praca)}
                                        onCheckedChange={() => togglePracaSelection(praca)}
                                    />
                                    <label
                                        htmlFor={`praca-${praca}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        {praca}
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    );
};
