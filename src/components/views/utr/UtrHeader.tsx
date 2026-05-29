import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UtrHeaderProps {
    isExporting: boolean;
    onExport: () => void;
    totalSections: number;
    totalSlices: number;
}

export const UtrHeader = React.memo(function UtrHeader({
    isExporting,
    onExport
}: UtrHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Visao Geral da UTR</h1>
                <p className="text-muted-foreground">Analise de utilizacao de recursos com recortes operacionais.</p>
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
        </div>
    );
});
