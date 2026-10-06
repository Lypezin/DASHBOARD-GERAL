import React from 'react';
import { Download, UsersRound } from 'lucide-react';
import { SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';

interface EntregadoresHeaderProps {
    onExport: () => void;
    isExporting: boolean;
    disableExport?: boolean;
    exportDisabledReason?: string;
    title?: string;
    variant?: 'entregadores' | 'dedicado';
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
    variant = 'entregadores',
    description = 'Performance e aderência da frota',
    periodoResolvido,
}: EntregadoresHeaderProps) {
    const autoSemana = periodoResolvido?.auto_semana && periodoResolvido.semana;
    const exportBlocked = isExporting || disableExport;

    const exportButton = (
        <button
            onClick={onExport}
            disabled={exportBlocked}
            title={disableExport ? exportDisabledReason : undefined}
            type="button"
            className={variant === 'entregadores'
                ? 'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#cbd5ce] bg-white px-3.5 text-sm font-semibold text-[#315c49] transition-colors hover:border-[#315c49]/50 hover:bg-[#f4f7f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315c49] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-200 dark:hover:border-emerald-300/50 dark:hover:bg-slate-800'
                : 'group inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-[border-color,background-color,color,box-shadow,transform] duration-200 motion-safe:hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800/80 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300'}
        >
            <Download className={`h-4 w-4 ${variant === 'entregadores' ? '' : 'text-slate-400 transition-[color,transform] group-hover:-translate-y-0.5 group-hover:text-emerald-500'}`} />
            {isExporting ? 'Exportando...' : disableExport ? 'Aguarde a busca' : 'Exportar Excel'}
        </button>
    );

    if (variant === 'entregadores') {
        return (
            <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" data-entregadores-role="page-heading">
                <div className="min-w-0">
                    <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.022em] text-[#242b26] dark:text-slate-100 sm:text-[26px]">
                        {title}
                    </h1>
                    <p className="mt-1.5 text-[13px] leading-5 text-[#4f5c53] dark:text-slate-300">
                        {autoSemana
                            ? `Performance da frota na semana ${periodoResolvido.semana} de ${periodoResolvido.ano}`
                            : description}
                    </p>
                </div>
                {exportButton}
            </header>
        );
    }

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
                actions={exportButton}
            />
        </SaasPanel>
    );
});

EntregadoresHeader.displayName = 'EntregadoresHeader';
