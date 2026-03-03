'use client';

import { useUserActivity } from '@/hooks/auth/useUserActivity';
import type { DashboardFilters } from '@/types/filters';
import type { CurrentUser } from '@/types';

interface ActivityTrackerProps {
    activeTab: string;
    filters: DashboardFilters | Record<string, unknown>;
    currentUser: CurrentUser | null;
}

/**
 * Componente invisível (UI-less) cujo único propósito é instanciar o 
 * useUserActivity.
 * Isso evita que mudanças no estado de visibilidade da janela (isPageVisible)
 * disparem re-renders em todo o Dashboard principal (useDashboardPage).
 */
export function ActivityTracker({ activeTab, filters, currentUser }: ActivityTrackerProps) {
    useUserActivity(activeTab, filters, currentUser);
    return null;
}
