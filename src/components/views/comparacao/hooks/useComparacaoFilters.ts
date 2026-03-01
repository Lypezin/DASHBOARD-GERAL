import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { CurrentUser } from '@/types';

export type ViewMode = 'table' | 'chart';
export interface SecoesVisiveis { metricas: boolean; detalhada: boolean; por_dia: boolean; aderencia_dia: boolean; sub_praca: boolean; por_origem: boolean; origem_detalhada: boolean; utr: boolean; }

const SECOES_PADRAO: SecoesVisiveis = { metricas: true, detalhada: true, por_dia: true, aderencia_dia: true, sub_praca: true, por_origem: true, origem_detalhada: true, utr: true };

export function useComparacaoFilters(currentUser: CurrentUser | null) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const getInitialSemanas = () => searchParams.get('comp_semanas')?.split(',').filter(Boolean) || [];
    const getInitialPraca = () => searchParams.get('comp_praca') || null;
    const getInitialApresentacao = () => searchParams.get('comp_apresentacao') === 'true';

    const [semanasSelecionadas, setSemanasSelecionadas] = useState<string[]>(getInitialSemanas);
    const [pracaSelecionada, setPracaSelecionada] = useState<string | null>(getInitialPraca);
    const [mostrarApresentacao, setMostrarApresentacao] = useState(getInitialApresentacao);

    useEffect(() => {
        const isApresentacaoUrl = searchParams.get('comp_apresentacao') === 'true';
        if (isApresentacaoUrl !== mostrarApresentacao) setMostrarApresentacao(isApresentacaoUrl);
    }, [searchParams, mostrarApresentacao]);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        let changed = false;

        const currentSemanas = params.get('comp_semanas'), newSemanas = semanasSelecionadas.join(',');
        if (semanasSelecionadas.length > 0 && currentSemanas !== newSemanas) { params.set('comp_semanas', newSemanas); changed = true; }
        else if (semanasSelecionadas.length === 0 && currentSemanas) { params.delete('comp_semanas'); changed = true; }

        const currentPraca = params.get('comp_praca');
        if (pracaSelecionada && currentPraca !== pracaSelecionada) { params.set('comp_praca', pracaSelecionada); changed = true; }
        else if (!pracaSelecionada && currentPraca) { params.delete('comp_praca'); changed = true; }

        if (mostrarApresentacao && params.get('comp_apresentacao') !== 'true') { params.set('comp_apresentacao', 'true'); changed = true; }
        else if (!mostrarApresentacao && params.has('comp_apresentacao')) { params.delete('comp_apresentacao'); changed = true; }

        if (changed) router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [semanasSelecionadas, pracaSelecionada, mostrarApresentacao, pathname, router, searchParams]);

    const [viewModeDetalhada, setViewModeDetalhada] = useState<ViewMode>('table');
    const [viewModeDia, setViewModeDia] = useState<ViewMode>('table');
    const [viewModeSubPraca, setViewModeSubPraca] = useState<ViewMode>('table');
    const [viewModeOrigem, setViewModeOrigem] = useState<ViewMode>('table');
    const [secoesVisiveis, setSecoesVisiveis] = useState<SecoesVisiveis>(SECOES_PADRAO);

    const toggleSecao = useCallback((secao: keyof SecoesVisiveis) => setSecoesVisiveis(prev => ({ ...prev, [secao]: !prev[secao] })), []);

    const toggleSemana = useCallback((semana: number | string) => {
        setSemanasSelecionadas(prev => {
            let semanaStr = String(semana).includes('W') ? (String(semana).match(/W(\d+)/)?.[1] || String(semana)) : String(semana);
            return prev.includes(semanaStr) ? prev.filter(s => s !== semanaStr) : [...prev, semanaStr].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
        });
    }, []);

    const isMarketing = currentUser?.role === 'marketing';
    const shouldDisablePracaFilter = Boolean(currentUser && !currentUser.is_admin && !isMarketing && currentUser.assigned_pracas.length === 1);

    return {
        semanasSelecionadas, setSemanasSelecionadas, pracaSelecionada, setPracaSelecionada,
        mostrarApresentacao, setMostrarApresentacao,
        viewModeDetalhada, setViewModeDetalhada, viewModeDia, setViewModeDia,
        viewModeSubPraca, setViewModeSubPraca, viewModeOrigem, setViewModeOrigem,
        toggleSemana, shouldDisablePracaFilter, secoesVisiveis, setSecoesVisiveis, toggleSecao
    };
}
