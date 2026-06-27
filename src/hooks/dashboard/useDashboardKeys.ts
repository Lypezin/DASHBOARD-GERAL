import { useMemo } from 'react';
import { Filters, CurrentUser } from '@/types';
import { buildFilterPayload } from '@/utils/filters/payloadBuilder';
import { safeLog } from '@/lib/errorHandler';
import { useOrganization } from '@/contexts/OrganizationContext';
import { createRequestKey } from '@/utils/request/createRequestKey';
import { IS_DEV } from '@/constants/environment';


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
        return createRequestKey({
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

    const effectiveOrganizationId = organizationId || currentUserOrganizationId;

    const currentUserKey = useMemo(() => {
        return currentUser ? createRequestKey({
            id: currentUserId,
            is_admin: isCurrentUserAdmin,
            role: currentUserRole,
            assigned_pracas: assignedPracasKey,
            organization_id: currentUserOrganizationId,
            context_organization_id: effectiveOrganizationId
        }) : 'null';
    }, [assignedPracasKey, currentUser, currentUserId, currentUserOrganizationId, currentUserRole, effectiveOrganizationId, isCurrentUserAdmin]);

    const stableFilters = useMemo<Filters>(() => ({
        ano,
        semana,
        praca,
        subPraca,
        origem,
        turno,
        subPracas: subPracasKey ? subPracasKey.split('|') : [],
        origens: origensKey ? origensKey.split('|') : [],
        turnos: turnosKey ? turnosKey.split('|') : [],
        semanas: (semanasKey ? semanasKey.split('|') : [])
            .map((value): number => Number(value))
            .filter((value): value is number => Number.isFinite(value)),
        filtroModo,
        dataInicial,
        dataFinal
    }), [ano, dataFinal, dataInicial, filtroModo, origem, origensKey, praca, semana, semanasKey, subPraca, subPracasKey, turno, turnosKey]);
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
                    organizationId: effectiveOrganizationId
                });
            } catch (e) { /* ignore */ }
        }
        return buildFilterPayload(stableFilters, stableCurrentUser, effectiveOrganizationId);
    }, [effectiveOrganizationId, stableCurrentUser, stableFilters]);

    const filterPayloadKey = useMemo(() => createRequestKey(filterPayload), [filterPayload]);

    return { filtersKey, currentUserKey, filterPayload, filterPayloadKey };
}
