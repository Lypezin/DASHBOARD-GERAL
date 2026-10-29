'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ViewContainer } from '@/components/layout/ViewContainer';

const ValoresCidadeView = dynamic(() => import('./ValoresCidadeView'), {
  ssr: false,
  loading: () => <DashboardSkeleton contentOnly />,
});

const MarketingView = React.memo(function MarketingView() {
  return (
    <ViewContainer className="space-y-5 pb-10 pt-4">
      <header className="relative flex min-w-0 flex-col gap-3 overflow-hidden rounded-xl border border-[#164d70] bg-[#174d70] px-4 py-4 shadow-[0_8px_28px_-22px_rgba(12,54,81,0.6)] sm:px-6 sm:py-5">
        <div className="pointer-events-none absolute -right-10 -top-24 h-48 w-48 rounded-full border border-white/[0.08]" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-2 -top-16 h-32 w-32 rounded-full border border-white/[0.08]" aria-hidden="true" />
        <div className="relative min-w-0">
          <h1 className="text-[21px] font-semibold leading-tight tracking-[-0.025em] text-white sm:text-[24px]">
            Marketing | Valores por Cidade
          </h1>
          <p className="mt-1.5 max-w-3xl text-[12px] leading-5 text-sky-100/90 sm:text-[13px]">
            Acompanhe o investimento e o custo por liberado em cada praça.
          </p>
        </div>
      </header>
      <ValoresCidadeView />
    </ViewContainer>
  );
});

MarketingView.displayName = 'MarketingView';

export default MarketingView;
