import React from 'react';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPrevious: () => void;
    onNext: () => void;
}

export const AdminUsersPaginationControls: React.FC<PaginationControlsProps> = ({
    currentPage,
    totalPages,
    onPrevious,
    onNext
}) => {
    return (
        <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages || 1}
            </div>
            <div className="flex items-center space-x-2">
                <button
                    onClick={onPrevious}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm font-medium rounded-md border bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Anterior
                </button>
                <button
                    onClick={onNext}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3 py-1 text-sm font-medium rounded-md border bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Próxima
                </button>
            </div>
        </div>
    );
};
