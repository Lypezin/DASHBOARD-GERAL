import React from 'react';
import { AlertCircle, RotateCcw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const PrioridadeErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
    <div className="flex h-[60vh] items-center justify-center">
        <div className="max-w-md mx-auto rounded-xl border border-rose-200 bg-white p-6 text-center shadow-sm dark:border-rose-900 dark:bg-slate-900">
            <AlertCircle className="mx-auto h-10 w-10 text-rose-500 mb-4" />
            <p className="text-lg font-bold text-rose-900 dark:text-rose-100">Erro ao carregar dados</p>
            <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">Não foi possível carregar os dados de prioridade.</p>
            <Button onClick={onRetry} variant="outline" className="mt-5 gap-2 border-rose-300 text-rose-800 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-200 dark:hover:bg-rose-950/40">
                <RotateCcw className="h-4 w-4" />
                Tentar novamente
            </Button>
        </div>
    </div>
);

export const PrioridadeEmptyState: React.FC = () => (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/40">
            <Users className="mb-3 h-10 w-10 text-slate-400" aria-hidden="true" />
            <p className="text-lg font-medium text-slate-900 dark:text-white">Nenhum entregador encontrado</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tente ajustar os filtros para ver os dados.</p>
        </div>
    </div>
);
