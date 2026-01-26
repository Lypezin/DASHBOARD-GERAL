
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

interface ValoresHeaderProps {
    isExporting: boolean;
    onExport: () => void;
    variants: Variants;
}

export const ValoresHeader = React.memo(function ValoresHeader({
    isExporting,
    onExport,
    variants
}: ValoresHeaderProps) {
    return (
        <motion.div
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            variants={variants}
        >
            <div className="flex items-center gap-3">
                <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600 shadow-sm" />
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                        Valores por Entregador
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        Acompanhe o repasse de cada entregador
                    </p>
                </div>
            </div>
            <Button
                variant="outline"
                onClick={onExport}
                disabled={isExporting}
                className="gap-2"
            >
                <Download className="h-4 w-4" />
                {isExporting ? 'Exportando...' : 'Exportar Excel'}
            </Button>
        </motion.div>
    );
});
