import { useState, useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { FilterOption, CurrentUser, hasFullCityAccess, DimensoesDashboard, Filters } from '@/types';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useDimensionOptions(dimensoes: DimensoesDashboard | null, currentUser?: CurrentUser | null, filters?: Filters | null) {
    const [subPracas, setSubPracas] = useState<FilterOption[]>([]);
    const [origens, setOrigens] = useState<FilterOption[]>([]);
    const [turnos, setTurnos] = useState<FilterOption[]>([]);

    useEffect(() => {
        if (!dimensoes) {
            setSubPracas([]);
            setOrigens([]);
            setTurnos([]);
            return;
        }

        let targetPracas: string[] = [];

        if (filters?.praca) {
            // Se o usuário selecionou uma praça específica, filtramos apenas por ela
            targetPracas = [filters.praca];
        } else if (currentUser && !hasFullCityAccess(currentUser) && currentUser.assigned_pracas.length > 0) {
            // Se o usuário tem acesso restrito e não escolheu praça, filtramos pelas praças permitidas
            targetPracas = currentUser.assigned_pracas;
        }

        if (targetPracas.length > 0) {
            // Faremos a filtragem puramente no Front-end baseada nas dimensões já carregadas pelo dashboard_resumo
            // Isso evita completamente os erros 403 Forbidden e torna a interface instantânea
            setSubPracas(processFallbackSubPracas(dimensoes, targetPracas));
            setTurnos(mapToOptions((dimensoes as any).turnos));
            setOrigens(mapToOptions(dimensoes.origens));
        } else {
            // Sem restrição ou praça selecionada (Admin visão global)
            setSubPracas(mapToOptions(dimensoes.sub_pracas));
            setTurnos(mapToOptions((dimensoes as any).turnos));
            setOrigens(mapToOptions(dimensoes.origens));
        }
    }, [dimensoes, currentUser, filters?.praca]);

    return { subPracas, origens, turnos };
}

// Helpers
function mapToOptions(arr: any[]) {
    return Array.isArray(arr) ? arr.map(p => ({ value: String(p), label: String(p) })) : [];
}

function processFallbackSubPracas(dimensoes: DimensoesDashboard, activePracas: string[]) {
    return mapToOptions(dimensoes.sub_pracas).filter(sp => activePracas.some(praca => sp.value.toUpperCase().includes(praca.toUpperCase()) || sp.value.toUpperCase().startsWith(praca.toUpperCase())));
}
