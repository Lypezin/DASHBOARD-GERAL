import React from 'react';
import { Activity, Download, Layers3 } from 'lucide-react';
import { SaasMetric, SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';

interface UtrHeaderProps {
    isExporting: boolean;
    onExport: () => void;
    totalSections: number;
    totalSlices: number;
}

export const UtrHeader = React.memo(function UtrHeader({
    isExporting,
    onExport,
    totalSections,
    totalSlices
}: UtrHeaderProps) {
    return (
        <SaasPanel>
            <SaasPanelHeader
                eyebrow="UTR"
                title="Utilizacao de Recursos"
                description="Analise detalhada de performance UTR com recortes operacionais."
                icon={Activity}
                tone="amber"
                actions={(
                    <button
                        onClick={onExport}
                        disabled={isExporting}
                        type="button"
                        className="group inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-[border-color,background-color,color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800/80 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-amber-500/40 dark:hover:text-amber-300"
                    >
                        <Download className="h-4 w-4 text-slate-400 transition-colors group-hover:text-amber-500" />
                        {isExporting ? 'Exportando...' : 'Exportar Dados'}
                    </button>
                )}
            />

            <div className="grid gap-3 border-t border-slate-200/70 bg-slate-50/60 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-900/30 sm:grid-cols-2 lg:px-5">
                <SaasMetric icon={Layers3} label="Secoes ativas" value={totalSections.toLocaleString('pt-BR')} tone="amber" />
                <SaasMetric label="Recortes exibidos" value={totalSlices.toLocaleString('pt-BR')} />
            </div>
        </SaasPanel>
    );
});

UtrHeader.displayName = 'UtrHeader';
