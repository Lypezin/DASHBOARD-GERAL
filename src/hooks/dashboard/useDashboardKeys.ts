import { useMemo } from 'react';
import { Filters, CurrentUser } from '@/types';
import { buildFilterPayload } from '@/utils/filters/payloadBuilder';
import { safeLog } from '@/lib/errorHandler';
import { useOrganization } from '@/contexts/OrganizationContext';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useDashboardKeys(initialFilters: Filters, currentUser?: CurrentUser | null) {
    const { organizationId } = useOrganization();
    const subPracasKey = initialFilters.subPracas.join('|');
    const origensKey = initialFilters.origens.join('|');
    const turnosKey = initialFilters.turnos.join('|');
    const semanasKey = initialFilters.semanas.join('|');
    const assignedPracasKey = currentUser?.assigned_pracas?.join('|') || '';

    const filtersKey = useMemo(() => {
        return JSON.stringify({
            ano: initialFilters.ano,
            semana: initialFilters.semana,
            praca: initialFilters.praca,
            subPraca: initialFilters.subPraca,
            origem: initialFilters.origem,
            turno: initialFilters.turno,
            subPracas: subPracasKey,
            origens: origensKey,
            turnos: turnosKey,
            semanas: semanasKey,
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
        subPracasKey,
        origensKey,
        turnosKey,
        semanasKey,
        initialFilters.filtroModo,
        initialFilters.dataInicial,
        initialFilters.dataFinal,
    ]);

    const currentUserKey = useMemo(() => {
        return currentUser ? JSON.stringify({
            is_admin: currentUser.is_admin,
            assigned_pracas: assignedPracasKey,
            organization_id: organizationId // Include organizationId in key
        }) : 'null';
    }, [currentUser?.is_admin, assignedPracasKey, organizationId]);

    const stableFilters = useMemo(() => initialFilters, [filtersKey]);
    const stableCurrentUser = useMemo(() => currentUser, [currentUserKey]);

    const filterPayload = useMemo(() => {
        if (IS_DEV) {
            try {
                safeLog.info('[useDashboardKeys] Gerando payload', {
                    filters: { ...stableFilters },
                    user_set: !!stableCurrentUser,
                    organizationId
                });
            } catch (e) { /* ignore */ }
        }
        return buildFilterPayload(stableFilters, stableCurrentUser, organizationId);
    }, [organizationId, stableCurrentUser, stableFilters]);

    const filterPayloadKey = useMemo(() => JSON.stringify(filterPayload), [filterPayload]);

    return { filtersKey, currentUserKey, filterPayload, filterPayloadKey };
}
