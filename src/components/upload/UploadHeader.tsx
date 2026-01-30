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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white shadow-xl dark:from-slate-950 dark:to-slate-900">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                        Central de Upload
                    </h1>
                    <p className="max-w-[600px] text-slate-300">
                        Gerencie e atualize os dados do sistema através de planilhas Excel.
                        Selecione a categoria abaixo para começar.
                    </p>
                </div>

                {/* Seletor de Organização (Visível APENAS para Admins Globais/Master) */}
                {isAuthorized && user?.id && organizations.length > 0 && (
                    <div className="flex flex-col gap-2 rounded-xl bg-white/10 p-4 backdrop-blur-md border border-white/10">
                        <div className="flex items-center gap-2 text-slate-300">
                            <Building2 className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Organização Alvo</span>
                        </div>
                        <Select value={selectedOrgId} onValueChange={onOrgChange} disabled={isLoadingOrgs}>
                            <SelectTrigger className="w-full md:w-[280px] border-white/20 bg-black/20 text-white placeholder:text-white/50 focus:ring-offset-0 focus:ring-white/20">
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
