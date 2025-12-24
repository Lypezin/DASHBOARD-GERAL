
import React from 'react';
import { Button } from '@/components/ui/button';
import { Activity, Download } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

interface UtrHeaderProps {
    isExporting: boolean;
    onExport: () => void;
    variants: Variants;
}

export const UtrHeader = React.memo(function UtrHeader({
    isExporting,
    onExport,
    variants
}: UtrHeaderProps) {
    return (
        <motion.div
            className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4"
            variants={variants}
        >
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                    <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Análise de UTR
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Métricas de eficiência operacional por segmento
                    </p>
                </div>
            </div>
            <Button
                variant="outline"
                onClick={onExport}
                disabled={isExporting}
                className="gap-2 bg-white hover:bg-slate-50 shadow-sm border-slate-200"
            >
                <Download className="h-4 w-4 text-emerald-600" />
                {isExporting ? 'Exportando...' : 'Exportar Excel'}
            </Button>
        </motion.div>
    );
});
