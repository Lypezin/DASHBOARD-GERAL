import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

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
        <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/88 p-5 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/82">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <div className="mb-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                        Entregadores
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                        {title}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        {autoSemana
                            ? `Performance da frota na semana ${periodoResolvido.semana} de ${periodoResolvido.ano}`
                            : description}
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={onExport}
                    disabled={exportBlocked}
                    title={disableExport ? exportDisabledReason : undefined}
                    className="w-full shrink-0 gap-2 rounded-2xl border-slate-200 bg-white px-4 py-2.5 font-semibold shadow-sm transition-colors hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900"
                >
                    <Download className="h-4 w-4" />
                    {isExporting ? 'Exportando...' : disableExport ? 'Aguarde a busca' : 'Exportar Excel'}
                </Button>
            </div>
        </div>
    );
});

EntregadoresHeader.displayName = 'EntregadoresHeader';
