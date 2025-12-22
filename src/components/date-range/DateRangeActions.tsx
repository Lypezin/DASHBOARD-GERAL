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
        <div className="flex gap-2 flex-shrink-0">
            <Button
                onClick={onApply}
                disabled={!canApply}
                className="h-[42px] min-w-[100px] bg-blue-600 hover:bg-blue-700 text-white"
                title={canApply ? 'Aplicar filtro de datas' : 'Nenhuma alteração para aplicar'}
            >
                ✓ Aplicar
            </Button>
            {hasFilter && (
                <Button
                    variant="outline"
                    onClick={onClear}
                    className="h-[42px] min-w-[100px]"
                    title="Limpar filtro de datas"
                >
                    ✕ Limpar
                </Button>
            )}
        </div>
    );
};
