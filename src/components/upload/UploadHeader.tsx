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
        <div className="relative overflow-hidden rounded-[1.65rem] border border-slate-200/80 bg-white/80 p-6 shadow-[0_12px_36px_-24px_rgba(15,23,42,0.18)] backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/40 sm:p-7 md:p-8">
            {/* Subtle accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
            
            <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div className="flex items-start gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 ring-1 ring-blue-100 dark:bg-blue-950/35 dark:ring-blue-900/50 sm:h-14 sm:w-14">
                        <Upload className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div className="space-y-1.5">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
                            Central de Upload
                        </h1>
                        <p className="max-w-[440px] text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Importe planilhas para atualizar a base de dados do sistema.
                        </p>
                    </div>
                </div>

                {/* Seletor de organização visível apenas para admins globais/master. */}
                {isAuthorized && user?.id && organizations.length > 0 && (
                    <div className="flex w-full min-w-0 flex-col gap-2 md:w-[320px]">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-0.5">
                            <Building2 className="h-3 w-3" />
                            Organização
                        </label>
                        <Select value={selectedOrgId} onValueChange={onOrgChange} disabled={isLoadingOrgs}>
                            <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-slate-50/60 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-100/80 focus:ring-4 focus:ring-blue-500/10 focus:outline-none dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900/80">
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
