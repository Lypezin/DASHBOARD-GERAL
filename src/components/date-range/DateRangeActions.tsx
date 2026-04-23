import React from 'react';
import { Button } from '@/components/ui/button';

interface DateRangeActionsProps {
    onApply: () => void;
    onClear: () => void;
    canApply: boolean;
    hasFilter: boolean;
}

export const DateRangeActions: React.FC<DateRangeActionsProps> = ({
    onApply,
    onClear,
    canApply,
    hasFilter,
}) => {
    return (
        <div className="flex w-full flex-shrink-0 gap-2 sm:w-auto">
            <Button
                onClick={onApply}
                disabled={!canApply}
                className="h-[42px] flex-1 bg-blue-600 text-white hover:bg-blue-700 sm:min-w-[100px] sm:flex-none"
                title={canApply ? 'Aplicar filtro de datas' : 'Nenhuma alteração para aplicar'}
            >
                ✓ Aplicar
            </Button>
            {hasFilter && (
                <Button
                    variant="outline"
                    onClick={onClear}
                    className="h-[42px] flex-1 sm:min-w-[100px] sm:flex-none"
                    title="Limpar filtro de datas"
                >
                    ✕ Limpar
                </Button>
            )}
        </div>
    );
};
