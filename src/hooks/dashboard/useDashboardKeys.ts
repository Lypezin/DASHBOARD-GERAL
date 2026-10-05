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
    // Location values may contain `|` themselves. JSON keeps these keys
    // lossless when the arrays are stabilized below.
    const subPracasKey = createRequestKey(subPracas);
    const origensKey = createRequestKey(origens);
    const turnosKey = createRequestKey(turnos);
    const semanasKey = createRequestKey(semanas);
    const currentUserId = currentUser?.id || '';
    const isCurrentUserAdmin = currentUser?.is_admin ?? false;
    const currentUserRole = currentUser?.role;
    const currentUserOrganizationId = currentUser?.organization_id ?? null;
    const assignedPracasKey = createRequestKey(currentUser?.assigned_pracas || []);
    const stableSubPracas = useMemo(() => JSON.parse(subPracasKey) as string[], [subPracasKey]);
    const stableOrigens = useMemo(() => JSON.parse(origensKey) as string[], [origensKey]);
    const stableTurnos = useMemo(() => JSON.parse(turnosKey) as string[], [turnosKey]);
    const stableSemanas = useMemo(() => JSON.parse(semanasKey) as number[], [semanasKey]);
    const stableAssignedPracas = useMemo(() => JSON.parse(assignedPracasKey) as string[], [assignedPracasKey]);

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
        subPracas: stableSubPracas,
        origens: stableOrigens,
        turnos: stableTurnos,
        semanas: stableSemanas,
        filtroModo,
        dataInicial,
        dataFinal
    }), [ano, dataFinal, dataInicial, filtroModo, origem, praca, semana, stableOrigens, stableSemanas, stableSubPracas, stableTurnos, subPraca, turno]);
    const stableCurrentUser = useMemo(() => currentUserKey !== 'null' ? ({
        id: currentUserId,
        is_admin: isCurrentUserAdmin,
        assigned_pracas: stableAssignedPracas,
        role: currentUserRole,
        organization_id: currentUserOrganizationId
    }) : null, [currentUserId, currentUserKey, currentUserOrganizationId, currentUserRole, isCurrentUserAdmin, stableAssignedPracas]);

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
