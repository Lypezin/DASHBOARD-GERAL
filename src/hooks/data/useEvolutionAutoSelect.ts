import { useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import type { DashboardFilters } from '@/types/filters';

const IS_DEV = process.env.NODE_ENV === 'development';

interface UseEvolutionAutoSelectProps {
    filters: { ano: number | null };
    setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>;
    anosDisponiveis: number[];
    anoEvolucao: number;
    setAnoEvolucao: (ano: number) => void;
}

export function useEvolutionAutoSelect({
    filters,
    setFilters,
    anosDisponiveis,
    anoEvolucao,
    setAnoEvolucao
}: UseEvolutionAutoSelectProps) {

    // Lógica consolidada de seleção de ano (previne loops infinitos)
    useEffect(() => {
        if (!anosDisponiveis || anosDisponiveis.length === 0) return;

        const maxYear = Math.max(...anosDisponiveis);
        const isValidYear = (year: number | null) => year && anosDisponiveis.includes(year);

        // Caso 1: Nenhum ano selecionado - definir o mais recente
        if (!filters.ano || !isValidYear(filters.ano)) {
            if (IS_DEV) {
                safeLog.info(`[DashboardEvolucao] Definindo ano padrão para: ${maxYear} (Atual: ${filters.ano})`);
            }
            setFilters((prev) => ({ ...prev, ano: maxYear }));
            setAnoEvolucao(maxYear);
            return;
        }

        // Caso 2: Ano do filtro mudou - sincronizar anoEvolucao
        if (filters.ano !== anoEvolucao) {
            if (IS_DEV) {
                safeLog.info(`[DashboardEvolucao] Sincronizando anoEvolucao: ${filters.ano}`);
            }
            setAnoEvolucao(filters.ano);
            return;
        }

        // Caso 3: anoEvolucao não está na lista - ajustar para o último disponível
        if (!anosDisponiveis.includes(anoEvolucao)) {
            const ultimoAno = anosDisponiveis[anosDisponiveis.length - 1];
            if (IS_DEV) {
                safeLog.info(`[DashboardEvolucao] anoEvolucao inválido, ajustando para: ${ultimoAno}`);
            }
            setAnoEvolucao(ultimoAno);
        }
    }, [anosDisponiveis, filters.ano, anoEvolucao, setFilters, setAnoEvolucao]);
}
