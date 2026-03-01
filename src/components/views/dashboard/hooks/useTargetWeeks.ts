import { useMemo } from 'react';
import { AderenciaSemanal } from '@/types';

export function useTargetWeeks(filters: any, aderenciaSemanal?: AderenciaSemanal[]) {
    return useMemo(() => {
        let targetWeekStr = '';
        const targetYear = filters.ano || new Date().getFullYear();

        const filterSemanas = filters.semanas || [];
        if (filterSemanas.length > 0) {
            targetWeekStr = String(Math.max(...filterSemanas));
        } else if (filters.semana) {
            targetWeekStr = String(filters.semana);
        } else if (aderenciaSemanal && aderenciaSemanal.length > 0) {
            const weekStrings = aderenciaSemanal.map(s => s.semana).filter(Boolean).filter(s => s !== 'Geral');
            if (weekStrings.length > 0) {
                const match = String(weekStrings[weekStrings.length - 1]).match(/(\d+)$/);
                if (match) targetWeekStr = match[1];
            }
        }

        if (!targetWeekStr) return null;

        const targetNum = parseInt(targetWeekStr);
        const previousNum = targetNum > 1 ? targetNum - 1 : 52;
        return {
            current: String(targetNum),
            previous: String(previousNum),
            currentLabel: `Semana ${targetNum}`,
            previousLabel: `Semana ${previousNum}`
        };
    }, [filters.semanas, filters.semana, filters.ano, aderenciaSemanal]);
}
