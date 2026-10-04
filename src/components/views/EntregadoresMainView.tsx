'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useTabData } from '@/hooks/data/useTabData';
import { useTabDataMapper } from '@/hooks/data/useTabDataMapper';
import { useDebouncedValue } from '@/hooks/ui/useDebouncedValue';
import { useUrlSearchSync } from '@/hooks/ui/useUrlSearchSync';
import type { CurrentUser } from '@/types';
import type { FilterPayload } from '@/types/filters';

import { EntregadoresMainContent } from './entregadores/EntregadoresMainContent';
import { buildEntregadoresSearchPayload } from './entregadores/utils/entregadoresHelpers';
import { createAccessScopeKey } from '@/utils/request/createAccessScopeKey';
import { createRequestKey } from '@/utils/request/createRequestKey';
import type { EntregadoresSortField } from '@/types';
import { VALID_SORT_FIELDS } from './entregadores/hooks/useEntregadoresMainSort';

const EntregadoresMainView = React.memo(function EntregadoresMainView({
  filterPayload,
  currentUser,
  variant = 'entregadores',
}: {
  filterPayload: FilterPayload;
  currentUser: CurrentUser | null;
  variant?: 'entregadores' | 'dedicado';
}) {
  const isDedicado = variant === 'dedicado';
  const searchParams = useSearchParams();
  const searchFromUrl = searchParams.get('ent_search') || '';
  const [searchTerm, setSearchTerm] = React.useState(searchFromUrl);
  const normalizedSearchTerm = searchTerm.trim();
  const shouldPromoteSearch = normalizedSearchTerm.length >= 3 || normalizedSearchTerm.length === 0;
  const serverSearch = useDebouncedValue(searchTerm, 350);
  const normalizedServerSearch = serverSearch.trim();
  const isSearchSyncing = !isDedicado
    && normalizedSearchTerm !== normalizedServerSearch;
  const [serverSortField, setServerSortField] = React.useState<EntregadoresSortField>(() => {
    const sort = searchParams.get('ent_sort');
    return sort && VALID_SORT_FIELDS.includes(sort as EntregadoresSortField)
      ? sort as EntregadoresSortField
      : 'aderencia_percentual';
  });
  const [serverSortDirection, setServerSortDirection] = React.useState<'asc' | 'desc'>(
    searchParams.get('ent_dir') === 'asc' ? 'asc' : 'desc'
  );
  const [showInactiveOnly, setShowInactiveOnly] = React.useState(false);

  React.useEffect(() => {
    setSearchTerm(searchFromUrl);
  }, [searchFromUrl]);

  useUrlSearchSync('ent_search', searchTerm, 250, !isDedicado && shouldPromoteSearch);

  const filterResetKey = React.useMemo(
    () => createRequestKey({ filterPayload, search: normalizedServerSearch, isDedicado }),
    [filterPayload, isDedicado, normalizedServerSearch]
  );
  const [serverPagination, setServerPagination] = React.useState(() => ({ scopeKey: filterResetKey, page: 1 }));
  const serverPage = serverPagination.scopeKey === filterResetKey ? serverPagination.page : 1;
  const setServerPage = React.useCallback((page: number) => {
    setServerPagination({ scopeKey: filterResetKey, page });
  }, [filterResetKey]);

  const handleSearchChange = React.useCallback((term: string) => {
    setSearchTerm(term);
    setServerPage(1);
  }, [setServerPage]);

  const handleServerViewChange = React.useCallback((view: {
    sortField: EntregadoresSortField;
    sortDirection: 'asc' | 'desc';
    showInactiveOnly: boolean;
  }) => {
    setServerSortField(view.sortField);
    setServerSortDirection(view.sortDirection);
    setShowInactiveOnly(view.showInactiveOnly);
    setServerPage(1);
  }, [setServerPage]);

  const dedicatedPayload = React.useMemo<FilterPayload>(() => {
    if (!isDedicado) {
      const search = normalizedServerSearch;
      return {
        ...buildEntregadoresSearchPayload(filterPayload, search),
        p_search: search || null,
        p_limit: -1,
        p_page: serverPage,
        p_sort_field: serverSortField,
        p_sort_direction: serverSortDirection,
        p_only_inactive: showInactiveOnly,
      };
    }

    return {
      ...filterPayload,
    };
  }, [filterPayload, isDedicado, normalizedServerSearch, serverPage, serverSortDirection, serverSortField, showInactiveOnly]);

  const activeTab = isDedicado ? 'dedicado' : 'entregadores';
  const { data: tabData, loading, error, retry } = useTabData(activeTab, dedicatedPayload, currentUser);
  const requestScopeKey = createAccessScopeKey(currentUser, dedicatedPayload.p_organization_id);
  const { entregadoresData } = useTabDataMapper({ activeTab, tabData });

  return (
    <EntregadoresMainContent
      entregadoresData={entregadoresData}
      loading={loading}
      error={error}
      onRetry={retry}
      isRefreshing={isSearchSyncing}
      searchTerm={searchTerm}
      onSearchChange={handleSearchChange}
      variant={variant}
      filterPayload={dedicatedPayload}
      requestScopeKey={requestScopeKey}
      serverPage={isDedicado ? undefined : {
        currentPage: serverPage,
        pageSize: entregadoresData?.page_size || 24,
        onPageChange: setServerPage,
      }}
      onServerViewChange={isDedicado ? undefined : handleServerViewChange}
    />
  );
});

EntregadoresMainView.displayName = 'EntregadoresMainView';

export default EntregadoresMainView;
