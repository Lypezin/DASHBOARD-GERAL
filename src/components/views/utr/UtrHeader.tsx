import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Activity, Download, LayoutGrid, ScanSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UtrHeaderProps {
    isExporting: boolean;
    onExport: () => void;
    totalSections: number;
    totalSlices: number;
    variants: Variants;
}

export const UtrHeader = React.memo(function UtrHeader({
    isExporting,
    onExport,
    totalSections,
    totalSlices,
    variants
}: UtrHeaderProps) {
    return (
        <motion.section
            variants={variants}
            className="overflow-hidden rounded-[28px] border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-slate-100/80 shadow-sm dark:border-slate-800/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900"
        >
            <div className="flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                        <Activity className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                        UTR
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                            Analise de utilizacao operacional
                        </h2>
                        <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-[15px]">
                            Leitura consolidada da UTR com recortes por praca, sub-praca, origem e turno para comparacao rapida.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap">
                        <div className="min-w-0 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/70">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                                <LayoutGrid className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Dimensoes</p>
                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{totalSections} blocos ativos</p>
                            </div>
                        </div>

                        <div className="min-w-0 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/70">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                                <ScanSearch className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Recortes</p>
                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{totalSlices} itens analisados</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-auto lg:min-w-[220px]">
                    <Button
                        variant="outline"
                        onClick={onExport}
                        disabled={isExporting}
                        className="w-full gap-2 rounded-2xl border-slate-300 bg-white/90 px-5 py-6 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900 lg:w-auto"
                    >
                        <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        {isExporting ? 'Exportando...' : 'Exportar Excel'}
                    </Button>
                </div>
            </div>
        </motion.section>
    );
});
