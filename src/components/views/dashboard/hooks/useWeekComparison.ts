import { useState, useEffect, useMemo } from 'react';
import { useDashboardFilters } from '@/hooks/dashboard/useDashboardFilters';
import { useDashboardDimensions } from '@/hooks/dashboard/useDashboardDimensions';
import { fetchComparisonMetrics } from '@/hooks/comparacao/useComparisonMetrics';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/auth/useAuth';
import { DashboardResumoData, AderenciaDia } from '@/types';
import { safeLog } from '@/lib/errorHandler';

export interface ComparisonMetricData {
    label: string;
    current: number;
    previous: number;
    format: 'number' | 'percent' | 'hours';
}

export function useWeekComparison(aderenciaDia?: AderenciaDia[]) {
    const { filters } = useDashboardFilters();
    const { semanasDisponiveis, loadingDimensions } = useDashboardDimensions();
    const { organizationId, isLoading: isOrgLoading } = useOrganization();
    const { user: currentUser } = useAuth();

    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState<ComparisonMetricData[]>([]);
    const [currentWeekLabel, setCurrentWeekLabel] = useState('');
    const [previousWeekLabel, setPreviousWeekLabel] = useState('');

    // Identificar a semana atual e anterior
    const weeksToCompare = useMemo(() => {
        let targetWeekStr = '';
        let targetYear = filters.ano || new Date().getFullYear();

        // 1. Tenta pegar a maior semana selecionada nos filtros manuais
        const filterSemanas = filters.semanas || [];
        if (filterSemanas.length > 0) {
            targetWeekStr = String(Math.max(...filterSemanas));
        } else if (filters.semana) {
            targetWeekStr = String(filters.semana);
        }
        // 2. Se nÃ£o houver filtro manual, calculamos a ultima semana com base nos dados exibidos `aderenciaDia`
        else if (aderenciaDia && aderenciaDia.length > 0) {
            const validDates = aderenciaDia
                .map(d => d.data || d.dia)
                .filter(Boolean)
                .sort();

            if (validDates.length > 0) {
                // "2026-02-22" ou similar
                let latestDateStr = validDates[validDates.length - 1];
                if (latestDateStr) {
                    try {
                        // Garantindo timezone UTC para evitar que 00:00 retorne dia incorreto
                        const d = new Date(latestDateStr.includes('T') ? latestDateStr : `${latestDateStr}T00:00:00Z`);
                        targetYear = d.getUTCFullYear();

                        // CÃ¡lculo padronizado da ISO Week Date
                        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
                        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                        const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

                        targetWeekStr = String(weekNo);
                    } catch (e) {
                        safeLog.warn('Failed to parse date for ISO week: ', latestDateStr);
                    }
                }
            }
        }

        // Se por algum motivo nÃ£o conseguir determinar (ex: sem dados carregados ainda), aborta
        if (!targetWeekStr) return null;

        const targetNum = parseInt(targetWeekStr);
        let previousNum = targetNum > 1 ? targetNum - 1 : 52;
        let previousYear = targetNum > 1 ? targetYear : targetYear - 1;

        return {
            current: String(targetNum),
            previous: String(previousNum),
            currentLabel: `Semana ${targetNum}`,
            previousLabel: `Semana ${previousNum}`
        };

    }, [filters.semanas, filters.semana, filters.ano, aderenciaDia]);

    useEffect(() => {
        if (!weeksToCompare || isOrgLoading) {
            if (!weeksToCompare && !loadingDimensions) {
                setMetrics([]);
            }
            return;
        }

        let isMounted = true;

        const fetchData = async () => {
            setLoading(true);
            try {
                // array [previous, current] para o fetchComparisonMetrics
                const weeksArray = [String(weeksToCompare.previous), String(weeksToCompare.current)];

                const praca = filters.praca || null;
                const year = filters.ano || undefined;

                const results = await fetchComparisonMetrics(weeksArray, praca, currentUser, organizationId || null, year);

                if (!isMounted) return;

                if (results.length === 2) {
                    const prevData = results[0]; // (previous)
                    const currData = results[1]; // (current)

                    const calcTaxa = (ofertadas: number, aceitas: number) => {
                        return ofertadas > 0 ? (aceitas / ofertadas) * 100 : 0;
                    };

                    const calcAderencia = (aderenciaSemanal: any[]) => {
                        if (!aderenciaSemanal || aderenciaSemanal.length === 0) return 0;
                        return aderenciaSemanal[0]?.aderencia_percentual || 0;
                    };

                    setMetrics([
                        {
                            label: 'Aderência',
                            current: calcAderencia(currData.aderencia_semanal),
                            previous: calcAderencia(prevData.aderencia_semanal),
                            format: 'percent'
                        },
                        {
                            label: 'Completadas',
                            current: currData.total_completadas || 0,
                            previous: prevData.total_completadas || 0,
                            format: 'number'
                        },
                        {
                            label: 'Ofertadas',
                            current: currData.total_ofertadas || 0,
                            previous: prevData.total_ofertadas || 0,
                            format: 'number'
                        },
                        {
                            label: 'Taxa Aceitação',
                            current: calcTaxa(currData.total_ofertadas || 0, currData.total_aceitas || 0),
                            previous: calcTaxa(prevData.total_ofertadas || 0, prevData.total_aceitas || 0),
                            format: 'percent'
                        }
                    ]);

                    setCurrentWeekLabel(weeksToCompare.currentLabel);
                    setPreviousWeekLabel(weeksToCompare.previousLabel);
                }

            } catch (err) {
                safeLog.error('Erro ao buscar metricas comparativas semanais:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => { isMounted = false; };

    }, [weeksToCompare?.current, weeksToCompare?.previous, filters.praca, filters.ano, isOrgLoading, currentUser, organizationId]);

    return {
        metrics,
        loading,
        currentWeekLabel,
        previousWeekLabel
    };
}
