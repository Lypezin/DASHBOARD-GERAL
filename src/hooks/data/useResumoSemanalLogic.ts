import { useMemo } from 'react';
import { EvolucaoSemanal, AderenciaSemanal, UtrSemanal } from '@/types';
import { ResumoLocalData } from './useResumoDrivers';
import { ResumoTableRow } from '@/components/views/resumo-semanal/ResumoTable';

interface UseResumoSemanalLogicProps {
    evolucaoSemanal: EvolucaoSemanal[];
    aderenciaSemanal: AderenciaSemanal[];
    utrSemanal: UtrSemanal[];
    anoSelecionado: number;
    localDataMap: Map<string, ResumoLocalData>;
    useLocalData: boolean;
}

export const useResumoSemanalLogic = ({
    evolucaoSemanal,
    aderenciaSemanal,
    utrSemanal,
    anoSelecionado,
    localDataMap,
    useLocalData
}: UseResumoSemanalLogicProps) => {

    const processedData: ResumoTableRow[] = useMemo(() => {
        const allWeeks = new Set<string>();

        // Always use evolucaoSemanal to determine which weeks to show
        evolucaoSemanal?.forEach(d => {
            const compositeKey = `${d.ano}-${d.semana}`;
            allWeeks.add(compositeKey);
        });

        const sortedWeeks = Array.from(allWeeks).sort((a, b) => {
            const strA = String(a);
            const strB = String(b);

            const splitA = strA.split('-');
            const splitB = strB.split('-');

            if (splitA.length === 2 && splitB.length === 2) {
                const yearA = parseInt(splitA[0]);
                const weekA = parseInt(splitA[1]);
                const yearB = parseInt(splitB[0]);
                const weekB = parseInt(splitB[1]);

                if (!isNaN(yearA) && !isNaN(yearB) && !isNaN(weekA) && !isNaN(weekB)) {
                    if (yearA !== yearB) return yearA - yearB;
                    return weekA - weekB;
                }
            }

            const numA = parseInt(strA);
            const numB = parseInt(strB);

            if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
            }

            return strA.localeCompare(strB, undefined, { numeric: true });
        });

        const recentWeeks = sortedWeeks.slice(0, 4);

        return recentWeeks.map(weekKey => {
            let weekNum = 0;
            let yearNum = anoSelecionado;
            const strKey = String(weekKey);

            if (strKey.includes('-')) {
                const parts = strKey.split('-');
                yearNum = parseInt(parts[0]);
                weekNum = parseInt(parts[1]);
            } else {
                weekNum = parseInt(strKey);
            }

            const driverKey = `${yearNum}-${weekNum}`;
            const localData = localDataMap.get(driverKey);

            // Get global data for fallback
            const epi = evolucaoSemanal?.find(e => e.semana === weekNum);
            const api = aderenciaSemanal?.find(a => {
                if (String(a.semana) === strKey) return true;
                if (parseInt(String(a.semana)) === weekNum) return true;
                return false;
            });
            const upi = utrSemanal?.find(u => u.semana === weekNum);

            // Use local filtered data if filter is active, otherwise use global
            let pedidos: number;
            let drivers: number;
            let sh: number;
            let aderenciaMedia: number;
            let utr: number;
            let aderencia: number;
            let rejeite: number;

            if (useLocalData && localData) {
                pedidos = localData.pedidos;
                drivers = localData.drivers;
                sh = localData.sh;
                aderenciaMedia = localData.aderenciaMedia;
                utr = localData.utr;
                aderencia = localData.aderencia;
                rejeite = localData.rejeite;
            } else if (useLocalData) {
                // Filter active but no local data for this week
                pedidos = 0;
                drivers = 0;
                sh = 0;
                aderenciaMedia = 0;
                utr = 0;
                aderencia = 0;
                rejeite = 0;
            } else {
                // No filter - use global data
                pedidos = epi?.corridas_completadas || 0;
                drivers = localData?.drivers || 0;
                sh = 0;
                if (api?.horas_entregues) {
                    const parts = api.horas_entregues.split(':');
                    if (parts.length >= 1) {
                        sh = parseFloat(parts[0]) + (parts[1] ? parseFloat(parts[1]) / 60 : 0);
                    }
                } else if (api?.segundos_realizados) {
                    sh = api.segundos_realizados / 3600;
                }
                aderenciaMedia = localData?.aderenciaMedia || api?.aderencia_percentual || 0;

                utr = upi?.utr || 0;
                aderencia = api?.aderencia_percentual || 0;
                rejeite = epi?.corridas_rejeitadas && epi.corridas_ofertadas
                    ? (epi.corridas_rejeitadas / epi.corridas_ofertadas) * 100
                    : 0;
            }

            const label = epi?.semana_label || `Semana ${weekNum}`;

            return {
                label: weekKey,
                semana_label: label,
                pedidos,
                drivers,
                sh,
                aderenciaMedia,
                utr,
                aderencia,
                rejeite
            };
        });

    }, [evolucaoSemanal, aderenciaSemanal, utrSemanal, localDataMap, anoSelecionado, useLocalData]);

    return processedData;
}
