
import { useState, useCallback } from 'react';
import { CurrentUser } from '@/types';

export type ViewMode = 'table' | 'chart';

export function useComparacaoFilters(currentUser: CurrentUser | null) {
    const [semanasSelecionadas, setSemanasSelecionadas] = useState<string[]>([]);
    const [pracaSelecionada, setPracaSelecionada] = useState<string | null>(null);
    const [mostrarApresentacao, setMostrarApresentacao] = useState(false);

    // Estados para controlar visualização (tabela/gráfico)
    const [viewModeDetalhada, setViewModeDetalhada] = useState<ViewMode>('table');
    const [viewModeDia, setViewModeDia] = useState<ViewMode>('table');
    const [viewModeSubPraca, setViewModeSubPraca] = useState<ViewMode>('table');
    const [viewModeOrigem, setViewModeOrigem] = useState<ViewMode>('table');

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

    const isMarketing = currentUser?.role === 'marketing';
    const shouldDisablePracaFilter = Boolean(currentUser && !currentUser.is_admin && !isMarketing && currentUser.assigned_pracas.length === 1);

    return {
        semanasSelecionadas,
        setSemanasSelecionadas,
        pracaSelecionada,
        setPracaSelecionada,
        mostrarApresentacao,
        setMostrarApresentacao,
        viewModeDetalhada,
        setViewModeDetalhada,
        viewModeDia,
        setViewModeDia,
        viewModeSubPraca,
        setViewModeSubPraca,
        viewModeOrigem,
        setViewModeOrigem,
        toggleSemana,
        shouldDisablePracaFilter
    };
}
