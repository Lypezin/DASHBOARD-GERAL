import { useState, useEffect, useRef, useCallback } from 'react';
import type { DashboardFilters } from '@/types/filters';
import type { CurrentUser } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { getActivityDescription } from '@/utils/activity/descriptionBuilder';
import { logActivityToRpc } from '@/utils/activity/activityLogger';

function serializeActivityFilters(filters: DashboardFilters | Record<string, unknown>) {
  const values = filters as Record<string, unknown>;

  const normalizeArray = (value: unknown) =>
    Array.isArray(value) ? value.join('|') : '';

  return [
    values.ano ?? '',
    values.semana ?? '',
    values.praca ?? '',
    values.subPraca ?? values.sub_praca ?? '',
    values.origem ?? '',
    values.turno ?? '',
    values.filtroModo ?? values.filtro_modo ?? '',
    values.dataInicial ?? values.data_inicial ?? '',
    values.dataFinal ?? values.data_final ?? '',
    normalizeArray(values.semanas),
    normalizeArray(values.subPracas ?? values.sub_pracas),
    normalizeArray(values.origens),
    normalizeArray(values.turnos),
  ].join('::');
}

export function useUserActivity(
  activeTab: string,
  filters: DashboardFilters | Record<string, unknown>,
  currentUser: CurrentUser | null
) {
  const [isPageVisible, setIsPageVisible] = useState(true);
  const sessionId = currentUser?.id ?? '';

  const activeTabRef = useRef(activeTab);
  const filtersRef = useRef(filters);
  const currentUserRef = useRef(currentUser);
  const lastTrackedTabRef = useRef<string | null>(null);
  const lastTrackedFiltersRef = useRef('');
  const loginTrackedForUserRef = useRef('');

  useEffect(() => {
    activeTabRef.current = activeTab;
    filtersRef.current = filters;
    currentUserRef.current = currentUser;
  }, [activeTab, filters, currentUser]);

  const registrarAtividade = useCallback(async (action_type: string, action_details: Record<string, unknown> | string = {}, tab_name: string | null = null, filters_applied: DashboardFilters | Record<string, unknown> = {}) => {
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

    if (lastTrackedTabRef.current === activeTabRef.current) {
      return;
    }

    tabTimeout.current = setTimeout(() => {
      registrarAtividade('tab_change', { tab: activeTabRef.current }, activeTabRef.current, filtersRef.current);
      lastTrackedTabRef.current = activeTabRef.current;
    }, 150);

    return () => { if (tabTimeout.current) clearTimeout(tabTimeout.current); };
  }, [activeTab, sessionId, registrarAtividade]);

  // Filter Change (com debounce para evitar chamadas excessivas)
  const filterTimeout = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!currentUserRef.current || !sessionId) return;

    if (filterTimeout.current) clearTimeout(filterTimeout.current);

    const currentFiltersKey = serializeActivityFilters(filtersRef.current);
    if (lastTrackedFiltersRef.current === currentFiltersKey) {
      return;
    }

    const hasActiveFilters = Object.values(filtersRef.current).some(v => v != null && (Array.isArray(v) ? v.length > 0 : true));
    if (!hasActiveFilters && lastTrackedFiltersRef.current === '') {
      lastTrackedFiltersRef.current = currentFiltersKey;
      return;
    }

    filterTimeout.current = setTimeout(() => {
      registrarAtividade('filter_change', { filters: filtersRef.current }, activeTabRef.current, filtersRef.current);
      lastTrackedFiltersRef.current = currentFiltersKey;
    }, 300);

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

    let loginTimeout: ReturnType<typeof setTimeout> | null = null;
    if (loginTrackedForUserRef.current !== sessionId) {
      loginTimeout = setTimeout(() => {
        registrarAtividade('login', { dispositivo: 'web' }, activeTabRef.current, filtersRef.current);
        loginTrackedForUserRef.current = sessionId;
      }, 500);
    }

    const heartbeat = setInterval(() => {
      if (currentUserRef.current && isPageVisible && sessionId) registrarAtividade('heartbeat', {}, activeTabRef.current, filtersRef.current);
    }, 60000);

    return () => {
      if (loginTimeout) clearTimeout(loginTimeout);
      clearInterval(heartbeat);
    };
  }, [currentUser, isPageVisible, sessionId, registrarAtividade]);

  return { sessionId, isPageVisible, registrarAtividade };
}
