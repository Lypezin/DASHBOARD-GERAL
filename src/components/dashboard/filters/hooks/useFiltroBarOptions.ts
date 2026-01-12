
import { useMemo } from 'react';
import { getISOWeek, getISOWeekYear } from 'date-fns';
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
        const currentYear = getISOWeekYear(today);
        const currentWeek = getISOWeek(today);
        const selectedYear = filters?.ano ? parseInt(String(filters.ano), 10) : null;

        return semanas
            .filter(sem => sem && sem !== '' && sem !== 'NaN')
            .filter(sem => {
                // Parse year from week format if available (e.g., "2026-W1")
                if (sem.includes('-W')) {
                    const [yearPart, weekPart] = sem.split('-W');
                    const weekYear = parseInt(yearPart, 10);
                    const weekNum = parseInt(weekPart, 10);
                    
                    // Filter by selected year - only show weeks that belong to that year
                    if (selectedYear && weekYear !== selectedYear) {
                        return false;
                    }
                    
                    // For current year, also filter out future weeks
                    if (selectedYear === currentYear && weekNum > currentWeek) {
                        return false;
                    }
                    
                    return !isNaN(weekNum);
                }
                
                // For plain week numbers (no year info), apply current week filter
                // only if selected year is current year
                if (selectedYear === currentYear) {
                    const parsed = parseInt(sem, 10);
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
            .filter((opt): opt is { value: string; label: string } => opt !== null)
            // Remove duplicates (same week from different sources)
            .filter((opt, index, self) => 
                index === self.findIndex((o) => o.value === opt.value)
            );
    }, [semanas, filters?.ano]);

    return { anosOptions, semanasOptions };
}
