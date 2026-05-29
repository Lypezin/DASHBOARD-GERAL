import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CardFooter } from '@/components/ui/card';

interface EntregadoresPaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export const EntregadoresPagination: React.FC<EntregadoresPaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
}) => {
    if (totalPages <= 1) return null;

    const start = ((currentPage - 1) * itemsPerPage) + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <CardFooter className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500 dark:text-slate-400">
                Mostrando <span className="font-semibold text-slate-800 dark:text-slate-200">{start}</span> a{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{end}</span> de{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{totalItems}</span> resultados
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="rounded-xl"
                >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Anterior
                </Button>
                <div className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    Pagina {currentPage} de {totalPages}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-xl"
                >
                    Proxima
                    <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
            </div>
        </CardFooter>
    );
};
