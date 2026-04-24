'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import TabButton from '@/components/TabButton';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

const MarketingDashboardView = dynamic(() => import('./MarketingDashboardView'), {
  ssr: false,
  loading: () => <DashboardSkeleton contentOnly />,
});

const ResultadosView = dynamic(() => import('./ResultadosView'), {
  ssr: false,
  loading: () => <DashboardSkeleton contentOnly />,
});

const ValoresCidadeView = dynamic(() => import('./ValoresCidadeView'), {
  ssr: false,
  loading: () => <DashboardSkeleton contentOnly />,
});

const MarketingEntradaSaidaView = dynamic(() => import('./marketing/MarketingEntradaSaidaView'), {
  ssr: false,
  loading: () => <DashboardSkeleton contentOnly />,
});

const MarketingPresentationView = dynamic(() => import('./marketing/MarketingPresentationView'), {
  ssr: false,
  loading: () => <DashboardSkeleton contentOnly />,
});

const MarketingView = React.memo(function MarketingView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const activeSubTab = searchParams.get('mkt_tab') || 'dashboard';

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('mkt_tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 animate-fade-in sm:px-6 lg:px-8">
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Marketing</h1>
            <p className="text-muted-foreground">
              Gerencie campanhas e acompanhe os resultados da operação.
            </p>
          </div>
        </div>

        <div className="inline-flex flex-wrap gap-1.5 rounded-2xl border border-slate-200/60 bg-slate-100/80 p-1 px-1.5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
          <TabButton
            label="Dashboard"
            active={activeSubTab === 'dashboard'}
            onClick={() => handleTabChange('dashboard')}
          />
          <TabButton
            label="Resultados"
            active={activeSubTab === 'resultados'}
            onClick={() => handleTabChange('resultados')}
          />
          <TabButton
            label="Valores por Cidade"
            active={activeSubTab === 'valores-cidade'}
            onClick={() => handleTabChange('valores-cidade')}
          />
          <TabButton
            label="Entrada/Saída"
            active={activeSubTab === 'entrada-saida'}
            onClick={() => handleTabChange('entrada-saida')}
          />
          <TabButton
            label="Apresentação"
            active={activeSubTab === 'apresentacao'}
            onClick={() => handleTabChange('apresentacao')}
          />
        </div>
      </div>

      {activeSubTab === 'dashboard' && <MarketingDashboardView />}
      {activeSubTab === 'resultados' && <ResultadosView />}
      {activeSubTab === 'valores-cidade' && <ValoresCidadeView />}
      {activeSubTab === 'entrada-saida' && <MarketingEntradaSaidaView />}
      {activeSubTab === 'apresentacao' && <MarketingPresentationView />}
    </div>
  );
});

MarketingView.displayName = 'MarketingView';

export default MarketingView;
