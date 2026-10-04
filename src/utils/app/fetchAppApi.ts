import { buildAppAuthContext, buildAppAuthHeaders } from './appAuthHeaders';
import { INTERNAL_FETCH_OPTIONS, JSON_HEADERS } from './internalFetchOptions';

type ApiErrorShape = {
    error?: string | null;
    code?: string | null;
};

type AppApiGetResult = { data: unknown | null; error: string | null };
type InFlightGetRequest = {
    promise: Promise<AppApiGetResult> | null;
    invalidated: boolean;
};

const inFlightGetRequests = new Map<string, InFlightGetRequest>();
const completedGetCache = new Map<string, { data: unknown | null; expiresAt: number }>();
const COMPLETED_GET_CACHE_TTL_MS = 10_000;
const MAX_COMPLETED_GET_CACHE_ENTRIES = 128;
const CURRENT_USER_PROFILE_PATH = '/api/app/current-user-profile';

function pruneCompletedGetCache(now = Date.now(), reserveSlot = false) {
    for (const [key, entry] of completedGetCache) {
        if (entry.expiresAt <= now) completedGetCache.delete(key);
    }

    const maxEntries = MAX_COMPLETED_GET_CACHE_ENTRIES - (reserveSlot ? 1 : 0);
    while (completedGetCache.size > maxEntries) {
        const oldestKey = completedGetCache.keys().next().value;
        if (oldestKey === undefined) break;
        completedGetCache.delete(oldestKey);
    }
}

function invalidateCachedGetPaths(paths: string[]) {
    if (paths.length === 0) return;

    const pathsToInvalidate = new Set(paths.map((path) => path.split('?')[0]));

    for (const cacheKey of completedGetCache.keys()) {
        const separatorIndex = cacheKey.indexOf('\u001f');
        const cachedPath = separatorIndex >= 0
            ? cacheKey.slice(separatorIndex + 1).split('?')[0]
            : '';

        if (pathsToInvalidate.has(cachedPath)) {
            completedGetCache.delete(cacheKey);
        }
    }

    for (const [cacheKey, request] of inFlightGetRequests) {
        const separatorIndex = cacheKey.indexOf('\u001f');
        const cachedPath = separatorIndex >= 0
            ? cacheKey.slice(separatorIndex + 1).split('?')[0]
            : '';

        if (pathsToInvalidate.has(cachedPath)) {
            // Let the old caller receive its response, but keep later callers
            // from joining it or allowing it to repopulate the fresh cache.
            request.invalidated = true;
            inFlightGetRequests.delete(cacheKey);
        }
    }
}

function getPathsAffectedByMutation(path: string, body?: Record<string, unknown>) {
    const normalizedPath = path.split('?')[0];

    if (normalizedPath === '/api/app/gamification') {
        return ['/api/app/gamification'];
    }

    if (normalizedPath === '/api/app/login-streak') {
        return [CURRENT_USER_PROFILE_PATH];
    }

    if (normalizedPath === '/api/profile/name' || normalizedPath === '/api/profile/avatar') {
        const paths = [CURRENT_USER_PROFILE_PATH];
        const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
        if (userId) paths.push(`/api/profile/public/${userId}`);
        return paths;
    }

    return [];
}

async function sendAppApiData<T>(
    method: 'POST' | 'PATCH',
    path: string,
    body?: Record<string, unknown>,
    options: { keepalive?: boolean } = {}
): Promise<{ data: T | null; error: string | null }> {
    const response = await fetch(path, {
        method,
        ...INTERNAL_FETCH_OPTIONS,
        headers: await buildAppAuthHeaders(JSON_HEADERS),
        keepalive: options.keepalive,
        body: JSON.stringify(body || {}),
    });

    const payload = await response.json().catch(() => null) as ({ data?: T | null } & ApiErrorShape) | null;

    if (!response.ok) {
        return { data: null, error: payload?.error || 'Erro ao enviar dados para API interna.' };
    }

    invalidateCachedGetPaths(getPathsAffectedByMutation(path, body));

    return { data: (payload?.data ?? null) as T | null, error: null };
}

export async function getAppApiData<T>(
    path: string,
    options: { accessToken?: string; bypassCache?: boolean } = {}
): Promise<{ data: T | null; error: string | null }> {
    const authContext = await buildAppAuthContext({}, options.accessToken);
    // City updates are filtered by profile permissions on the server; don't
    // reuse a prior plaza scope after an in-place profile change.
    const shouldCache = !options.bypassCache
        && !options.accessToken
        && path.split('?')[0] !== '/api/app/city-updates';
    const cacheKey = !shouldCache || authContext.cacheScopeKey === null
        ? null
        : `${authContext.cacheScopeKey}\u001f${path}`;
    pruneCompletedGetCache();
    const cached = cacheKey ? completedGetCache.get(cacheKey) : null;

    if (cached && cached.expiresAt > Date.now()) {
        return { data: cached.data as T | null, error: null };
    }

    if (cached) {
        completedGetCache.delete(cacheKey!);
    }

    const existingRequest = cacheKey ? inFlightGetRequests.get(cacheKey) : null;

    if (existingRequest?.promise) {
        return existingRequest.promise as Promise<{ data: T | null; error: string | null }>;
    }

    const normalizedPath = path.split('?')[0];
    const requestState: InFlightGetRequest = { promise: null, invalidated: false };
    const request = (async (): Promise<{ data: T | null; error: string | null }> => {
        const response = await fetch(path, {
            method: 'GET',
            ...INTERNAL_FETCH_OPTIONS,
            headers: authContext.headers,
        });

        const payload = await response.json().catch(() => null) as ({ data?: T | null } & ApiErrorShape) | null;

        if (!response.ok) {
            const apiError = payload?.error || 'Erro ao consultar API interna.';
            const diagnosticCode = path.split('?')[0] === CURRENT_USER_PROFILE_PATH
                ? payload?.code
                : null;
            return {
                data: null,
                error: diagnosticCode ? `${apiError} [${diagnosticCode}]` : apiError,
            };
        }

        if (!payload || typeof payload !== 'object' || !Object.prototype.hasOwnProperty.call(payload, 'data')) {
            return {
                data: null,
                error: 'A API interna retornou uma resposta vazia ou inválida.',
            };
        }

        const data = (payload?.data ?? null) as T | null;
        if (cacheKey && !requestState.invalidated) {
            pruneCompletedGetCache(Date.now(), true);
            completedGetCache.set(cacheKey, {
                data,
                expiresAt: Date.now() + COMPLETED_GET_CACHE_TTL_MS,
            });
        }

        return { data, error: null };
    })().finally(() => {
        if (cacheKey && inFlightGetRequests.get(cacheKey) === requestState) {
            inFlightGetRequests.delete(cacheKey);
        }
    });

    if (cacheKey) {
        requestState.promise = request as Promise<AppApiGetResult>;
        inFlightGetRequests.set(cacheKey, requestState);
    }
    return request;
}

export async function postAppApiData<T>(path: string, body?: Record<string, unknown>): Promise<{ data: T | null; error: string | null }> {
    return sendAppApiData<T>('POST', path, body);
}

export async function getCurrentUserProfileData<T>(accessToken?: string): Promise<{ data: T | null; error: string | null }> {
    return getAppApiData<T>(CURRENT_USER_PROFILE_PATH, {
        accessToken,
        bypassCache: Boolean(accessToken),
    });
}

export async function patchAppApiData<T>(
    path: string,
    body?: Record<string, unknown>,
    options?: { keepalive?: boolean }
): Promise<{ data: T | null; error: string | null }> {
    return sendAppApiData<T>('PATCH', path, body, options);
}
