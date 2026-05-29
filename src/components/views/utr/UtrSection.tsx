import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCompactTime, formatarHorasParaHMS } from '@/utils/formatters';

interface UtrItemBase {
    tempo_horas: number;
    corridas: number;
    utr: number;
    [key: string]: any;
}

interface UtrSectionProps<T extends UtrItemBase> {
    title: string;
    description: string;
    icon: React.ReactNode;
    data: T[];
    getLabel: (item: T) => string;
}

export const UtrSection = React.memo(function UtrSection<T extends UtrItemBase>({
    title,
    description,
    icon,
    data,
    getLabel
}: UtrSectionProps<T>) {
    if (!data || data.length === 0) return null;

    return (
        <Card className="rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.01)] flex flex-col h-full overflow-hidden">
            {/* Cabeçalho da Seção */}
            <div className="flex items-center gap-3 border-b border-border px-5 py-4 bg-muted/20 shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-card border border-border shadow-[0_1px_2px_rgba(0,0,0,0.01)] text-foreground">
                    {icon}
                </div>
                <div>
                    <h3 className="font-bold text-foreground text-sm font-outfit">{title}</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground/80 font-medium">{description}</p>
                </div>
            </div>

            {/* Conteúdo */}
            <CardContent className="p-0 flex-1 overflow-y-auto">
                <div className="divide-y divide-border/60">
                    {data.map((item, index) => {
                        const label = getLabel(item);
                        const fullTime = formatarHorasParaHMS(item.tempo_horas ?? 0);
                        const compactTime = formatCompactTime(fullTime);
                        const formattedCorridas = (item.corridas ?? 0).toLocaleString('pt-BR');

                        return (
                            <div
                                key={`${label}-${index}`}
                                className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors group"
                            >
                                <div className="flex flex-col min-w-0 pr-4 flex-1">
                                    <p className="truncate text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors" title={label || 'N/D'}>
                                        {label || 'N/D'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1" title={fullTime}>
                                            <span className="font-bold text-foreground/75 font-mono">{compactTime}</span>
                                            <span className="opacity-70 text-[9px] uppercase tracking-wider font-semibold">Tempo</span>
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-border/80"></div>
                                        <div className="flex items-center gap-1" title={formattedCorridas}>
                                            <span className="font-bold text-foreground/75 font-mono">{formattedCorridas}</span>
                                            <span className="opacity-70 text-[9px] uppercase tracking-wider font-semibold">Corridas</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="shrink-0 flex flex-col items-end">
                                    <span className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider mb-0.5">UTR</span>
                                    <div className="flex items-center justify-center bg-primary/10 border border-primary/10 px-2.5 py-0.5 rounded-md">
                                        <span className="text-xs sm:text-sm font-extrabold text-primary">
                                            {item.utr.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
});

// Forçar tipagem e displayName adequados para componentes genéricos memoizados
UtrSection.displayName = 'UtrSection';
