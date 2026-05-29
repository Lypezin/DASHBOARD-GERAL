import React from 'react';
import { Activity, Car, Timer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UtrGeral as UtrGeralType } from '@/types';
import { formatCompactTime, formatarHorasParaHMS } from '@/utils/formatters';

interface UtrGeralProps {
    data: UtrGeralType;
}

export const UtrGeral = React.memo(function UtrGeral({ data }: UtrGeralProps) {
    const fullTime = formatarHorasParaHMS(data.tempo_horas ?? 0);
    const compactTime = formatCompactTime(fullTime);
    const formattedCorridas = (data.corridas ?? 0).toLocaleString('pt-BR');

    return (
        <div className="grid gap-6 sm:grid-cols-3 pt-1">
            {/* UTR Index Card */}
            <Card className="rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
                <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="space-y-0.5">
                            <h3 className="font-bold text-muted-foreground/80 text-xs uppercase tracking-wider">UTR Consolidada</h3>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Média do período</p>
                        </div>
                        <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
                            <Activity className="h-4.5 w-4.5" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black tracking-tight text-foreground font-outfit">
                            {(data.utr ?? 0).toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold">índice</span>
                    </div>
                </CardContent>
            </Card>

            {/* Tempo Card */}
            <Card className="rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
                <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="space-y-0.5">
                            <h3 className="font-bold text-muted-foreground/80 text-xs uppercase tracking-wider">Tempo Total</h3>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Horas operacionais</p>
                        </div>
                        <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                            <Timer className="h-4.5 w-4.5" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-2xl font-black tracking-tight text-foreground font-outfit" title={fullTime}>
                            {compactTime}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono" title={fullTime}>{fullTime}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Corridas Card */}
            <Card className="rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
                <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="space-y-0.5">
                            <h3 className="font-bold text-muted-foreground/80 text-xs uppercase tracking-wider">Total Corridas</h3>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Volume de entregas</p>
                        </div>
                        <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <Car className="h-4.5 w-4.5" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black tracking-tight text-foreground font-outfit">
                            {formattedCorridas}
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold">entregas</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
});

UtrGeral.displayName = 'UtrGeral';
