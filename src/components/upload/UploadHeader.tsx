import { Upload, Building2, ChevronDown } from 'lucide-react';
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
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-8 md:p-10 dark:border-slate-800 dark:bg-slate-950">
            {/* Subtle accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
            
            <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="flex items-start gap-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800/80">
                        <Upload className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div className="space-y-1.5">
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-3xl">
                            Central de Upload
                        </h1>
                        <p className="max-w-[440px] text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Importe planilhas para atualizar a base de dados do sistema.
                        </p>
                    </div>
                </div>

                {/* Seletor de Organização (Visível APENAS para Admins Globais/Master) */}
                {isAuthorized && user?.id && organizations.length > 0 && (
                    <div className="flex flex-col gap-2 min-w-[280px]">
                        <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-0.5">
                            <Building2 className="h-3 w-3" />
                            Organização
                        </label>
                        <Select value={selectedOrgId} onValueChange={onOrgChange} disabled={isLoadingOrgs}>
                            <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-slate-50/80 text-sm text-slate-700 shadow-none hover:bg-slate-100 transition-colors focus:ring-1 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800">
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
