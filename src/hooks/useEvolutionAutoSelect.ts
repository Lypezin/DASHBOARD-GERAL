import { useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

interface UseEvolutionAutoSelectProps {
    filters: { ano: number | null };
    setFilters: React.Dispatch<React.SetStateAction<any>>;
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

    // Selecionar automaticamente o ano mais recente se nenhum estiver selecionado
    useEffect(() => {
        if (anosDisponiveis && anosDisponiveis.length > 0) {
            const shouldSelect = !filters.ano || !anosDisponiveis.includes(filters.ano);

            if (shouldSelect) {
                const maxYear = Math.max(...anosDisponiveis);
                safeLog.info(`[DashboardEvolucao] Definindo ano padrão para: ${maxYear} (Reason: Filters:${filters.ano} Available:${anosDisponiveis.join(',')})`);
                setFilters((prev: any) => ({ ...prev, ano: maxYear }));
                setAnoEvolucao(maxYear);
            }
        }
    }, [anosDisponiveis, filters.ano, setFilters, setAnoEvolucao]);

    // Ajustar automaticamente o ano da evolução se o selecionado não estiver disponível
    useEffect(() => {
        if (Array.isArray(anosDisponiveis) && anosDisponiveis.length > 0) {
            if (!anosDisponiveis.includes(anoEvolucao)) {
                const ultimoAno = anosDisponiveis[anosDisponiveis.length - 1];
                setAnoEvolucao(ultimoAno);
            }
        }
    }, [anosDisponiveis, anoEvolucao, setAnoEvolucao]);
}
