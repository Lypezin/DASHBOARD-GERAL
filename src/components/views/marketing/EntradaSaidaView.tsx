import React from 'react';
import { useEntradaSaidaData } from './useEntradaSaidaData';
import { Activity, FileSpreadsheet } from 'lucide-react';
import { EntradaSaidaStatsCards } from './components/EntradaSaidaStatsCards';
import { EntradaSaidaWeeklyGrid } from './components/EntradaSaidaWeeklyGrid';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';
import { motion, Variants } from 'framer-motion';

interface EntradaSaidaViewProps {
    dataInicial: string | null;
    dataFinal: string | null;
    organizationId?: string;
    praca?: string | null;
}

export const EntradaSaidaView: React.FC<EntradaSaidaViewProps> = ({ dataInicial, dataFinal, organizationId, praca }) => {
    const { data, loading, error } = useEntradaSaidaData({ dataInicial, dataFinal, organizationId, praca });

    const handleExport = () => {
        if (!data || data.length === 0) return;

        const formattedData = data.map(item => ({
            'Semana': item.semana,
            'Entradas Total': item.entradas_total,
            'Entradas Mkt': item.entradas_marketing,
            'Entradas Ops': item.entradas_operacional,
            'Saídas Total': item.saidas_total,
            'Saídas Mkt': item.saidas_marketing,
            'Saídas Ops': item.saidas_operacional,
            'Saldo': item.saldo,
            'Base Ativa': item.base_ativa,
            'Variação Base': item.variacao_base,
            'Retomada': item.retomada_total,
            'Desistências Novos': item.saidas_novos,
            'Saldo Mkt': Number(item.entradas_marketing) - Number(item.saidas_marketing),
            'Saldo Ops': Number(item.entradas_operacional) - Number(item.saidas_operacional)
        }));

        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Fluxo Semanal");

        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `fluxo_entregadores_marketing_${dateStr}.xlsx`);
    };

    if (loading) {
        return (
            <div className="flex h-80 items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-14 w-14 rounded-full border-4 border-indigo-100 dark:border-indigo-900"></div>
                        <div className="absolute top-0 left-0 h-14 w-14 animate-spin rounded-full border-4 border-transparent border-t-indigo-600"></div>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Carregando dados...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-8 text-center shadow-sm dark:from-rose-950/20 dark:to-slate-900 dark:border-rose-900/50">
                <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-rose-100 flex items-center justify-center dark:bg-rose-900/40">
                    <Activity className="h-7 w-7 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-rose-900 dark:text-rose-100">Erro ao carregar dados</h3>
                <p className="mt-2 text-rose-700 dark:text-rose-300 max-w-md mx-auto">{error}</p>
            </div>
        );
    }

    const container: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div
            className="space-y-8 max-w-7xl mx-auto"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <motion.div className="flex justify-end" variants={item}>
                <Button
                    onClick={handleExport}
                    variant="outline"
                    className="gap-2 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
                >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    Exportar Excel
                </Button>
            </motion.div>

            <motion.div variants={item}>
                <EntradaSaidaStatsCards data={data} />
            </motion.div>

            <motion.div variants={item}>
                <EntradaSaidaWeeklyGrid data={data} />
            </motion.div>
        </motion.div>
    );
};
