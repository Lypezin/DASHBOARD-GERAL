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
  const serverSearch = useDebouncedValue(searchTerm, 350, shouldPromoteSearch);
  const normalizedServerSearch = serverSearch.trim();
  const isSearchSyncing = !isDedicado
    && shouldPromoteSearch
    && normalizedSearchTerm !== normalizedServerSearch;

  React.useEffect(() => {
    setSearchTerm(searchFromUrl);
  }, [searchFromUrl]);

  useUrlSearchSync('ent_search', searchTerm, 250, !isDedicado && shouldPromoteSearch);

  const handleSearchChange = React.useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const dedicatedPayload = React.useMemo<FilterPayload>(() => {
    if (!isDedicado) {
      const search = normalizedServerSearch;
      if (search.length < 3) return filterPayload;
      return buildEntregadoresSearchPayload(filterPayload, search);
    }

    return {
      ...filterPayload,
    };
  }, [filterPayload, isDedicado, normalizedServerSearch]);

  const activeTab = isDedicado ? 'dedicado' : 'entregadores';
  const { data: tabData, loading } = useTabData(activeTab, dedicatedPayload, currentUser);
  const { entregadoresData } = useTabDataMapper({ activeTab, tabData });

  return (
    <EntregadoresMainContent
      entregadoresData={entregadoresData}
      loading={loading}
      isRefreshing={isSearchSyncing}
      searchTerm={searchTerm}
      onSearchChange={handleSearchChange}
      variant={variant}
      filterPayload={dedicatedPayload}
    />
  );
});

EntregadoresMainView.displayName = 'EntregadoresMainView';

export default EntregadoresMainView;
