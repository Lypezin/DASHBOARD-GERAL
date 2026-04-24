import { useMemo, useState, useEffect } from 'react';
import { fetchComparisonMetrics } from '@/hooks/comparacao/useComparisonMetrics';
import { AderenciaSemanal, CurrentUser } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { useTargetWeeks } from './useTargetWeeks';
import type { Filters } from '@/types/filters';

export interface ComparisonMetricData {
    label: string;
    current: number;
    previous: number;
    format: 'number' | 'percent' | 'hours';
}

interface UseWeekComparisonOptions {
    aderenciaSemanal?: AderenciaSemanal[];
    filters: Filters;
    currentUser: CurrentUser | null;
}

export function useWeekComparison({ aderenciaSemanal, filters, currentUser }: UseWeekComparisonOptions) {
    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState<ComparisonMetricData[]>([]);
    const [currentWeekLabel, setCurrentWeekLabel] = useState('');
    const [previousWeekLabel, setPreviousWeekLabel] = useState('');
    const currentUserId = currentUser?.id || '';
    const currentUserRole = currentUser?.role;
    const currentUserOrganizationId = currentUser?.organization_id ?? null;
    const isCurrentUserAdmin = currentUser?.is_admin ?? false;
    const assignedPracasKey = (currentUser?.assigned_pracas || []).join('|');

    const weeksToCompare = useTargetWeeks(filters, aderenciaSemanal);
    const weeksComparisonKey = weeksToCompare
        ? `${weeksToCompare.previous}|${weeksToCompare.current}|${weeksToCompare.previousLabel}|${weeksToCompare.currentLabel}`
        : '';
    const currentUserKey = currentUser
        ? `${currentUserId}|${isCurrentUserAdmin ? '1' : '0'}|${assignedPracasKey}|${currentUserRole || ''}|${currentUserOrganizationId || ''}`
        : 'anonymous';
    const stableCurrentUser = useMemo(() => currentUserKey !== 'anonymous'
        ? {
            id: currentUserId,
            is_admin: isCurrentUserAdmin,
            assigned_pracas: assignedPracasKey ? assignedPracasKey.split('|') : [],
            role: currentUserRole,
            organization_id: currentUserOrganizationId
        }
        : null, [assignedPracasKey, currentUserId, currentUserKey, currentUserOrganizationId, currentUserRole, isCurrentUserAdmin]);

    useEffect(() => {
        if (!weeksToCompare) {
            setMetrics([]);
            return;
        }

        let isMounted = true;

        const fetchData = async () => {
            setLoading(true);
            try {
                const praca = filters.praca || null;
                const year = filters.ano || undefined;
                const results = await fetchComparisonMetrics(
                    [weeksToCompare.previous, weeksToCompare.current],
                    praca,
                    stableCurrentUser,
                    stableCurrentUser?.organization_id ?? null,
                    year
                );

                if (!isMounted) return;

                if (results.length === 2) {
                    const prevData = results[0];
                    const currData = results[1];
                    const calcTaxa = (ofertadas: number, aceitas: number) => ofertadas > 0 ? (aceitas / ofertadas) * 100 : 0;
                    const calcAderencia = (dados: any[]) => dados?.[0]?.aderencia_percentual || 0;

                    setMetrics([
                        { label: 'Aderencia', current: calcAderencia(currData.aderencia_semanal), previous: calcAderencia(prevData.aderencia_semanal), format: 'percent' },
                        { label: 'Completadas', current: currData.total_completadas || 0, previous: prevData.total_completadas || 0, format: 'number' },
                        { label: 'Ofertadas', current: currData.total_ofertadas || 0, previous: prevData.total_ofertadas || 0, format: 'number' },
                        { label: 'Taxa Aceitacao', current: calcTaxa(currData.total_ofertadas || 0, currData.total_aceitas || 0), previous: calcTaxa(prevData.total_ofertadas || 0, prevData.total_aceitas || 0), format: 'percent' }
                    ]);
                    setCurrentWeekLabel(weeksToCompare.currentLabel);
                    setPreviousWeekLabel(weeksToCompare.previousLabel);
                }
            } catch (err) {
                safeLog.error('Erro:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        void fetchData();
        return () => { isMounted = false; };
    }, [filters.ano, filters.praca, stableCurrentUser, weeksComparisonKey, weeksToCompare]);

    return { metrics, loading, currentWeekLabel, previousWeekLabel };
}
