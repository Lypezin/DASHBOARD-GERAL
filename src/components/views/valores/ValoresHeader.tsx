import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ValoresHeaderProps {
    isExporting: boolean;
    onExport: () => void;
}

export const ValoresHeader = React.memo(function ValoresHeader({
    isExporting,
    onExport,
}: ValoresHeaderProps) {
    return (
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-[0_16px_42px_-36px_rgba(15,23,42,0.52)] dark:border-slate-800/70 dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
                <div className="h-9 w-1.5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600 shadow-sm" />
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                        Valores por entregador
                    </h2>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Acompanhe o repasse de cada entregador
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Button
                    variant="outline"
                    onClick={onExport}
                    disabled={isExporting}
                    className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/85 px-4 shadow-[0_12px_24px_-22px_rgba(15,23,42,0.4)] transition-[border-color,background-color,box-shadow,transform] duration-200 motion-safe:hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white dark:border-slate-800/80 dark:bg-slate-900/85 dark:hover:border-blue-500/40 dark:hover:bg-slate-900"
                >
                    <Download className="h-4 w-4" />
                    {isExporting ? 'Exportando...' : 'Exportar Excel'}
                </Button>
            </div>
        </div>
    );
});
