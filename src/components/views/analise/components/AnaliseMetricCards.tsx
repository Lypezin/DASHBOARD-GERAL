import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, CheckCircle2, XCircle, Flag } from 'lucide-react';
import { Totals } from '@/types';
import { formatarHorasParaHMS } from '@/utils/formatters';

interface AnaliseMetricCardsProps {
    totals: Totals;
    taxaAceitacao: number;
    taxaCompletude: number;
    taxaRejeicao: number;
    totalHorasEntregues: number;
}

export const AnaliseMetricCards: React.FC<AnaliseMetricCardsProps> = ({
    totals,
    taxaAceitacao,
    taxaCompletude,
    taxaRejeicao,
    totalHorasEntregues
}) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Horas Entregues */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Horas Entregues</CardTitle>
                    <div className="h-4 w-4 text-orange-500 font-bold">H</div>
                </CardHeader>
                <CardContent>
                    <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                        {formatarHorasParaHMS(totalHorasEntregues)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Total de horas realizadas
                    </p>
                </CardContent>
            </Card>

            {/* Ofertadas */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Ofertadas</CardTitle>
                    <Megaphone className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                        {totals.ofertadas.toLocaleString('pt-BR')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Total de corridas ofertadas
                    </p>
                </CardContent>
            </Card>

            {/* Aceitas */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Aceitas</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                        {totals.aceitas.toLocaleString('pt-BR')}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${taxaAceitacao}%` }}></div>
                        </div>
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{taxaAceitacao.toFixed(1)}%</span>
                    </div>
                </CardContent>
            </Card>

            {/* Rejeitadas */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Rejeitadas</CardTitle>
                    <XCircle className="h-4 w-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                        {totals.rejeitadas.toLocaleString('pt-BR')}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${taxaRejeicao}%` }}></div>
                        </div>
                        <span className="text-xs font-medium text-rose-600 dark:text-rose-400">{taxaRejeicao.toFixed(1)}%</span>
                    </div>
                </CardContent>
            </Card>

            {/* Completadas */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Completadas</CardTitle>
                    <Flag className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                        {totals.completadas.toLocaleString('pt-BR')}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${taxaCompletude}%` }}></div>
                        </div>
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{taxaCompletude.toFixed(1)}%</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
