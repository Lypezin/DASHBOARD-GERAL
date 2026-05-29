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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
            <div className="space-y-0.5">
                <h1 className="text-lg font-black tracking-tight text-foreground sm:text-xl font-outfit">
                    Utilização de Recursos (UTR)
                </h1>
                <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                    Análise detalhada de performance UTR com recortes operacionais.
                </p>
            </div>
            <Button
                variant="outline"
                onClick={onExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 self-start md:self-auto shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
            >
                <Download className="h-4 w-4 text-muted-foreground/60" />
                {isExporting ? 'Exportando...' : 'Exportar Dados'}
            </Button>
        </div>
    );
});

UtrHeader.displayName = 'UtrHeader';
