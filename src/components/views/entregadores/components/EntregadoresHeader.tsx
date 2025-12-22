import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download } from 'lucide-react';

interface EntregadoresHeaderProps {
    count: number;
    totalCount: number;
    hasFilteredData: boolean;
    onExport: () => void;
}

export const EntregadoresHeader = React.memo(function EntregadoresHeader({
    count,
    totalCount,
    hasFilteredData,
    onExport
}: EntregadoresHeaderProps) {
    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Entregadores do Marketing
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Entregadores que aparecem tanto no marketing quanto nas corridas ({count} de {totalCount} entregador{totalCount !== 1 ? 'es' : ''})
                        </p>
                    </div>
                    <Button
                        onClick={onExport}
                        disabled={!hasFilteredData}
                        variant="outline"
                        className="shrink-0"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Exportar Excel
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
});

EntregadoresHeader.displayName = 'EntregadoresHeader';
