import { NextResponse } from 'next/server';
import { loadCurrentUserProfile } from '@/app/api/_shared/currentUserProfile';
import {
  createServiceRoleClient,
  getServiceRoleConfigErrorPayload,
  isServiceRoleConfigError,
} from '@/utils/supabase/admin';
import { processActiveUsers, processTopPages, processUserTime } from '@/hooks/admin/monitoringTransformers';
import type { ActivityLog, MonitoringStats, UserProfile } from '@/hooks/admin/types';

export const runtime = 'nodejs';

const ACTIVITY_LOG_LIMIT = 2000;

const DEFAULT_STATS: MonitoringStats = {
  activeUsers: [],
  topPages: [],
  userTime: [],
  summary: {
    totalVisits: 0,
    totalTimeSeconds: 0,
    uniqueUsers24h: 0,
    activeUsersNow: 0,
    monitoredPages: 0,
  },
};

export async function GET() {
  try {
    const auth = await loadCurrentUserProfile({
      requireApproved: true,
      requireElevatedRole: true,
      notApprovedMessage: 'Usuario ainda nao aprovado.',
      forbiddenMessage: 'Usuario sem permissao administrativa para monitoramento.',
    });

    if ('failure' in auth) {
      return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
    }

    const admin = createServiceRoleClient();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: logsData, error: logsError } = await admin
      .from('user_activity_logs')
      .select('id, user_id, entered_at, last_seen, exited_at, path, duration_seconds')
      .gte('entered_at', since)
      .order('entered_at', { ascending: false })
      .limit(ACTIVITY_LOG_LIMIT);

    if (logsError) {
      return NextResponse.json({ data: null, error: logsError.message, details: logsError }, { status: 500 });
    }

    const logs = (Array.isArray(logsData) ? logsData : []) as ActivityLog[];
    if (logs.length === 0) {
      return NextResponse.json({ data: DEFAULT_STATS, error: null, lastUpdated: new Date().toISOString() });
    }

    const userIds = Array.from(new Set(logs.map((log) => log.user_id).filter(Boolean)));
    const profileMap = new Map<string, UserProfile>();

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await admin
        .from('user_profiles')
        .select('id, full_name, avatar_url, email')
        .in('id', userIds);

      if (profilesError) {
        return NextResponse.json({ data: null, error: profilesError.message, details: profilesError }, { status: 500 });
      }

      (profiles || []).forEach((profile) => {
        profileMap.set(profile.id, profile);
      });
    }

    const activeUsers = processActiveUsers(logs, profileMap);
    const topPages = processTopPages(logs);
    const userTime = processUserTime(logs, profileMap);
    const totalVisits = userTime.reduce((acc, item) => acc + item.totalVisits, 0);
    const totalTimeSeconds = userTime.reduce((acc, item) => acc + item.totalTimeSeconds, 0);

    const stats: MonitoringStats = {
      activeUsers,
      topPages,
      userTime,
      summary: {
        totalVisits,
        totalTimeSeconds,
        uniqueUsers24h: userIds.length,
        activeUsersNow: activeUsers.length,
        monitoredPages: topPages.length,
      },
    };

    return NextResponse.json({ data: stats, error: null, lastUpdated: new Date().toISOString() });
  } catch (error) {
    if (isServiceRoleConfigError(error)) {
      const payload = getServiceRoleConfigErrorPayload();
      return NextResponse.json({ data: null, error: payload.error, code: payload.code }, { status: 503 });
    }

    const message = error instanceof Error ? error.message : 'Erro ao carregar monitoramento.';
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
