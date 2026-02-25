import React from 'react';
import { TabNavigation } from '@/components/TabNavigation';
import { DashboardFiltersContainer } from './DashboardFiltersContainer';
import { LoginStreakBadge } from '@/components/shared/LoginStreakBadge';
import { DashboardFilters, FilterOption, CurrentUser, TabType } from '@/types';

interface DashboardHeaderProps {
    filters: DashboardFilters;
    setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>;
    anosDisponiveis: number[];
    semanasDisponiveis: string[];
    pracas: FilterOption[];
    subPracas: FilterOption[];
    origens: FilterOption[];
    turnos: FilterOption[];
    currentUser: CurrentUser | null;
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export const DashboardHeader = React.memo(function DashboardHeader({
    filters,
    setFilters,
    anosDisponiveis,
    semanasDisponiveis,
    pracas,
    subPracas,
    origens,
    turnos,
    currentUser,
    activeTab,
    onTabChange,
}: DashboardHeaderProps) {
    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <DashboardFiltersContainer
                        filters={filters}
                        setFilters={setFilters}
                        anosDisponiveis={anosDisponiveis}
                        semanasDisponiveis={semanasDisponiveis}
                        pracas={pracas}
                        subPracas={subPracas}
                        origens={origens}
                        turnos={turnos}
                        currentUser={currentUser}
                        activeTab={activeTab}
                    />
                </div>
                <LoginStreakBadge />
            </div>

            <TabNavigation
                activeTab={activeTab}
                onTabChange={onTabChange}
                variant={activeTab === 'comparacao' || activeTab === 'marketing' ? 'compact' : 'default'}
            />
        </div>
    );
});
