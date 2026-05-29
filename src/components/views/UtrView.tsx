'use client';

import React from 'react';
import { Activity } from 'lucide-react';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { useTabData } from '@/hooks/data/useTabData';
import { useTabDataMapper } from '@/hooks/data/useTabDataMapper';
import type { CurrentUser } from '@/types';
import type { FilterPayload } from '@/types/filters';
import { UtrHeader } from './utr/UtrHeader';
import { UtrContent } from './utr/UtrContent';
import { useUtrView } from './utr/useUtrView';

const UtrView = React.memo(function UtrView({
  filterPayload,
  currentUser,
}: {
  filterPayload: FilterPayload;
  currentUser: CurrentUser | null;
}) {
  const { data: tabData, loading } = useTabData('utr', filterPayload, currentUser);
  const { utrData } = useTabDataMapper({ activeTab: 'utr', tabData });
  const {
    isExporting,
    handleExport,
    porPraca,
    porSubPraca,
    porOrigem,
    porTurno
  } = useUtrView(utrData);

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in pt-4">
        <TableSkeleton rows={6} columns={4} />
      </div>
    );
  }

  if (!utrData || !utrData.geral) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <Activity className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-base font-bold text-foreground">Nenhum dado disponível</p>
        <p className="mx-auto mt-1.5 max-w-sm text-xs text-muted-foreground">
          Aguarde o carregamento ou ajuste os filtros para visualizar a leitura operacional de UTR.
        </p>
      </div>
    );
  }

  const sectionCount = [porPraca, porSubPraca, porOrigem, porTurno].filter((section) => section.length > 0).length;
  const totalSlices = porPraca.length + porSubPraca.length + porOrigem.length + porTurno.length;

  return (
    <div className="flex flex-col gap-8 pb-16 pt-2 w-full animate-fade-in">
      <UtrHeader
        isExporting={isExporting}
        onExport={handleExport}
        totalSections={sectionCount}
        totalSlices={totalSlices}
      />

      <UtrContent
        utrData={utrData}
        porPraca={porPraca}
        porSubPraca={porSubPraca}
        porOrigem={porOrigem}
        porTurno={porTurno}
      />
    </div>
  );
});

UtrView.displayName = 'UtrView';

export default UtrView;
