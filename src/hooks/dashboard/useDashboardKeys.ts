import { useMemo } from 'react';
import { Filters, CurrentUser } from '@/types';
import { buildFilterPayload } from '@/utils/filters/payloadBuilder';
import { safeLog } from '@/lib/errorHandler';
import { useOrganization } from '@/contexts/OrganizationContext';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useDashboardKeys(initialFilters: Filters, currentUser?: CurrentUser | null) {
    const { organizationId } = useOrganization();
    const {
        ano,
        semana,
        praca,
        subPraca,
        origem,
        turno,
        subPracas,
        origens,
        turnos,
        semanas,
        filtroModo,
        dataInicial,
        dataFinal
    } = initialFilters;
    const subPracasKey = subPracas.join('|');
    const origensKey = origens.join('|');
    const turnosKey = turnos.join('|');
    const semanasKey = semanas.join('|');
    const currentUserId = currentUser?.id || '';
    const isCurrentUserAdmin = currentUser?.is_admin ?? false;
    const currentUserRole = currentUser?.role;
    const currentUserOrganizationId = currentUser?.organization_id ?? null;
    const assignedPracasKey = currentUser?.assigned_pracas?.join('|') || '';

    const filtersKey = useMemo(() => {
        return JSON.stringify({
            ano,
            semana,
            praca,
            subPraca,
            origem,
            turno,
            subPracas: subPracasKey,
            origens: origensKey,
            turnos: turnosKey,
            semanas: semanasKey,
            filtroModo,
            dataInicial,
            dataFinal,
        });
    }, [
        ano,
        semana,
        praca,
        subPraca,
        origem,
        turno,
        subPracasKey,
        origensKey,
        turnosKey,
        semanasKey,
        filtroModo,
        dataInicial,
        dataFinal,
    ]);

    const currentUserKey = useMemo(() => {
        return currentUser ? JSON.stringify({
            id: currentUserId,
            is_admin: isCurrentUserAdmin,
            role: currentUserRole,
            assigned_pracas: assignedPracasKey,
            organization_id: currentUserOrganizationId,
            context_organization_id: organizationId
        }) : 'null';
    }, [assignedPracasKey, currentUser, currentUserId, currentUserOrganizationId, currentUserRole, isCurrentUserAdmin, organizationId]);

    const stableFilters = useMemo(() => ({
        ano,
        semana,
        praca,
        subPraca,
        origem,
        turno,
        subPracas: [...subPracas],
        origens: [...origens],
        turnos: [...turnos],
        semanas: [...semanas],
        filtroModo,
        dataInicial,
        dataFinal
    }), [ano, dataFinal, dataInicial, filtroModo, origem, origens, praca, semana, semanas, subPraca, subPracas, turno, turnos]);
    const stableCurrentUser = useMemo(() => currentUserKey !== 'null' ? ({
        id: currentUserId,
        is_admin: isCurrentUserAdmin,
        assigned_pracas: assignedPracasKey ? assignedPracasKey.split('|') : [],
        role: currentUserRole,
        organization_id: currentUserOrganizationId
    }) : null, [assignedPracasKey, currentUserId, currentUserKey, currentUserOrganizationId, currentUserRole, isCurrentUserAdmin]);

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
