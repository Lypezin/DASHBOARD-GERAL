import { NextResponse } from 'next/server';
import { loadCurrentUserProfile } from '@/app/api/_shared/currentUserProfile';
import { safeLog } from '@/lib/errorHandler';
import { getServiceRoleConfigErrorPayload, isServiceRoleConfigError } from '@/utils/supabase/admin';

export const runtime = 'nodejs';

export async function GET() {
    try {
        const auth = await loadCurrentUserProfile();
        if ('failure' in auth) {
            return NextResponse.json({
                data: null,
                code: auth.failure.code,
                error: auth.failure.message,
            }, { status: auth.failure.status });
        }

        return NextResponse.json({ data: auth.profile, error: null });
    } catch (error) {
        if (isServiceRoleConfigError(error)) {
            const payload = getServiceRoleConfigErrorPayload();
            return NextResponse.json({
                data: null,
                code: payload.code,
                error: 'Configuração do servidor incompleta. Defina SUPABASE_SERVICE_ROLE_KEY localmente ou nas variáveis do deploy; não use o prefixo NEXT_PUBLIC_.',
            }, { status: 503 });
        }

        safeLog.error('Erro ao carregar perfil do usuário atual:', error);
        return NextResponse.json({ data: null, error: 'Erro interno ao validar o perfil do usuário.' }, { status: 500 });
    }
}
