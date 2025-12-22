import React from 'react';
import { AlertCircle, Users } from 'lucide-react';

export const PrioridadeErrorState: React.FC = () => (
    <div className="flex h-[60vh] items-center justify-center">
        <div className="max-w-md mx-auto rounded-xl border border-rose-200 bg-white p-6 text-center shadow-sm dark:border-rose-900 dark:bg-slate-900">
            <AlertCircle className="mx-auto h-10 w-10 text-rose-500 mb-4" />
            <p className="text-lg font-bold text-rose-900 dark:text-rose-100">Erro ao carregar dados</p>
            <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">Não foi possível carregar os dados de prioridade.</p>
        </div>
    </div>
);

export const PrioridadeEmptyState: React.FC = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl border-dashed border-slate-300 dark:border-slate-700">
        <Users className="h-10 w-10 text-slate-400 mb-3" />
        <p className="text-lg font-medium text-slate-900 dark:text-white">Nenhum entregador encontrado</p>
        <p className="text-sm text-slate-500">Tente ajustar os filtros para ver os dados.</p>
    </div>
);
