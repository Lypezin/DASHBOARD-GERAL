import { CurrentUserProfile, hasElevatedRole } from '@/app/api/_shared/currentUserProfile';
import { ORG_PARAM_BY_RPC, RPCS_WITHOUT_CITY_SCOPE, RPCS_SUPPORTING_PRACAS_ARRAY, INTERNAL_SCOPED_PRACAS_PARAM, UUID_RE } from './constants';
import { hasFullCityAccess, uniquePracas, splitPracas, normalizePracaKey } from './utils';
import { normalizeAssignedPracas } from './cache';

export function ensureAuthorizedOrganization(
  functionName: string,
  params: Record<string, unknown>,
  profile: CurrentUserProfile
) {
  const orgKey = ORG_PARAM_BY_RPC[functionName];
  if (!orgKey) return { params };

  const nextParams = { ...params };
  const profileOrgId = typeof profile.organization_id === 'string' && UUID_RE.test(profile.organization_id)
    ? profile.organization_id
    : null;
  const requestedOrgId = typeof nextParams[orgKey] === 'string' && UUID_RE.test(nextParams[orgKey] as string)
    ? nextParams[orgKey] as string
    : null;

  if (!hasElevatedRole(profile)) {
    if (!profileOrgId) {
      return { error: 'Organização inválida para este usuário.' };
    }

    nextParams[orgKey] = profileOrgId;
    return { params: nextParams };
  }

  if (
    typeof nextParams[orgKey] === 'string' &&
    String(nextParams[orgKey]).trim() &&
    !requestedOrgId
  ) {
    return { error: 'Organização inválida para consulta.' };
  }

  return { params: nextParams };
}

export function ensurePracaScope(
  functionName: string,
  params: Record<string, unknown>,
  profile: CurrentUserProfile
) {
  if (hasFullCityAccess(profile)) return { params };
  if (RPCS_WITHOUT_CITY_SCOPE.has(functionName)) {
    const nextParams = { ...params };
    delete nextParams.p_pracas;
    return { params: nextParams };
  }

  const assigned = uniquePracas(normalizeAssignedPracas(profile));
  if (assigned.length === 0) return { params };

  const allowedByKey = new Map(assigned.map((item) => [normalizePracaKey(item), item]));
  const supportsPracasArray = RPCS_SUPPORTING_PRACAS_ARRAY.has(functionName);
  const nextParams = { ...params };
  const requestedPracas = uniquePracas([
    ...splitPracas(nextParams.p_praca),
    ...splitPracas(nextParams.p_pracas),
  ]);

  if (requestedPracas.length > 0) {
    const scoped = requestedPracas
      .map((item) => allowedByKey.get(normalizePracaKey(item)))
      .filter((item): item is string => Boolean(item));

    if (scoped.length !== requestedPracas.length) {
      return { error: 'Praça não permitida para este usuário.' };
    }

    if (supportsPracasArray) {
      nextParams.p_pracas = scoped;
      delete nextParams.p_praca;
      return { params: nextParams };
    }

    if (supportsScopedPracaFanout(functionName) && scoped.length > 1) {
      nextParams[INTERNAL_SCOPED_PRACAS_PARAM] = scoped;
      delete nextParams.p_praca;
      delete nextParams.p_pracas;
      return { params: nextParams };
    }

    if (functionName === 'dashboard_evolucao_bundle_org_year_fast' && scoped.length === 1) {
      nextParams[INTERNAL_SCOPED_PRACAS_PARAM] = scoped;
      delete nextParams.p_praca;
      delete nextParams.p_pracas;
      return { params: nextParams };
    }

    if (scoped.length === 1) {
      nextParams.p_praca = scoped[0];
      delete nextParams.p_pracas;
      return { params: nextParams };
    }

    return { error: 'Selecione uma única praça permitida para esta consulta.' };
  }

  if (supportsPracasArray) {
    nextParams.p_pracas = assigned;
    delete nextParams.p_praca;
    return { params: nextParams };
  }

  if (supportsScopedPracaFanout(functionName) && assigned.length > 1) {
    nextParams[INTERNAL_SCOPED_PRACAS_PARAM] = assigned;
    delete nextParams.p_praca;
    delete nextParams.p_pracas;
    return { params: nextParams };
  }

  if (functionName === 'dashboard_evolucao_bundle_org_year_fast' && assigned.length === 1) {
    nextParams[INTERNAL_SCOPED_PRACAS_PARAM] = assigned;
    delete nextParams.p_praca;
    delete nextParams.p_pracas;
    return { params: nextParams };
  }

  if (assigned.length === 1) {
    nextParams.p_praca = assigned[0];
    delete nextParams.p_pracas;
    return { params: nextParams };
  }

  return { error: 'Selecione uma praça permitida para esta consulta.' };
}

export function filterPracasResult(data: unknown, profile: CurrentUserProfile) {
  if (hasFullCityAccess(profile)) return data;

  const assigned = normalizeAssignedPracas(profile);
  if (assigned.length === 0 || !Array.isArray(data)) return [];

  const allowed = new Set(assigned.map(normalizePracaKey));

  return data.filter((item) => {
    const praca = typeof item === 'string'
      ? item
      : item && typeof item === 'object'
        ? String((item as Record<string, unknown>).praca || '')
        : '';

    return allowed.has(normalizePracaKey(praca));
  });
}

function supportsScopedPracaFanout(functionName: string) {
  return functionName === 'dashboard_resumo'
    || functionName === 'dashboard_evolucao_bundle'
    || functionName === 'dashboard_evolucao_bundle_org_year_fast';
}
