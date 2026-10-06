import React from 'react';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export const EntregadoresMainTableHeaderCard: React.FC<{ variant?: 'entregadores' | 'dedicado'; totalItems?: number }> = ({ variant = 'entregadores', totalItems = 0 }) => {
    const isEntregadores = variant === 'entregadores';

    return (
    <CardHeader className={isEntregadores
        ? 'flex-row items-center justify-between gap-4 space-y-0 border-b border-[#e8ece7] bg-[#fbfcf9] px-4 py-3 sm:px-4 sm:py-3 dark:border-slate-700 dark:bg-slate-900'
        : 'border-b border-slate-100/90 bg-slate-50/70 pb-4 dark:border-slate-800 dark:bg-slate-950/40'}>
        <div className="flex items-center justify-between gap-3">
            <div className={isEntregadores ? 'flex min-w-0 items-center gap-2.5' : 'flex items-center gap-3'}>
                <div className={isEntregadores
                    ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#315c49]/20 bg-[#315c49]/[0.06] text-[#315c49] dark:border-emerald-300/20 dark:bg-emerald-950/40 dark:text-emerald-200'
                    : 'rounded-2xl bg-slate-100 p-2.5 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}>
                    <Users className={isEntregadores ? 'h-4 w-4' : 'h-5 w-5'} />
                </div>
                <div className="min-w-0">
                    <CardTitle className={isEntregadores
                        ? 'text-sm font-semibold tracking-tight text-[#242b26] dark:text-slate-100 sm:text-sm'
                        : 'text-lg font-black tracking-tight text-slate-950 dark:text-white'}>
                        Entregadores
                    </CardTitle>
                    <CardDescription className={isEntregadores ? 'mt-0.5 text-xs text-[#626f66] dark:text-slate-400' : 'text-slate-500 dark:text-slate-400'}>
                        {isEntregadores ? 'Lista principal e métricas operacionais' : 'Lista principal de entregadores com métricas operacionais'}
                    </CardDescription>
                </div>
            </div>
        </div>
        {isEntregadores ? (
            <span className="shrink-0 text-xs font-medium tabular-nums text-[#626f66] dark:text-slate-400">
                {totalItems.toLocaleString('pt-BR')} entregadores
            </span>
        ) : null}
    </CardHeader>
    );
};
