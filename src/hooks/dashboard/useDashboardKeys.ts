import { useMemo } from 'react';
import { Filters, CurrentUser } from '@/types';
import { buildFilterPayload } from '@/utils/helpers';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useDashboardKeys(initialFilters: Filters, currentUser?: CurrentUser | null) {
    const filtersKey = useMemo(() => {
        return JSON.stringify({
            ano: initialFilters.ano,
            semana: initialFilters.semana,
            praca: initialFilters.praca,
            subPraca: initialFilters.subPraca,
            origem: initialFilters.origem,
            turno: initialFilters.turno,
            subPracas: initialFilters.subPracas,
            origens: initialFilters.origens,
            turnos: initialFilters.turnos,
            semanas: initialFilters.semanas,
            filtroModo: initialFilters.filtroModo,
            dataInicial: initialFilters.dataInicial,
            dataFinal: initialFilters.dataFinal,
        });
    }, [
        initialFilters.ano,
        initialFilters.semana,
        initialFilters.praca,
        initialFilters.subPraca,
        initialFilters.origem,
        initialFilters.turno,
        JSON.stringify(initialFilters.subPracas),
        JSON.stringify(initialFilters.origens),
        JSON.stringify(initialFilters.turnos),
        JSON.stringify(initialFilters.semanas),
        initialFilters.filtroModo,
        initialFilters.dataInicial,
        initialFilters.dataFinal,
    ]);

    const currentUserKey = useMemo(() => {
        return currentUser ? JSON.stringify({
            is_admin: currentUser.is_admin,
            assigned_pracas: currentUser.assigned_pracas,
        }) : 'null';
    }, [currentUser?.is_admin, currentUser?.assigned_pracas?.join(',')]);

    const filterPayload = useMemo(() => {
        if (IS_DEV) {
            try {
                safeLog.info('[useDashboardKeys] Gerando payload', {
                    filters: { ...initialFilters },
                    user_set: !!currentUser
                });
            } catch (e) { /* ignore */ }
        }
        return buildFilterPayload(initialFilters, currentUser);
    }, [filtersKey, currentUserKey]);

    return { filtersKey, currentUserKey, filterPayload };
}
