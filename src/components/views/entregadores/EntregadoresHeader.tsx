import React from 'react';
import { Download, UsersRound } from 'lucide-react';
import { SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';

interface EntregadoresHeaderProps {
    onExport: () => void;
    isExporting: boolean;
    disableExport?: boolean;
    exportDisabledReason?: string;
    title?: string;
    description?: string;
    periodoResolvido?: {
        ano?: number | null;
        semana?: number | null;
        semanas?: number[] | null;
        auto_semana?: boolean;
        search?: string | null;
    };
}

export const EntregadoresHeader = React.memo(function EntregadoresHeader({
    onExport,
    isExporting,
    disableExport = false,
    exportDisabledReason,
    title = 'Entregadores Operacional',
    description = 'Performance e aderência da frota',
    periodoResolvido,
}: EntregadoresHeaderProps) {
    const autoSemana = periodoResolvido?.auto_semana && periodoResolvido.semana;
    const exportBlocked = isExporting || disableExport;

    return (
        <SaasPanel>
            <SaasPanelHeader
                eyebrow="Frota"
                title={title}
                description={autoSemana
                    ? `Performance da frota na semana ${periodoResolvido.semana} de ${periodoResolvido.ano}`
                    : description}
                icon={UsersRound}
                tone="emerald"
                actions={(
                    <button
                        onClick={onExport}
                        disabled={exportBlocked}
                        title={disableExport ? exportDisabledReason : undefined}
                        type="button"
                        className="group inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-[border-color,background-color,color,box-shadow,transform] duration-200 motion-safe:hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800/80 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300"
                    >
                        <Download className="h-4 w-4 text-slate-400 transition-colors group-hover:text-emerald-500" />
                        {isExporting ? 'Exportando...' : disableExport ? 'Aguarde a busca' : 'Exportar Excel'}
                    </button>
                )}
            />
        </SaasPanel>
    );
});

EntregadoresHeader.displayName = 'EntregadoresHeader';
