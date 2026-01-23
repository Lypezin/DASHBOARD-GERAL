
import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { CurrentUser } from '@/types';

export type ViewMode = 'table' | 'chart';

export function useComparacaoFilters(currentUser: CurrentUser | null) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Inicializar do URL
    const getInitialSemanas = () => {
        const param = searchParams.get('comp_semanas');
        return param ? param.split(',').filter(Boolean) : [];
    };

    const getInitialPraca = () => {
        return searchParams.get('comp_praca') || null;
    };

    const [semanasSelecionadas, setSemanasSelecionadas] = useState<string[]>(getInitialSemanas);
    const [pracaSelecionada, setPracaSelecionada] = useState<string | null>(getInitialPraca);
    const [mostrarApresentacao, setMostrarApresentacao] = useState(false);

    // Sincronizar com URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        let changed = false;

        const currentSemanas = params.get('comp_semanas');
        const newSemanas = semanasSelecionadas.join(',');

        if (semanasSelecionadas.length > 0) {
            if (currentSemanas !== newSemanas) {
                params.set('comp_semanas', newSemanas);
                changed = true;
            }
        } else if (currentSemanas) {
            params.delete('comp_semanas');
            changed = true;
        }

        const currentPraca = params.get('comp_praca');
        if (pracaSelecionada) {
            if (currentPraca !== pracaSelecionada) {
                params.set('comp_praca', pracaSelecionada);
                changed = true;
            }
        } else if (currentPraca) {
            params.delete('comp_praca');
            changed = true;
        }

        if (changed) {
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [semanasSelecionadas, pracaSelecionada, pathname, router, searchParams]);

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
