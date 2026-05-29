import React from 'react';
import { formatWeekLabel } from '@/utils/timeHelpers';
import { Badge } from '@/components/ui/badge';
import { MetricDetailDialog } from './MetricDetailDialog';
import { WeeklyData } from './EntradaSaidaCard';

interface EntradaSaidaFooterProps {
    item: WeeklyData;
}

export const EntradaSaidaFooter: React.FC<EntradaSaidaFooterProps> = ({ item }) => {
    return (
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
            <Badge
                className={`border-0 px-3 py-1 text-sm font-semibold tabular-nums ${
                    item.saldo >= 0
                        ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                }`}
            >
                Saldo: {item.saldo > 0 ? '+' : ''}
                {item.saldo}
            </Badge>

            <div className="flex gap-1">
                {item.entradas > 0 && (
                    <MetricDetailDialog
                        type="entradas"
                        weekLabel={formatWeekLabel(item.semana)}
                        count={item.entradas}
                        marketingNames={item.nomes_entradas_marketing}
                        operacionalNames={item.nomes_entradas_operacional}
                    />
                )}

                {(item.retomada_total || 0) > 0 && (
                    <MetricDetailDialog
                        type="retomada"
                        weekLabel={formatWeekLabel(item.semana)}
                        count={item.retomada_total || 0}
                        marketingNames={item.nomes_retomada_marketing}
                        operacionalNames={item.nomes_retomada_operacional}
                    />
                )}

                {(item.saidas > 0 || item.saidas_novos > 0) && (
                    <MetricDetailDialog
                        type="saidas"
                        weekLabel={formatWeekLabel(item.semana)}
                        count={item.saidas}
                        marketingNames={item.nomes_saidas_marketing}
                        operacionalNames={item.nomes_saidas_operacional}
                        marketingNovosNames={item.nomes_saidas_novos_marketing}
                        operacionalNovosNames={item.nomes_saidas_novos_operacional}
                    />
                )}
            </div>
        </div>
    );
};
