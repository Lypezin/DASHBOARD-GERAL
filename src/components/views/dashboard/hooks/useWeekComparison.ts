import { useState, useEffect, useMemo } from 'react';
import { useDashboardFilters } from '@/hooks/dashboard/useDashboardFilters';
import { useDashboardDimensions } from '@/hooks/dashboard/useDashboardDimensions';
import { fetchComparisonMetrics } from '@/hooks/comparacao/useComparisonMetrics';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/auth/useAuth';
import { DashboardResumoData } from '@/types';
import { safeLog } from '@/lib/errorHandler';

export interface ComparisonMetricData {
    label: string;
    current: number;
    previous: number;
    format: 'number' | 'percent' | 'hours';
}

export function useWeekComparison() {
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
        if (loadingDimensions || !semanasDisponiveis || semanasDisponiveis.length === 0) {
            return null;
        }

        let targetWeekStr = '';

        // Tenta pegar a maior semana selecionada nos filtros
        const filterSemanas = filters.semanas || [];
        if (filterSemanas.length > 0) {
            targetWeekStr = filterSemanas.length > 0 ? String(Math.max(...filterSemanas)) : '';
        } else if (filters.semana) {
            targetWeekStr = String(filters.semana);
        }

        // Vamos extrair numero da semana de todas as disponíveis
        const parsedWeeks = semanasDisponiveis.map(s => {
            const match = String(s).match(/(?:(\d{4})-W)?(\d+)/);
            if (match) {
                return { original: s, ano: match[1] ? parseInt(match[1]) : (filters.ano || new Date().getFullYear()), semana: parseInt(match[2]) };
            }
            return { original: s, ano: filters.ano || new Date().getFullYear(), semana: parseInt(String(s)) };
        }).filter(w => !isNaN(w.semana)).sort((a, b) => {
            if (a.ano !== b.ano) return b.ano - a.ano; // decrescente ano
            return b.semana - a.semana; // decrescente semana
        });

        if (parsedWeeks.length === 0) return null;

        let targetWeekObj = parsedWeeks[0];

        if (targetWeekStr) {
            const targetNum = parseInt(targetWeekStr);
            const found = parsedWeeks.find(w => w.semana === targetNum);
            if (found) {
                targetWeekObj = found;
            } else {
                targetWeekObj = { original: targetWeekStr, ano: filters.ano || new Date().getFullYear(), semana: targetNum };
                parsedWeeks.push(targetWeekObj); // adiciona para reordenar
                parsedWeeks.sort((a, b) => {
                    if (a.ano !== b.ano) return b.ano - a.ano;
                    return b.semana - a.semana;
                });
            }
        }

        // Encontrar o indice na lista ordenada
        const idx = parsedWeeks.findIndex(w => w.ano === targetWeekObj.ano && w.semana === targetWeekObj.semana);
        let previousWeekObj = null;

        if (idx !== -1 && idx + 1 < parsedWeeks.length) {
            // A lista tá descendente, então idx + 1 é a semana anterior
            previousWeekObj = parsedWeeks[idx + 1];
        } else {
            // Calcula matematicamente se não encontrou na lista
            if (targetWeekObj.semana > 1) {
                previousWeekObj = { original: String(targetWeekObj.semana - 1), ano: targetWeekObj.ano, semana: targetWeekObj.semana - 1 };
            } else {
                previousWeekObj = { original: '52', ano: targetWeekObj.ano - 1, semana: 52 };
            }
        }

        return {
            current: targetWeekObj.original,
            previous: previousWeekObj.original,
            currentLabel: `Semana ${targetWeekObj.semana}`,
            previousLabel: `Semana ${previousWeekObj.semana}`
        };

    }, [filters.semanas, filters.semana, filters.ano, semanasDisponiveis, loadingDimensions]);

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
