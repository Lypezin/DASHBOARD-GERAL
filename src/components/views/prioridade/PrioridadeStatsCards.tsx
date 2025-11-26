import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Users,
    Megaphone,
    CheckCircle2,
    XCircle,
    Flag,
    BarChart3
} from 'lucide-react';

interface PrioridadeStatsCardsProps {
    totalEntregadores: number;
    totalOfertadas: number;
    totalAceitas: number;
    totalRejeitadas: number;
    totalCompletadas: number;
    aderenciaMedia: number;
}

export const PrioridadeStatsCards = React.memo(function PrioridadeStatsCards({
    totalEntregadores,
    totalOfertadas,
    totalAceitas,
    totalRejeitadas,
    totalCompletadas,
    aderenciaMedia,
}: PrioridadeStatsCardsProps) {
    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            {/* Entregadores */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Entregadores</CardTitle>
                    <Users className="h-3 w-3 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                        {totalEntregadores.toLocaleString('pt-BR')}
                    </div>
                </CardContent>
            </Card>

            {/* Ofertadas */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Ofertadas</CardTitle>
                    <Megaphone className="h-3 w-3 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                        {totalOfertadas.toLocaleString('pt-BR')}
                    </div>
                </CardContent>
            </Card>

            {/* Aceitas */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Aceitas</CardTitle>
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                        {totalAceitas.toLocaleString('pt-BR')}
                    </div>
                </CardContent>
            </Card>

            {/* Rejeitadas */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Rejeitadas</CardTitle>
                    <XCircle className="h-3 w-3 text-rose-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                        {totalRejeitadas.toLocaleString('pt-BR')}
                    </div>
                </CardContent>
            </Card>

            {/* Completadas */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Completadas</CardTitle>
                    <Flag className="h-3 w-3 text-indigo-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                        {totalCompletadas.toLocaleString('pt-BR')}
                    </div>
                </CardContent>
            </Card>

            {/* Aderência Média */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Aderência Média</CardTitle>
                    <BarChart3 className="h-3 w-3 text-violet-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                        {aderenciaMedia.toFixed(1)}%
                    </div>
                </CardContent>
            </Card>
        </div>
    );
});
