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
                ? 'inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/30 bg-white px-3.5 text-sm font-semibold text-[#164a6b] shadow-sm transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#174d70] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
                : 'group inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-[border-color,background-color,color,box-shadow,transform] duration-200 motion-safe:hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800/80 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300'}
        >
            <Download className={`h-4 w-4 ${variant === 'entregadores' ? '' : 'text-slate-400 transition-[color,transform] group-hover:-translate-y-0.5 group-hover:text-emerald-500'}`} />
            {isExporting ? 'Exportando...' : disableExport ? 'Aguarde a busca' : 'Exportar Excel'}
        </button>
    );

    if (variant === 'entregadores') {
        return (
            <header className="relative flex flex-col gap-4 overflow-hidden rounded-xl border border-[#164d70] bg-[#174d70] px-5 py-5 shadow-[0_16px_40px_-28px_rgba(12,54,81,0.72)] sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6" data-entregadores-role="page-heading">
                <div className="pointer-events-none absolute -right-10 -top-24 h-56 w-56 rounded-full border border-white/[0.08]" />
                <div className="pointer-events-none absolute -right-2 -top-16 h-40 w-40 rounded-full border border-white/[0.08]" />
                <div className="relative min-w-0">
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.17em] text-sky-200">
                        <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
                        Operação · Frota
                    </div>
                    <h1 className="text-[23px] font-semibold leading-tight tracking-[-0.025em] text-white sm:text-[28px]">
                        {title}
                    </h1>
                    <p className="mt-1.5 text-[13px] leading-5 text-sky-100/85">
                        {autoSemana ? 'Acompanhe atividade e aderência da frota no período selecionado' : description}
                    </p>
                </div>
                <div className="relative flex shrink-0 items-center gap-3">
                    {autoSemana && (
                        <span className="hidden rounded-md border border-white/20 bg-white/[0.08] px-3 py-2 text-xs font-medium text-sky-100 sm:inline-flex">
                            Semana {periodoResolvido.semana} · {periodoResolvido.ano}
                        </span>
                    )}
                    {exportButton}
                </div>
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
