import { useState, useEffect } from 'react';
import { useDashboardFilters } from '@/hooks/dashboard/useDashboardFilters';
import { useDashboardDimensions } from '@/hooks/dashboard/useDashboardDimensions';
import { fetchComparisonMetrics } from '@/hooks/comparacao/useComparisonMetrics';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/auth/useAuth';
import { AderenciaSemanal } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { useTargetWeeks } from './useTargetWeeks';

export interface ComparisonMetricData {
    label: string;
    current: number;
    previous: number;
    format: 'number' | 'percent' | 'hours';
}

export function useWeekComparison(aderenciaSemanal?: AderenciaSemanal[]) {
    const { filters } = useDashboardFilters();
    const { loadingDimensions } = useDashboardDimensions();
    const { organizationId, isLoading: isOrgLoading } = useOrganization();
    const { user: currentUser } = useAuth();

    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState<ComparisonMetricData[]>([]);
    const [currentWeekLabel, setCurrentWeekLabel] = useState('');
    const [previousWeekLabel, setPreviousWeekLabel] = useState('');

    const weeksToCompare = useTargetWeeks(filters, aderenciaSemanal);

    useEffect(() => {
        if (!weeksToCompare || isOrgLoading) {
            if (!weeksToCompare && !loadingDimensions) setMetrics([]);
            return;
        }

        let isMounted = true;
        const fetchData = async () => {
            setLoading(true);
            try {
                const praca = filters.praca || null;
                const year = filters.ano || undefined;
                const results = await fetchComparisonMetrics([weeksToCompare.previous, weeksToCompare.current], praca, currentUser, organizationId || null, year);
                if (!isMounted) return;

                if (results.length === 2) {
                    const prevData = results[0];
                    const currData = results[1];
                    const calcTaxa = (ofertadas: number, aceitas: number) => ofertadas > 0 ? (aceitas / ofertadas) * 100 : 0;
                    const calcAderencia = (dados: any[]) => dados?.[0]?.aderencia_percentual || 0;

                    setMetrics([
                        { label: 'Aderência', current: calcAderencia(currData.aderencia_semanal), previous: calcAderencia(prevData.aderencia_semanal), format: 'percent' },
                        { label: 'Completadas', current: currData.total_completadas || 0, previous: prevData.total_completadas || 0, format: 'number' },
                        { label: 'Ofertadas', current: currData.total_ofertadas || 0, previous: prevData.total_ofertadas || 0, format: 'number' },
                        { label: 'Taxa Aceitação', current: calcTaxa(currData.total_ofertadas || 0, currData.total_aceitas || 0), previous: calcTaxa(prevData.total_ofertadas || 0, prevData.total_aceitas || 0), format: 'percent' }
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

        fetchData();
        return () => { isMounted = false; };
    }, [weeksToCompare?.current, weeksToCompare?.previous, filters.praca, filters.ano, isOrgLoading, currentUser, organizationId]);

    return { metrics, loading, currentWeekLabel, previousWeekLabel };
}
