
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
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Valores por Entregador
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Acompanhe o repasse de cada entregador
                </p>
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
