
import { useMemo } from 'react';
import { getISOWeek } from 'date-fns';
import { Filters } from '@/types';

export function useFiltroBarOptions(
    anos: number[],
    semanas: string[],
    filters: Filters
) {
    const anosOptions = useMemo(() => {
        return anos.map((ano) => ({ value: String(ano), label: String(ano) }));
    }, [anos]);

    const semanasOptions = useMemo(() => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentWeek = getISOWeek(today);
        const selectedYear = filters?.ano ? parseInt(String(filters.ano), 10) : null;

        return semanas
            .filter(sem => sem && sem !== '' && sem !== 'NaN')
            .filter(sem => {
                // Se o ano selecionado for o atual, não mostrar semanas futuras
                if (selectedYear === currentYear) {
                    let weekNumber = sem;
                    if (sem.includes('-W')) {
                        weekNumber = sem.split('-W')[1];
                    }
                    const parsed = parseInt(weekNumber, 10);
                    return !isNaN(parsed) && parsed <= currentWeek;
                }
                return true;
            })
            .map((sem) => {
                let weekNumber = sem;
                if (sem.includes('-W')) {
                    weekNumber = sem.split('-W')[1];
                }
                const parsed = parseInt(weekNumber, 10);
                if (isNaN(parsed)) return null;
                const normalizedWeek = String(parsed);
                return { value: normalizedWeek, label: `Semana ${normalizedWeek}` };
            })
            .filter((opt): opt is { value: string; label: string } => opt !== null);
    }, [semanas, filters?.ano]);

    return { anosOptions, semanasOptions };
}
