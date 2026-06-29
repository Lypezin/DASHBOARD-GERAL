import { NextResponse } from 'next/server';
import { loadCurrentUserProfile, hasElevatedRole } from '@/app/api/_shared/currentUserProfile';
import { createServiceRoleClient, getServiceRoleConfigErrorPayload, isServiceRoleConfigError } from '@/utils/supabase/admin';
import { ALLOWED_RPC, FULL_CITY_ACCESS_ONLY } from './constants';
import { asParams, clampPagination, getInternalScopedPracas, stripInternalParams, mergeDashboardResumoResults } from './utils';
import { resolveSecureRpcWithCache } from './cache';
import { ensureAuthorizedOrganization, ensurePracaScope, filterPracasResult } from './authScope';
import { hasFullCityAccess } from './utils';

export const runtime = 'nodejs';

type SecureRpcBody = {
  functionName?: unknown;
  params?: unknown;
};

export async function POST(request: Request) {
  try {
    const auth = await loadCurrentUserProfile({
      requireApproved: true,
      notApprovedMessage: 'Usuário ainda não aprovado.',
    });

    if ('failure' in auth) {
      return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
    }

    const body = await request.json().catch(() => null) as SecureRpcBody | null;
    const functionName = typeof body?.functionName === 'string' ? body.functionName : '';

    if (!ALLOWED_RPC.has(functionName)) {
      return NextResponse.json({ data: null, error: 'RPC protegida não permitida.' }, { status: 400 });
    }

    if (functionName === 'get_current_user_profile') {
      return NextResponse.json({ data: auth.profile, error: null });
    }

    if (functionName === 'is_global_admin') {
      return NextResponse.json({ data: hasElevatedRole(auth.profile), error: null });
    }

    if (FULL_CITY_ACCESS_ONLY.has(functionName) && !hasFullCityAccess(auth.profile)) {
      return NextResponse.json({ data: null, error: 'Usuário sem permissão para esta consulta.' }, { status: 403 });
    }

    let params = clampPagination(asParams(body?.params));
    const orgScope = ensureAuthorizedOrganization(functionName, params, auth.profile);
    if (orgScope.error) {
      return NextResponse.json({ data: null, error: orgScope.error }, { status: 403 });
    }

    params = orgScope.params || params;
    const pracaScope = ensurePracaScope(functionName, params, auth.profile);
    if (pracaScope.error) {
      return NextResponse.json({ data: null, error: pracaScope.error }, { status: 403 });
    }

    params = pracaScope.params || params;

    const admin = createServiceRoleClient();
    const { data, cached, stale } = await resolveSecureRpcWithCache(functionName, params, auth.profile, async () => {
      const scopedPracas = functionName === 'dashboard_resumo' ? getInternalScopedPracas(params) : [];

      if (functionName === 'dashboard_resumo' && scopedPracas.length > 1) {
        const baseParams = stripInternalParams(params);
        
        // Mantemos o Promise.all no dashboard_resumo que processa as praças filtradas em escopo, pois isso precisaria de mudança no banco para consertar definitivamente o N+1.
        // Se houverem muitos elementos, processar em lotes (batch) seria a solução mas a quantia de pracas por usuário geralmente é pequena.
        const results = await Promise.all(scopedPracas.map(async (praca) => {
          const { data: rpcData, error } = await admin.rpc(functionName, {
            ...baseParams,
            p_praca: praca,
          });

          if (error) {
            throw new Error(`Erro em ${praca}: ${error.message}`);
          }

          return rpcData ?? null;
        }));

        return mergeDashboardResumoResults(results);
      }

      const rpcParams = stripInternalParams(params);
      const { data: rpcData, error } = await admin.rpc(functionName, rpcParams);

      if (error) {
        throw new Error(error.message);
      }

      return functionName === 'list_pracas_disponiveis'
        ? filterPracasResult(rpcData, auth.profile)
        : rpcData ?? null;
    });

    return NextResponse.json({
      data,
      error: null,
      cached,
      stale,
    });
  } catch (error) {
    if (isServiceRoleConfigError(error)) {
      const payload = getServiceRoleConfigErrorPayload();
      return NextResponse.json({ data: null, error: payload.error, code: payload.code }, { status: 503 });
    }

    const message = error instanceof Error ? error.message : 'Erro ao executar RPC protegida.';
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
