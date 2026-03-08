import React from 'react';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export const EntregadoresMainTableHeaderCard: React.FC = () => (
    <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                        Entregadores
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                        Lista de entregadores e métricas
                    </CardDescription>
                </div>
            </div>
        </div>
    </CardHeader>
);
