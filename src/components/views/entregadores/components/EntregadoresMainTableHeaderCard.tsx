import React from 'react';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export const EntregadoresMainTableHeaderCard: React.FC<{ variant?: 'entregadores' | 'dedicado' }> = ({ variant = 'entregadores' }) => {
    const isEntregadores = variant === 'entregadores';

    return (
    <CardHeader className={isEntregadores
        ? 'border-b border-slate-100/90 bg-[linear-gradient(115deg,rgba(16,185,129,0.07),rgba(248,250,252,0.76)_42%,rgba(248,250,252,0.76))] pb-4 dark:border-slate-800 dark:bg-[linear-gradient(115deg,rgba(16,185,129,0.10),rgba(2,6,23,0.40)_42%,rgba(2,6,23,0.40))]'
        : 'border-b border-slate-100/90 bg-slate-50/70 pb-4 dark:border-slate-800 dark:bg-slate-950/40'}>
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                <div className={isEntregadores
                    ? 'rounded-2xl bg-emerald-50 p-2.5 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'rounded-2xl bg-slate-100 p-2.5 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}>
                    <Users className="h-5 w-5" />
                </div>
                <div>
                    <CardTitle className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
                        Entregadores
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                        Lista principal de entregadores com métricas operacionais
                    </CardDescription>
                </div>
            </div>
        </div>
    </CardHeader>
    );
};
