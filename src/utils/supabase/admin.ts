import 'server-only';
import { createClient } from '@supabase/supabase-js';

export const SERVICE_ROLE_CONFIG_ERROR_CODE = 'SERVER_SUPABASE_SERVICE_ROLE_MISSING';

const SERVICE_ROLE_ENV_NAMES = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_ROLE',
    'SUPABASE_SERVICE_KEY',
    'SUPABASE_SERVICE_ROLE_SECRET'
] as const;

export class ServiceRoleConfigError extends Error {
    readonly code = SERVICE_ROLE_CONFIG_ERROR_CODE;
    readonly missing: string[];

    constructor(missing: string[]) {
        super(
            `Supabase server configuration is incomplete. Missing: ${missing.join(', ')}.`
        );
        this.name = 'ServiceRoleConfigError';
        this.missing = missing;
    }
}

function readEnv(name: string) {
    const value = process.env[name]?.trim();
    return value || undefined;
}

function readServiceRoleKey() {
    for (const name of SERVICE_ROLE_ENV_NAMES) {
        const value = readEnv(name);
        if (value) return value;
    }

    return undefined;
}

export function getServiceRoleConfigStatus() {
    const { supabaseUrl, serviceRoleKey, missing } = readServiceRoleConfig();

    return {
        isConfigured: missing.length === 0,
        supabaseUrl,
        serviceRoleKeyConfigured: Boolean(serviceRoleKey),
        missing,
        acceptedServiceRoleEnvNames: [...SERVICE_ROLE_ENV_NAMES]
    };
}

function readServiceRoleConfig() {
    const supabaseUrl = readEnv('NEXT_PUBLIC_SUPABASE_URL');
    const serviceRoleKey = readServiceRoleKey();
    const missing: string[] = [];

    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!serviceRoleKey) missing.push(SERVICE_ROLE_ENV_NAMES.join(' or '));

    return {
        supabaseUrl,
        serviceRoleKey,
        missing
    };
}

export function isServiceRoleConfigError(error: unknown): error is ServiceRoleConfigError {
    return error instanceof ServiceRoleConfigError ||
        (typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            (error as { code?: unknown }).code === SERVICE_ROLE_CONFIG_ERROR_CODE);
}

export function getServiceRoleConfigErrorPayload() {
    return {
        success: false,
        code: SERVICE_ROLE_CONFIG_ERROR_CODE,
        error: 'Configuração do servidor incompleta. No ambiente local, adicione SUPABASE_SERVICE_ROLE_KEY ao .env.local e reinicie npm run dev. Em produção, configure essa variável no provedor e faça um novo deploy. Não use o prefixo NEXT_PUBLIC_.',
        accepted_env_names: [...SERVICE_ROLE_ENV_NAMES]
    };
}

export function createServiceRoleClient() {
    const { supabaseUrl, serviceRoleKey, missing } = readServiceRoleConfig();

    if (!supabaseUrl || !serviceRoleKey) {
        throw new ServiceRoleConfigError(missing);
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
