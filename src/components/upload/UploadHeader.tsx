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
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/40 p-10 backdrop-blur-xl dark:border-white/5 dark:bg-white/5 shadow-sm">
            <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-3">
                    <h1 className="text-4xl font-light tracking-tight text-slate-900 dark:text-white md:text-5xl">
                        Central de <span className="font-semibold">Upload</span>
                    </h1>
                    <p className="max-w-[500px] text-lg text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                        Atualize a base de dados do sistema com simplicidade e precisão.
                    </p>
                </div>

                {/* Seletor de Organização (Visível APENAS para Admins Globais/Master) */}
                {isAuthorized && user?.id && organizations.length > 0 && (
                    <div className="flex flex-col gap-2 min-w-[300px]">
                        <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 pl-1">
                            Organização Alvo
                        </label>
                        <Select value={selectedOrgId} onValueChange={onOrgChange} disabled={isLoadingOrgs}>
                            <SelectTrigger className="h-12 w-full rounded-xl border-slate-200 bg-white/50 text-slate-700 shadow-sm hover:bg-white transition-all focus:ring-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10">
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
