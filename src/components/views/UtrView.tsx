'use client';

import React from 'react';
import { Activity, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTabData } from '@/hooks/data/useTabData';
import { useTabDataMapper } from '@/hooks/data/useTabDataMapper';
import { ViewTransition } from '@/components/ui/view-transition';
import { FilterRefreshIndicator, FilteredDataTransition, UtrLoading } from '@/components/dashboard/OperationalLoading';
import type { CurrentUser } from '@/types';
import type { FilterPayload } from '@/types/filters';
import { UtrHeader } from './utr/UtrHeader';
import { UtrContent } from './utr/UtrContent';
import { useUtrView } from './utr/useUtrView';
import { ViewContainer } from '@/components/layout/ViewContainer';

const UtrView = React.memo(function UtrView({
  filterPayload,
  currentUser,
}: {
  filterPayload: FilterPayload;
  currentUser: CurrentUser | null;
}) {
  const { data: tabData, loading, error, retry } = useTabData('utr', filterPayload, currentUser);
  const { utrData } = useTabDataMapper({ activeTab: 'utr', tabData });
  const {
    isExporting,
    handleExport,
    porPraca,
    porSubPraca,
    porOrigem,
    porTurno
  } = useUtrView(utrData, loading || Boolean(error), filterPayload);

  let stateKey = 'utr-content';
  let content: React.ReactNode;

  if (loading && (!utrData || !utrData.geral)) {
    stateKey = 'utr-loading';
    content = <UtrLoading />;
  } else if (error && (!utrData || !utrData.geral)) {
    stateKey = 'utr-error';
    content = (
      <div className="mx-auto w-full max-w-[1600px] px-4 pt-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-rose-200/80 bg-rose-50/80 px-6 py-12 text-center shadow-sm dark:border-rose-900/50 dark:bg-rose-950/20">
          <AlertCircle className="mx-auto mb-4 h-8 w-8 text-rose-500" />
          <p className="text-base font-bold text-rose-950 dark:text-rose-100">Não foi possível carregar a UTR</p>
          <p className="mx-auto mt-1.5 max-w-sm text-xs text-rose-800 dark:text-rose-300">Tente carregar novamente. Os filtros atuais serão mantidos.</p>
          <Button onClick={retry} variant="outline" className="mt-5 gap-2 border-rose-300 bg-white text-rose-800 hover:bg-rose-100 dark:border-rose-800 dark:bg-slate-950 dark:text-rose-200">
            <RotateCcw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  } else if (!utrData || !utrData.geral) {
    stateKey = 'utr-empty';
    content = (
      <div className="mx-auto w-full max-w-[1600px] px-4 pt-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-dashed border-[#d8e4eb] bg-white px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-950/70">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900">
            <Activity className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-base font-bold text-slate-950 dark:text-slate-50">Nenhum dado disponível</p>
          <p className="mx-auto mt-1.5 max-w-sm text-xs text-slate-500 dark:text-slate-400">
            Aguarde o carregamento ou ajuste os filtros para visualizar a leitura operacional de UTR.
          </p>
        </div>
      </div>
    );
  } else {
    const sectionCount = [porPraca, porSubPraca, porOrigem, porTurno].filter((section) => section.length > 0).length;
    const totalSlices = porPraca.length + porSubPraca.length + porOrigem.length + porTurno.length;

    content = (
      <ViewContainer className="flex flex-col gap-5 pb-10 pt-4">
        <UtrHeader
          isExporting={isExporting}
          exportDisabled={loading || Boolean(error)}
          onExport={handleExport}
          totalSections={sectionCount}
          totalSlices={totalSlices}
        />

        {loading ? <FilterRefreshIndicator isLoading={loading} viewName="a UTR" /> : null}

        {error ? (
          <div role="alert" className="rounded-2xl border border-amber-200/70 bg-amber-50/85 px-4 py-3 text-sm font-semibold text-amber-800 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-200">
            Não foi possível atualizar a UTR. Exibindo a resposta válida anterior.
          </div>
        ) : null}

        <FilteredDataTransition isUpdating={loading}>
          <UtrContent
            utrData={utrData}
            porPraca={porPraca}
            porSubPraca={porSubPraca}
            porOrigem={porOrigem}
            porTurno={porTurno}
          />
        </FilteredDataTransition>
      </ViewContainer>
    );
  }

  return <ViewTransition stateKey={stateKey} preventExitInteraction>{content}</ViewTransition>;
});

UtrView.displayName = 'UtrView';

export default UtrView;
