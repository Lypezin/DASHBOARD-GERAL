
import { useMemo } from 'react';
import { getISOWeek, getISOWeekYear } from 'date-fns';
import { Filters } from '@/types';
import { useSemanasComDados } from '@/hooks/data/useSemanasComDados';

export function useFiltroBarOptions(
    anos: number[],
    semanas: string[],
    filters: Filters
) {
    const anosOptions = useMemo(() => {
        return anos.map((ano) => ({ value: String(ano), label: String(ano) }));
    }, [anos]);

    // Busca semanas que realmente têm dados para o ano selecionado
    const selectedYear = filters?.ano ? parseInt(String(filters.ano), 10) : null;
    const { semanasComDados, loadingSemanasComDados, error, retry } = useSemanasComDados(selectedYear);

    const semanasOptions = useMemo(() => {
        if (error) return [];

        const today = new Date();
        const currentYear = getISOWeekYear(today);
        const currentWeek = getISOWeek(today);

        // Com um ano selecionado, a RPC define exatamente quais semanas têm
        // registros. Uma lista vazia válida não deve reabrir as opções antigas.
        if (selectedYear !== null) {
            return semanasComDados
                .filter(weekNum => {
                    // Para o ano atual, filtrar semanas futuras
                    if (selectedYear === currentYear && weekNum > currentWeek) {
                        return false;
                    }
                    return true;
                })
                .map(weekNum => ({
                    value: String(weekNum),
                    label: `Semana ${weekNum}`
                }));
        }

        // Fallback: usar semanas passadas como props (comportamento anterior)
        const seenWeeks = new Set<number>();
        const options: { value: string; label: string }[] = [];
        for (const sem of semanas) {
            if (!sem || sem === 'NaN') continue;
            const parsed = parseInt(sem, 10);
            if (isNaN(parsed) || seenWeeks.has(parsed)) continue;
            if (selectedYear === currentYear && parsed > currentWeek) continue;
            seenWeeks.add(parsed);
            options.push({ value: String(parsed), label: `Semana ${parsed}` });
        }
        return options;
    }, [semanas, selectedYear, semanasComDados, error]);

    return {
        anosOptions,
        semanasOptions,
        loadingSemanas: loadingSemanasComDados,
        errorSemanas: error,
        retrySemanas: retry,
    };
}
