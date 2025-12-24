import { MarketingFiltersContent } from './components/MarketingFiltersContent';

interface MarketingFiltersProps {
    filters: {
        dataInicial: string;
        dataFinal: string;
        praca: string | null;
    };
    appliedFilters: {
        dataInicial: string;
        dataFinal: string;
        praca: string | null;
    };
    setFilters: React.Dispatch<React.SetStateAction<{
        dataInicial: string;
        dataFinal: string;
        praca: string | null;
    }>>;
    handleApplyFilters: () => void;
    handleClearFilters: () => void;
    handleQuickFilter: (type: 'week' | 'month' | 'quarter' | 'year') => void;
}

export const MarketingFilters = React.memo(function MarketingFilters({
    filters,
    appliedFilters,
    setFilters,
    handleApplyFilters,
    handleClearFilters,
    handleQuickFilter
}: MarketingFiltersProps) {

    const hasActiveFilters = appliedFilters.praca !== null ||
        (appliedFilters.dataInicial !== new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);

    const hasPendingChanges =
        filters.dataInicial !== appliedFilters.dataInicial ||
        filters.dataFinal !== appliedFilters.dataFinal ||
        filters.praca !== appliedFilters.praca;

    return (
        <MarketingFiltersContent
            filters={filters}
            appliedFilters={appliedFilters}
            setFilters={setFilters}
            handleApplyFilters={handleApplyFilters}
            handleClearFilters={handleClearFilters}
            handleQuickFilter={handleQuickFilter}
            hasActiveFilters={hasActiveFilters}
            hasPendingChanges={hasPendingChanges}
        />
    );
});
