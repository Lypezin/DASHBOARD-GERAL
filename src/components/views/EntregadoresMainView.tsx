'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { EntregadoresMainStatsCards } from './entregadores/EntregadoresMainStatsCards';
import { EntregadoresMainSearch } from './entregadores/EntregadoresMainSearch';
import { EntregadoresMainTable } from './entregadores/EntregadoresMainTable';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { useEntregadoresMainSort } from './entregadores/hooks/useEntregadoresMainSort';
import { useEntregadoresMainStats } from './entregadores/hooks/useEntregadoresMainStats';
import { EntregadoresHeader } from './entregadores/EntregadoresHeader';
import { useEntregadoresExport } from './entregadores/hooks/useEntregadoresExport';
import { useEntregadorProfile } from './entregadores/hooks/useEntregadorProfile';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { useTabData } from '@/hooks/data/useTabData';
import { useTabDataMapper } from '@/hooks/data/useTabDataMapper';
import { useDeferredMount } from '@/hooks/ui/useDeferredMount';
import { applyAllYearsDateRangeToPayload } from '@/utils/filters/allYearsRange';
import type { CurrentUser, EntregadoresData } from '@/types';
import type { FilterPayload } from '@/types/filters';

const DeferredTopBottomPerformers = dynamic(
  () => import('./entregadores/TopBottomPerformers').then((mod) => ({ default: mod.TopBottomPerformers })),
  { ssr: false }
);

const DeferredEntregadorProfileDialog = dynamic(
  () => import('./entregadores/EntregadorProfileDialog').then((mod) => ({ default: mod.EntregadorProfileDialog })),
  { ssr: false }
);

function buildEntregadoresSearchPayload(filterPayload: FilterPayload, search: string): FilterPayload {
  return applyAllYearsDateRangeToPayload({
    ...filterPayload,
    p_search: search,
  });
}

function formatDateLabel(value?: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function resolveEntregadoresDescription(
  filterPayload: FilterPayload | undefined,
  periodoResolvido: EntregadoresData['periodo_resolvido'] | undefined,
  fallback: string
) {
  if (!filterPayload) return fallback;

  if (periodoResolvido?.auto_semana && periodoResolvido.semana && periodoResolvido.ano) {
    return `Performance da frota na semana ${periodoResolvido.semana} de ${periodoResolvido.ano}`;
  }

  const selectedWeeks = Array.isArray(filterPayload.p_semanas) ? filterPayload.p_semanas.filter(Boolean) : [];
  const hasExplicitWeek = typeof filterPayload.p_semana === 'number' && filterPayload.p_semana > 0;
  const hasDateRange = Boolean(filterPayload.p_data_inicial || filterPayload.p_data_final);

  if (typeof filterPayload.p_ano === 'number' && !hasExplicitWeek && selectedWeeks.length === 0 && hasDateRange) {
    return `Consolidado do ano inteiro de ${filterPayload.p_ano}`;
  }

  if (typeof filterPayload.p_ano === 'number' && selectedWeeks.length > 1) {
    return `Consolidado das semanas selecionadas de ${filterPayload.p_ano}`;
  }

  if (!filterPayload.p_ano && hasDateRange) {
    const start = formatDateLabel(filterPayload.p_data_inicial);
    const end = formatDateLabel(filterPayload.p_data_final);
    if (start && end) {
      if (start === '01/01/2020') {
        return fallback;
      }
      return `Consolidado de ${start} até ${end}`;
    }
    return 'Consolidado dos anos disponíveis no período carregado';
  }

  return fallback;
}

interface EntregadoresMainContentProps {
  entregadoresData: EntregadoresData | null;
  loading: boolean;
  isRefreshing?: boolean;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  variant?: 'entregadores' | 'dedicado';
  filterPayload?: FilterPayload;
}

export const EntregadoresMainContent = React.memo(function EntregadoresMainContent({
  entregadoresData,
  loading,
  isRefreshing = false,
  searchTerm = '',
  onSearchChange,
  variant = 'entregadores',
  filterPayload,
}: EntregadoresMainContentProps) {
  const isDedicado = variant === 'dedicado';
  const [localSearchTerm, setLocalSearchTerm] = React.useState('');
  const effectiveSearchTerm = onSearchChange ? searchTerm : localSearchTerm;
  const handleSearchChange = React.useCallback((term: string) => {
    if (!onSearchChange) {
      setLocalSearchTerm(term);
    }

    onSearchChange?.(term);
  }, [onSearchChange]);
  const {
    sortedEntregadores,
    sortField,
    sortDirection,
    showInactiveOnly,
    setShowInactiveOnly,
    handleSort
  } = useEntregadoresMainSort(entregadoresData, effectiveSearchTerm);

  const { isExporting, handleExport } = useEntregadoresExport(sortedEntregadores);
  const { selectedEntregador, profileOpen, setProfileOpen, handleRowClick } = useEntregadorProfile();
  const stats = useEntregadoresMainStats(sortedEntregadores);
  const showPerformers = useDeferredMount({
    enabled: sortedEntregadores.length > 0,
    timeoutMs: 800,
  });
  const resolvedDescription = React.useMemo(() => {
    if (isDedicado) {
      return 'Performance dos entregadores nas origens do filtro atual';
    }

    return resolveEntregadoresDescription(
      filterPayload,
      entregadoresData?.periodo_resolvido,
      'Performance e aderência da frota'
    );
  }, [entregadoresData?.periodo_resolvido, filterPayload, isDedicado]);

  if (loading && !entregadoresData) return <DashboardSkeleton contentOnly />;

  return (
    <div className="space-y-6 animate-fade-in">
      <EntregadoresHeader
        onExport={handleExport}
        isExporting={isExporting}
        disableExport={loading || isRefreshing}
        exportDisabledReason="Aguarde a busca terminar para exportar os dados corretos."
        title={isDedicado ? 'Entregadores por Origem' : undefined}
        description={resolvedDescription}
        periodoResolvido={entregadoresData?.periodo_resolvido}
      />

      <EntregadoresMainStatsCards
        totalEntregadores={stats.totalEntregadores}
        aderenciaMedia={stats.aderenciaMedia}
        rejeicaoMedia={stats.rejeicaoMedia}
        totalCorridas={stats.totalCorridasCompletadas}
        totalHoras={formatarHorasParaHMS(stats.totalSegundos / 3600)}
        totalTitle={isDedicado ? 'Total de Entregadores' : undefined}
        totalSubtext={isDedicado ? 'Entregadores nas origens do filtro' : undefined}
        corridasTitle={isDedicado ? 'Completadas' : undefined}
        corridasSubtext={isDedicado ? 'Total completado nas origens' : undefined}
      />

      <EntregadoresMainSearch
        searchTerm={effectiveSearchTerm}
        onSearchChange={handleSearchChange}
        showInactiveOnly={showInactiveOnly}
        onShowInactiveOnlyChange={setShowInactiveOnly}
        isSearching={loading || isRefreshing}
      />

      {loading || isRefreshing ? (
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-200">
          Atualizando a busca com os filtros atuais...
        </div>
      ) : null}

      <EntregadoresMainTable
        sortedEntregadores={sortedEntregadores}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        searchTerm={effectiveSearchTerm}
        onRowClick={handleRowClick}
      />

      {showPerformers ? <DeferredTopBottomPerformers entregadores={sortedEntregadores} /> : null}

      {selectedEntregador ? (
        <DeferredEntregadorProfileDialog
          entregador={selectedEntregador}
          open={profileOpen}
          onOpenChange={setProfileOpen}
          organizationId={typeof filterPayload?.p_organization_id === 'string' ? filterPayload.p_organization_id : undefined}
          variant={variant}
          filterPayload={filterPayload}
        />
      ) : null}
    </div>
  );
});

EntregadoresMainContent.displayName = 'EntregadoresMainContent';

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchFromUrl = searchParams.get('ent_search') || '';
  const [searchTerm, setSearchTerm] = React.useState(searchFromUrl);
  const [serverSearch, setServerSearch] = React.useState(searchFromUrl);
  const normalizedSearchTerm = searchTerm.trim();
  const normalizedServerSearch = serverSearch.trim();
  const isSearchSyncing = !isDedicado
    && normalizedSearchTerm !== normalizedServerSearch
    && (normalizedSearchTerm.length >= 3 || normalizedServerSearch.length >= 3);

  React.useEffect(() => {
    setSearchTerm(searchFromUrl);
  }, [searchFromUrl]);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      setServerSearch(searchTerm);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  const handleSearchChange = React.useCallback((term: string) => {
    setSearchTerm(term);

    const params = new URLSearchParams(searchParams.toString());
    const normalized = term.trim();

    if (normalized) {
      params.set('ent_search', term);
    } else {
      params.delete('ent_search');
    }

    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

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
