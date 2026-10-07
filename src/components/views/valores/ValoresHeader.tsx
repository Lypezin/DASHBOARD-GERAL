import React from 'react';
import { Download } from 'lucide-react';

interface ValoresHeaderProps {
    isExporting: boolean;
    exportDisabled?: boolean;
    onExport: () => void;
}

export const ValoresHeader = React.memo(function ValoresHeader({
    isExporting,
    exportDisabled = false,
    onExport,
}: ValoresHeaderProps) {
    const exportBlocked = isExporting || exportDisabled;

    return (
        <header
            data-values-role="page-heading"
            className="flex flex-col gap-4 rounded-xl border border-[#164d70] bg-[#174d70] px-5 py-5 shadow-[0_16px_40px_-28px_rgba(12,54,81,0.72)] sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6"
        >
            <div className="min-w-0">
                <h1 className="text-[23px] font-semibold leading-tight tracking-[-0.025em] text-white sm:text-[28px]">
                    Valores por entregador
                </h1>
                <p className="mt-1.5 text-[13px] leading-5 text-sky-100/85">
                    Acompanhe total, corridas e taxa média no período selecionado.
                </p>
            </div>

            <button
                type="button"
                onClick={onExport}
                disabled={exportBlocked}
                title={exportDisabled ? 'Aguarde a atualização e o processamento da busca para exportar os dados corretos.' : undefined}
                className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-md border border-white/30 bg-white px-3.5 text-sm font-semibold text-[#164a6b] shadow-sm transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#174d70] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:border-white/20 dark:bg-slate-100 dark:text-[#164a6b] dark:hover:bg-white"
            >
                <Download className="h-4 w-4" aria-hidden="true" />
                {isExporting ? 'Exportando...' : exportDisabled ? 'Aguarde os dados' : 'Exportar Excel'}
            </button>
        </header>
    );
});

ValoresHeader.displayName = 'ValoresHeader';
