import React, { useMemo } from 'react';
import { useMarketingComparacao } from './useMarketingComparacao';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DashboardFilters } from '@/types';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-lg">
                <p className="font-bold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-slate-500 dark:text-slate-400">{entry.name}:</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                            {entry.value.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

interface MarketingComparacaoViewProps {
    filters: DashboardFilters;
}

const MarketingComparacaoView = React.memo(function MarketingComparacaoView({ filters }: MarketingComparacaoViewProps) {
    const { user } = useAuth();

    // Determine the date range to use
    // If 'intervalo' mode, use dataInicial/Final directly.
    // If 'ano_semana' mode, we usually rely on the backend to filter by weeks, 
    // BUT our RPC expects dates. 
    // Ideally, the global filter state updates dates even in week mode, or we calculate them.
    // For now, let's assume dataInicial/Final are populated or default to something sensible.
    const dataInicial = filters.dataInicial || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const dataFinal = filters.dataFinal || new Date().toISOString().split('T')[0];
    const praca = filters.praca;

    const { data, loading, error } = useMarketingComparacao(
        dataInicial,
        dataFinal,
        user?.organization_id || undefined,
        praca
    );

    // Filter out current week to match other tabs if needed, 
    // or keep it raw. User didn't specify, but usually we filter incomplete weeks.
    // For now, let's show all data returned by the RPC.

    return (
        <div className="space-y-6 pb-20">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro ao carregar dados</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {/* Gráfico de Horas */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Horas: Operacional vs Marketing</CardTitle>
                            <CardDescription>Comparativo semanal de horas logadas</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[500px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="semana_iso" tick={{ fontSize: 12 }} />
                                        <YAxis tickFormatter={(value) => `${value}h`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar name="Operacional" dataKey="horas_ops" fill="#64748b" radius={[4, 4, 0, 0]} />
                                        <Bar name="Marketing" dataKey="horas_mkt" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
});

export default MarketingComparacaoView;
