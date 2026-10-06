import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EntregadoresPaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    isUpdating?: boolean;
    variant?: 'entregadores' | 'dedicado';
    onPageChange: (page: number) => void;
}

export const EntregadoresPagination: React.FC<EntregadoresPaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    isUpdating = false,
    variant = 'entregadores',
    onPageChange,
}) => {
    if (totalPages <= 1) return null;

    const start = ((currentPage - 1) * itemsPerPage) + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    const isEntregadores = variant === 'entregadores';

    return (
            <CardFooter className={cn('flex flex-col gap-3 border-t px-4 sm:flex-row sm:items-center sm:justify-between', isEntregadores ? 'border-[#e2ebf0] bg-[#fbfdfe] py-3 pt-3 sm:px-5 sm:py-3 sm:pt-3 dark:border-slate-700 dark:bg-slate-900' : 'border-slate-100 py-4 dark:border-slate-800')}>
            <div className={isEntregadores ? 'text-xs text-[#626f66] dark:text-slate-400' : 'text-sm text-slate-500 dark:text-slate-400'}>
                Mostrando <span className={isEntregadores ? 'font-semibold text-[#242b26] dark:text-slate-200' : 'font-semibold text-slate-800 dark:text-slate-200'}>{start}</span> a{' '}
                <span className={isEntregadores ? 'font-semibold text-[#242b26] dark:text-slate-200' : 'font-semibold text-slate-800 dark:text-slate-200'}>{end}</span> de{' '}
                <span className={isEntregadores ? 'font-semibold text-[#242b26] dark:text-slate-200' : 'font-semibold text-slate-800 dark:text-slate-200'}>{totalItems.toLocaleString('pt-BR')}</span> resultados
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={isUpdating || currentPage === 1}
                    className={isEntregadores ? 'h-8 rounded-md border-[#d3e1e9] bg-white px-2.5 text-xs text-slate-600 hover:bg-[#f2f8fb] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700' : 'rounded-xl'}
                >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Anterior
                </Button>
                <div className={isEntregadores ? 'px-2 text-xs font-medium tabular-nums text-[#626f66] dark:text-slate-400' : 'rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200'}>
                    Página {currentPage} de {totalPages}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={isUpdating || currentPage === totalPages}
                    className={isEntregadores ? 'h-8 rounded-md border-[#d3e1e9] bg-white px-2.5 text-xs text-slate-600 hover:bg-[#f2f8fb] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700' : 'rounded-xl'}
                >
                    Próxima
                    <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
            </div>
        </CardFooter>
    );
};
