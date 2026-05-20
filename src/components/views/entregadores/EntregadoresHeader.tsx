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
    description = 'Performance e aderencia da frota',
    periodoResolvido,
}: EntregadoresHeaderProps) {
    const autoSemana = periodoResolvido?.auto_semana && periodoResolvido.semana;
    const exportBlocked = isExporting || disableExport;

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
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
                className="gap-2"
            >
                <Download className="h-4 w-4" />
                {isExporting ? 'Exportando...' : disableExport ? 'Aguarde a busca' : 'Exportar Excel'}
            </Button>
        </div>
    );
});
