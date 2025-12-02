import { Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Organization {
    id: string;
    name: string;
}

interface UploadHeaderProps {
    isAuthorized: boolean;
    user: { id: string } | null;
    organizations: Organization[];
    selectedOrgId: string;
    isLoadingOrgs: boolean;
    onOrgChange: (value: string) => void;
}

export function UploadHeader({
    isAuthorized,
    user,
    organizations,
    selectedOrgId,
    isLoadingOrgs,
    onOrgChange
}: UploadHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Upload de Dados</h1>
                <p className="text-muted-foreground">
                    Importe suas planilhas Excel para o sistema
                </p>
            </div>

            {/* Seletor de Organização (Visível APENAS para Admins Globais/Master) */}
            {isAuthorized && user?.id && organizations.length > 0 && (
                <div className="flex items-center gap-3 bg-card p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-5 w-5" />
                        <span className="text-sm font-medium">Organização Alvo:</span>
                    </div>
                    <Select value={selectedOrgId} onValueChange={onOrgChange} disabled={isLoadingOrgs}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Selecione uma organização" />
                        </SelectTrigger>
                        <SelectContent>
                            {organizations.map((org) => (
                                <SelectItem key={org.id} value={org.id}>
                                    {org.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    );
}
