import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UtrHeaderProps {
    isExporting: boolean;
    onExport: () => void;
    totalSections: number; // mantido para compatibilidade de props se necessário, mas não renderizado
    totalSlices: number;   // mantido para compatibilidade de props se necessário, mas não renderizado
    variants: Variants;
}

export const UtrHeader = React.memo(function UtrHeader({
    isExporting,
    onExport,
    variants
}: UtrHeaderProps) {
    return (
        <motion.div
            variants={variants}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Visão Geral da UTR</h1>
                <p className="text-muted-foreground">Análise de utilização de recursos com recortes operacionais.</p>
            </div>
            <Button
                variant="outline"
                onClick={onExport}
                disabled={isExporting}
                className="gap-2 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-900"
            >
                <Download className="h-4 w-4" />
                {isExporting ? 'Exportando...' : 'Exportar Dados Completos'}
            </Button>
        </motion.div>
    );
});
