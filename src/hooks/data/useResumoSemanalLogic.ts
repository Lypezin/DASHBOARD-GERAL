import { useMemo } from 'react';
import { EvolucaoSemanal, AderenciaSemanal, UtrSemanal } from '@/types';
import { ResumoLocalData } from '@/utils/data/driverTransformers';
import { ResumoTableRow } from '@/components/views/resumo-semanal/ResumoTable';
import { sortWeeksByYearAndWeek, extractYearAndWeek } from './resumoSemanalHelpers';

interface UseResumoSemanalLogicProps {
    evolucaoSemanal: EvolucaoSemanal[];
    aderenciaSemanal: AderenciaSemanal[];
    utrSemanal: UtrSemanal[];
    anoSelecionado: number;
    localDataMap: Map<string, ResumoLocalData>;
    useLocalData: boolean;
}

export const useResumoSemanalLogic = ({
    evolucaoSemanal, aderenciaSemanal, utrSemanal,
    anoSelecionado, localDataMap, useLocalData
}: UseResumoSemanalLogicProps) => {

    const processedData: ResumoTableRow[] = useMemo(() => {
        const allWeeks = new Set<string>();
        evolucaoSemanal?.forEach(d => allWeeks.add(`${d.ano}-${d.semana}`));
        const recentWeeks = sortWeeksByYearAndWeek(Array.from(allWeeks)).slice(0, 4);

        return recentWeeks.map(weekKey => {
            const { yearNum, weekNum, strKey } = extractYearAndWeek(weekKey, anoSelecionado);
            const driverKey = `${yearNum}-${weekNum}`;
            const localData = localDataMap.get(driverKey);

            const epi = evolucaoSemanal?.find(e => e.semana === weekNum);
            const api = aderenciaSemanal?.find(a => String(a.semana) === strKey || parseInt(String(a.semana)) === weekNum);
            const upi = utrSemanal?.find(u => u.semana === weekNum);

            let result = {
                pedidos: 0, drivers: 0, sh: 0,
                aderenciaMedia: 0, utr: 0, aderencia: 0, rejeite: 0
            };

            if (useLocalData && localData) {
                result = { ...localData };
            } else if (!useLocalData) {
                let shGlobal = 0;
                if (api?.horas_entregues) {
                    const parts = api.horas_entregues.split(':');
                    if (parts.length >= 1) shGlobal = parseFloat(parts[0]) + (parts[1] ? parseFloat(parts[1]) / 60 : 0);
                } else if (api?.segundos_realizados) {
                    shGlobal = api.segundos_realizados / 3600;
                }

                result = {
                    pedidos: epi?.corridas_completadas || 0,
                    drivers: localData?.drivers || 0,
                    sh: shGlobal,
                    aderenciaMedia: localData?.aderenciaMedia || api?.aderencia_percentual || 0,
                    utr: upi?.utr || 0,
                    aderencia: api?.aderencia_percentual || 0,
                    rejeite: (epi?.corridas_rejeitadas && epi.corridas_ofertadas) ? (epi.corridas_rejeitadas / epi.corridas_ofertadas) * 100 : 0
                };
            }

            return {
                label: weekKey,
                semana_label: epi?.semana_label || `Semana ${weekNum}`,
                ...result
            };
        });
    }, [evolucaoSemanal, aderenciaSemanal, utrSemanal, localDataMap, anoSelecionado, useLocalData]);

    return processedData;
}
