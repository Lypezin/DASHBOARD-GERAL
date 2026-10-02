import { Building2, Upload } from 'lucide-react';
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
        <div className="overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6 md:p-7">
            <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div className="flex items-start gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent sm:h-14 sm:w-14">
                        <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1.5">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                            Central de Upload
                        </h1>
                        <p className="max-w-[440px] text-sm leading-relaxed text-muted-foreground">
                            Importe planilhas para atualizar a base de dados do sistema.
                        </p>
                    </div>
                </div>

                {/* Seletor de organização visível apenas para admins globais/master. */}
                {isAuthorized && user?.id && organizations.length > 0 && (
                    <div className="flex w-full min-w-0 flex-col gap-2 md:w-[320px]">
                        <label className="flex items-center gap-1.5 pl-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            Organização
                        </label>
                        <Select value={selectedOrgId} onValueChange={onOrgChange} disabled={isLoadingOrgs}>
                            <SelectTrigger className="h-11 w-full rounded-md border-input bg-background text-sm font-medium text-foreground shadow-none transition-colors hover:bg-muted focus:ring-2 focus:ring-ring/20 focus:outline-none">
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
        </div>
    );
}
