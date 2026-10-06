import React from 'react';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListFilter, Users } from 'lucide-react';

export const EntregadoresMainTableHeaderCard: React.FC<{ variant?: 'entregadores' | 'dedicado'; totalItems?: number }> = ({ variant = 'entregadores', totalItems = 0 }) => {
    const isEntregadores = variant === 'entregadores';

    return (
    <CardHeader className={isEntregadores
        ? 'flex-row items-center justify-between gap-4 space-y-0 border-b border-[#e2ebf0] bg-white px-5 py-4 sm:px-6 dark:border-slate-700 dark:bg-slate-900'
        : 'border-b border-slate-100/90 bg-slate-50/70 pb-4 dark:border-slate-800 dark:bg-slate-950/40'}>
        <div className="flex items-center justify-between gap-3">
            <div className={isEntregadores ? 'flex min-w-0 items-center gap-3' : 'flex items-center gap-3'}>
                <div className={isEntregadores
                    ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#c9deea] bg-[#edf6fa] text-[#246d94] dark:border-sky-300/20 dark:bg-sky-950/40 dark:text-sky-200'
                    : 'rounded-2xl bg-slate-100 p-2.5 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}>
                    {isEntregadores ? <ListFilter className="h-4 w-4" /> : <Users className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                    <CardTitle className={isEntregadores
                        ? 'text-[15px] font-semibold tracking-tight text-[#183f58] dark:text-slate-100 sm:text-[15px]'
                        : 'text-lg font-black tracking-tight text-slate-950 dark:text-white'}>
                        {isEntregadores ? 'Desempenho individual' : 'Entregadores'}
                    </CardTitle>
                    <CardDescription className={isEntregadores ? 'mt-0.5 text-xs text-slate-500 dark:text-slate-400' : 'text-slate-500 dark:text-slate-400'}>
                        {isEntregadores ? 'Clique em um nome para inspecionar o perfil · Ordene pelas colunas' : 'Lista principal de entregadores com métricas operacionais'}
                    </CardDescription>
                </div>
            </div>
        </div>
        {isEntregadores ? (
            <span className="shrink-0 rounded-md bg-[#edf6fa] px-2.5 py-1.5 text-xs font-semibold tabular-nums text-[#276887] dark:bg-slate-800 dark:text-sky-200">
                {totalItems.toLocaleString('pt-BR')} entregadores
            </span>
        ) : null}
    </CardHeader>
    );
};
