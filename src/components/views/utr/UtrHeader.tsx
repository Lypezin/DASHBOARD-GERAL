import React from 'react';
import { Activity, Download, Layers3 } from 'lucide-react';

interface UtrHeaderProps {
    isExporting: boolean;
    exportDisabled?: boolean;
    onExport: () => void;
    totalSections: number;
    totalSlices: number;
}

export const UtrHeader = React.memo(function UtrHeader({
    isExporting,
    exportDisabled = false,
    onExport,
    totalSections,
    totalSlices
}: UtrHeaderProps) {
    return (
        <header className="flex flex-col gap-4 rounded-xl border border-[#164d70] bg-[#174d70] px-5 py-5 shadow-[0_16px_40px_-28px_rgba(12,54,81,0.72)] sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
            <div className="min-w-0">
                <h1 className="flex items-center gap-2 text-[23px] font-semibold leading-tight tracking-[-0.025em] text-white sm:text-[28px]">
                    <Activity className="h-5 w-5 shrink-0 text-sky-100 sm:h-6 sm:w-6" aria-hidden="true" />
                    Utilização de recursos
                </h1>
                <p className="mt-1.5 text-[13px] leading-5 text-sky-100/85">
                    Acompanhe o índice UTR por praça, origem e turno.
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-sky-100/90" aria-label="Resumo dos recortes exibidos">
                    <span className="inline-flex items-center gap-1.5">
                        <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
                        {totalSections.toLocaleString('pt-BR')} seções ativas
                    </span>
                    <span>{totalSlices.toLocaleString('pt-BR')} recortes exibidos</span>
                </div>
            </div>

            <button
                onClick={onExport}
                disabled={isExporting || exportDisabled}
                title={exportDisabled ? 'Aguarde a atualização dos dados antes de exportar.' : undefined}
                type="button"
                className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-md border border-white/30 bg-white px-3.5 text-sm font-semibold text-[#164a6b] shadow-sm transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#174d70] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:border-white/20 dark:bg-slate-100 dark:text-[#164a6b] dark:hover:bg-white"
            >
                <Download className="h-4 w-4" aria-hidden="true" />
                {isExporting ? 'Exportando...' : exportDisabled ? 'Aguarde os dados' : 'Exportar Excel'}
            </button>
        </header>
    );
});

UtrHeader.displayName = 'UtrHeader';
