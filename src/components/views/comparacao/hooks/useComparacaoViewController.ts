import { useState, useEffect, useMemo, useCallback } from 'react';
import { FilterOption, CurrentUser } from '@/types';
import { useComparacaoData } from '@/hooks/useComparacaoData';
import { registerChartJS } from '@/lib/chartConfig';
import { safeLog } from '@/lib/errorHandler';

interface UseComparacaoViewControllerProps {
    semanas: string[];
    pracas: FilterOption[];
    subPracas: FilterOption[];
    origens: FilterOption[];
    currentUser: CurrentUser | null;
}

export type ViewMode = 'table' | 'chart';

export function useComparacaoViewController({
    semanas,
    currentUser,
}: UseComparacaoViewControllerProps) {
    const [semanasSelecionadas, setSemanasSelecionadas] = useState<string[]>([]);
    const [pracaSelecionada, setPracaSelecionada] = useState<string | null>(null);
    const [mostrarApresentacao, setMostrarApresentacao] = useState(false);

    // Estados para controlar visualização (tabela/gráfico)
    const [viewModeDetalhada, setViewModeDetalhada] = useState<ViewMode>('table');
    const [viewModeDia, setViewModeDia] = useState<ViewMode>('table');
    const [viewModeSubPraca, setViewModeSubPraca] = useState<ViewMode>('table');
    const [viewModeOrigem, setViewModeOrigem] = useState<ViewMode>('table');

    // Usar hook de dados
    const {
        loading,
        dadosComparacao,
        utrComparacao,
        todasSemanas,
        compararSemanas,
        error // Exposing error if needed
    } = useComparacaoData({
        semanas,
        semanasSelecionadas,
        pracaSelecionada,
        currentUser,
    });

    // Registrar Chart.js
    useEffect(() => {
        if (typeof window !== 'undefined') {
            registerChartJS().catch((err) => {
                safeLog.error('Erro ao registrar Chart.js:', err);
            });
        }
    }, []);

    // Filtro automático de praça para não-admins/não-marketing
    useEffect(() => {
        const isMarketing = currentUser?.role === 'marketing';
        if (currentUser && !currentUser.is_admin && !isMarketing && currentUser.assigned_pracas.length === 1) {
            setPracaSelecionada(currentUser.assigned_pracas[0]);
        }
    }, [currentUser]);

    const toggleSemana = useCallback((semana: number | string) => {
        setSemanasSelecionadas(prev => {
            let semanaStr = String(semana);
            if (semanaStr.includes('W')) {
                const match = semanaStr.match(/W(\d+)/);
                semanaStr = match ? match[1] : semanaStr;
            } else {
                semanaStr = String(semana);
            }

            if (prev.includes(semanaStr)) {
                return prev.filter(s => s !== semanaStr);
            } else {
                return [...prev, semanaStr].sort((a, b) => {
                    const numA = parseInt(a, 10);
                    const numB = parseInt(b, 10);
                    return numA - numB;
                });
            }
        });
    }, []);

    const origensDisponiveis = useMemo(() => {
        const conjunto = new Set<string>();
        dadosComparacao.forEach((dados) => {
            const origens = dados?.aderencia_origem || dados?.origem || [];
            origens.forEach((item) => {
                const nome = item?.origem?.trim();
                if (nome) {
                    conjunto.add(nome);
                }
            });
        });
        return Array.from(conjunto).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }, [dadosComparacao]);

    const totalColunasOrigem = useMemo(
        () => semanasSelecionadas.reduce((acc, _, idx) => acc + (idx === 0 ? 1 : 2), 0),
        [semanasSelecionadas]
    );

    const utrComparacaoNormalizada = useMemo(() => {
        return utrComparacao.map(item => ({
            semana: String(item.semana),
            utr: item.utr,
        }));
    }, [utrComparacao]);

    const isMarketing = currentUser?.role === 'marketing';
    const shouldDisablePracaFilter = Boolean(currentUser && !currentUser.is_admin && !isMarketing && currentUser.assigned_pracas.length === 1);

    return {
        state: {
            semanasSelecionadas,
            pracaSelecionada,
            mostrarApresentacao,
            viewModeDetalhada,
            viewModeDia,
            viewModeSubPraca,
            viewModeOrigem,
            loading,
            error,
            shouldDisablePracaFilter
        },
        data: {
            dadosComparacao,
            utrComparacao: utrComparacaoNormalizada,
            todasSemanas,
            origensDisponiveis,
            totalColunasOrigem
        },
        actions: {
            setPracaSelecionada,
            setMostrarApresentacao,
            setViewModeDetalhada,
            setViewModeDia,
            setViewModeSubPraca,
            setViewModeOrigem,
            toggleSemana,
            limparSemanas: () => setSemanasSelecionadas([]),
            compararSemanas
        }
    };
}
