import { useState, useEffect, useMemo } from 'react';
import { useDashboardFilters } from '@/hooks/dashboard/useDashboardFilters';
import { useDashboardDimensions } from '@/hooks/dashboard/useDashboardDimensions';
import { fetchComparisonMetrics } from '@/hooks/comparacao/useComparisonMetrics';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/auth/useAuth';
import { DashboardResumoData, AderenciaSemanal } from '@/types';
import { safeLog } from '@/lib/errorHandler';

export interface ComparisonMetricData {
    label: string;
    current: number;
    previous: number;
    format: 'number' | 'percent' | 'hours';
}

export function useWeekComparison(aderenciaSemanal?: AderenciaSemanal[]) {
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
        // 2. Se não houver filtro manual, calculamos a ultima semana com base nos dados exibidos `aderenciaSemanal`
        else if (aderenciaSemanal && aderenciaSemanal.length > 0) {
            // aderenciaSemanal vem da API com o campo `semana` que pode ser "2026-W08", "8", etc.
            const weekStrings = aderenciaSemanal
                .map(s => s.semana)
                .filter(Boolean)
                // Ignorar a linha de total Geral se houver
                .filter(s => s !== 'Geral');

            if (weekStrings.length > 0) {
                // Pega a string de semana e tenta extrair os digitos do final. Ex: "2026-W08" -> "08" -> "8"
                const lastWeekStr = weekStrings[weekStrings.length - 1];
                const match = String(lastWeekStr).match(/(\d+)$/);
                if (match) {
                    targetWeekStr = match[1];
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
