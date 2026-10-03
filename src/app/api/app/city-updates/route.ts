import { NextResponse } from 'next/server';
import { hasElevatedRole, loadCurrentUserProfile, type CurrentUserProfile } from '@/app/api/_shared/currentUserProfile';
import { createServiceRoleClient } from '@/utils/supabase/admin';

export const runtime = 'nodejs';

const CITY_UPDATES_CACHE_TTL_MS = 30 * 60 * 1000;
const cityUpdatesCache = new Map<string, { data: unknown[]; expiresAt: number }>();

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
    const cached = cityUpdatesCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
        return jsonResponse(filterUpdatesForProfile(cached.data, auth.profile), null);
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.rpc('get_city_last_updates', {
        p_organization_id: organizationId,
    });

    if (error) {
        return NextResponse.json({ data: null, error: error.message, details: error }, {
            status: 500,
            headers: { 'Cache-Control': 'private, no-store' },
        });
    }

    const updates = Array.isArray(data) ? data : [];
    cityUpdatesCache.set(cacheKey, {
        data: updates,
        expiresAt: Date.now() + CITY_UPDATES_CACHE_TTL_MS,
    });

    return jsonResponse(filterUpdatesForProfile(updates, auth.profile), null);
}
