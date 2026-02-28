import { useState, useEffect, useRef, useCallback } from 'react';
import type { DashboardFilters } from '@/types/filters';
import type { CurrentUser } from '@/types';
import { useSessionId } from './useSessionId';
import { safeLog } from '@/lib/errorHandler';
import { getActivityDescription } from '@/utils/activity/descriptionBuilder';
import { logActivityToRpc } from '@/utils/activity/activityLogger';

export function useUserActivity(
  activeTab: string,
  filters: DashboardFilters | Record<string, unknown>,
  currentUser: CurrentUser | null
) {
  const [isPageVisible, setIsPageVisible] = useState(true);
  const sessionId = useSessionId();

  const activeTabRef = useRef(activeTab);
  const filtersRef = useRef(filters);
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    activeTabRef.current = activeTab;
    filtersRef.current = filters;
    currentUserRef.current = currentUser;
  }, [activeTab, filters, currentUser]);

  const registrarAtividade = useCallback(async (
    action_type: string,
    action_details: Record<string, unknown> | string = {},
    tab_name: string | null = null,
    filters_applied: DashboardFilters | Record<string, unknown> = {}
  ) => {
    if (!currentUserRef.current || !sessionId) return;

    try {
      const description = getActivityDescription(action_type, action_details, tab_name || activeTabRef.current, filters_applied);
      await logActivityToRpc(sessionId, action_type, description, tab_name || activeTabRef.current, filters_applied);
    } catch (err) {
      if (action_type !== 'heartbeat') safeLog.error('Erro inesperado atividade:', err);
    }
  }, [sessionId]);

  // Debounce Tab Change
  const tabTimeout = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!currentUserRef.current || !sessionId) return;
    if (tabTimeout.current) clearTimeout(tabTimeout.current);

    tabTimeout.current = setTimeout(() => {
      registrarAtividade('tab_change', { tab: activeTabRef.current }, activeTabRef.current, filtersRef.current);
    }, 150);

    return () => { if (tabTimeout.current) clearTimeout(tabTimeout.current); };
  }, [activeTab, sessionId, registrarAtividade]);

  // Filter Change (com debounce para evitar chamadas excessivas)
  const filterTimeout = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!currentUserRef.current || !sessionId) return;

    if (filterTimeout.current) clearTimeout(filterTimeout.current);

    const hasActiveFilters = Object.values(filtersRef.current).some(v => v != null && (Array.isArray(v) ? v.length > 0 : true));
    if (hasActiveFilters) {
      filterTimeout.current = setTimeout(() => {
        registrarAtividade('filter_change', { filters: filtersRef.current }, activeTabRef.current, filtersRef.current);
      }, 300);
    }

    return () => { if (filterTimeout.current) clearTimeout(filterTimeout.current); };
  }, [filters, sessionId, registrarAtividade]);

  // Visibility
  useEffect(() => {
    if (!sessionId) return;
    const handleVisibility = () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);
      if (currentUserRef.current && sessionId) {
        registrarAtividade(visible ? 'page_visible' : 'page_hidden', {}, activeTabRef.current, filtersRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [sessionId, registrarAtividade]);

  // Login & Heartbeat
  useEffect(() => {
    if (!currentUserRef.current || !sessionId) return;

    const loginTimeout = setTimeout(() => registrarAtividade('login', { dispositivo: 'web' }, activeTabRef.current, filtersRef.current), 500);

    const heartbeat = setInterval(() => {
      if (currentUserRef.current && isPageVisible && sessionId) registrarAtividade('heartbeat', {}, activeTabRef.current, filtersRef.current);
    }, 60000);

    return () => { clearTimeout(loginTimeout); clearInterval(heartbeat); };
  }, [currentUser, isPageVisible, sessionId, registrarAtividade]);

  return { sessionId, isPageVisible, registrarAtividade };
}
