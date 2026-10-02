
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
    const { semanasComDados } = useSemanasComDados(selectedYear);

    const semanasOptions = useMemo(() => {
        const today = new Date();
        const currentYear = getISOWeekYear(today);
        const currentWeek = getISOWeek(today);

        // Se temos semanas com dados do banco, usar elas
        if (semanasComDados.length > 0) {
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
        return semanas
            .filter(sem => sem && sem !== '' && sem !== 'NaN')
            .filter(sem => {
                // Para o ano atual, filtrar semanas futuras
                if (selectedYear === currentYear) {
                    const parsed = parseInt(sem, 10);
                    return !isNaN(parsed) && parsed <= currentWeek;
                }
                return true;
            })
            .map((sem) => {
                const parsed = parseInt(sem, 10);
                if (isNaN(parsed)) return null;
                return { value: String(parsed), label: `Semana ${parsed}` };
            })
            .filter((opt): opt is { value: string; label: string } => opt !== null)
            .filter((opt, index, self) =>
                index === self.findIndex((o) => o.value === opt.value)
            );
    }, [semanas, selectedYear, semanasComDados]);

    return { anosOptions, semanasOptions };
}
