import { NextResponse } from 'next/server';
import { hasElevatedRole, loadCurrentUserProfile, type CurrentUserProfile } from '@/app/api/_shared/currentUserProfile';
import { createServiceRoleClient } from '@/utils/supabase/admin';

export const runtime = 'nodejs';

const CITY_UPDATES_CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_CITY_UPDATES_CACHE_ENTRIES = 32;
const cityUpdatesCache = new Map<string, { data: unknown[]; expiresAt: number }>();
const cityUpdatesInFlight = new Map<string, Promise<unknown[]>>();

function getCachedCityUpdates(cacheKey: string) {
    const cached = cityUpdatesCache.get(cacheKey);
    if (!cached) return null;

    if (cached.expiresAt <= Date.now()) {
        cityUpdatesCache.delete(cacheKey);
        return null;
    }

    cityUpdatesCache.delete(cacheKey);
    cityUpdatesCache.set(cacheKey, cached);
    return cached.data;
}

function setCachedCityUpdates(cacheKey: string, data: unknown[]) {
    const now = Date.now();
    for (const [key, entry] of cityUpdatesCache.entries()) {
        if (entry.expiresAt <= now) cityUpdatesCache.delete(key);
    }

    cityUpdatesCache.delete(cacheKey);
    while (cityUpdatesCache.size >= MAX_CITY_UPDATES_CACHE_ENTRIES) {
        const oldestKey = cityUpdatesCache.keys().next().value;
        if (!oldestKey) break;
        cityUpdatesCache.delete(oldestKey);
    }

    cityUpdatesCache.set(cacheKey, {
        data,
        expiresAt: now + CITY_UPDATES_CACHE_TTL_MS,
    });
}

function jsonResponse(data: unknown, error: string | null, status = 200) {
    return NextResponse.json({ data, error }, {
        status,
        headers: { 'Cache-Control': 'private, no-store' },
    });
}

function normalizeCity(value: unknown) {
    return String(value || '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .toUpperCase();
}

function filterUpdatesForProfile(rows: unknown[], profile: CurrentUserProfile) {
    const role = String(profile.role || '').toLowerCase();
    if (hasElevatedRole(profile) || role === 'marketing') return rows;

    const allowedCities = new Set((profile.assigned_pracas || []).map(normalizeCity).filter(Boolean));
    if (allowedCities.size === 0) return [];

    return rows.filter((row) => {
        if (!row || typeof row !== 'object' || !('city' in row)) return false;
        return allowedCities.has(normalizeCity(row.city));
    });
}

export async function GET() {
    const auth = await loadCurrentUserProfile({ requireApproved: true });
    if ('failure' in auth) {
        return jsonResponse(null, auth.failure.message, auth.failure.status);
    }

    const organizationId = auth.profile.organization_id || null;
    const cacheKey = organizationId || 'no-org';
    const cached = getCachedCityUpdates(cacheKey);

    if (cached) {
        return jsonResponse(filterUpdatesForProfile(cached, auth.profile), null);
    }

    let request = cityUpdatesInFlight.get(cacheKey);
    if (!request) {
        request = (async () => {
            const supabase = createServiceRoleClient();
            const { data, error } = await supabase.rpc('get_city_last_updates', {
                p_organization_id: organizationId,
            });

            if (error) {
                throw Object.assign(new Error(error.message), { details: error });
            }

            const updates = Array.isArray(data) ? data : [];
            setCachedCityUpdates(cacheKey, updates);
            return updates;
        })().finally(() => {
            if (cityUpdatesInFlight.get(cacheKey) === request) {
                cityUpdatesInFlight.delete(cacheKey);
            }
        });
        cityUpdatesInFlight.set(cacheKey, request);
    }

    try {
        const updates = await request;
        return jsonResponse(filterUpdatesForProfile(updates, auth.profile), null);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao consultar atualizações das cidades.';
        const details = typeof error === 'object' && error !== null && 'details' in error
            ? (error as { details: unknown }).details
            : error;

        return NextResponse.json({ data: null, error: message, details }, {
            status: 500,
            headers: { 'Cache-Control': 'private, no-store' },
        });
    }
}
