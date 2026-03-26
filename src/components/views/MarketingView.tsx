'use client';

import React from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import MarketingDashboardView from './MarketingDashboardView';
import ResultadosView from './ResultadosView';
import ValoresCidadeView from './ValoresCidadeView';
import EntregadoresView from './EntregadoresView';
import MarketingEntradaSaidaView from './marketing/MarketingEntradaSaidaView';
import MarketingPresentationView from './marketing/MarketingPresentationView';
import TabButton from '@/components/TabButton';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in py-8">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Marketing</h1>
            <p className="text-muted-foreground">
              Gerencie campanhas e acompanhe os resultados da operação.
            </p>
          </div>
        </div>

        <div className="p-1 px-1.5 bg-slate-100/80 dark:bg-slate-900/50 rounded-2xl backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 inline-flex flex-wrap gap-1.5 shadow-sm ring-1 ring-slate-200/20 dark:ring-slate-800/20">
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
            label="Entregadores"
            active={activeSubTab === 'entregadores'}
            onClick={() => handleTabChange('entregadores')}
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

      {/* Conteúdo das sub-guias */}
      {/* Conteúdo das sub-guias */}
      {activeSubTab === 'dashboard' && <MarketingDashboardView />}
      {activeSubTab === 'resultados' && <ResultadosView />}
      {activeSubTab === 'valores-cidade' && <ValoresCidadeView />}
      {activeSubTab === 'entregadores' && <EntregadoresView />}
      {activeSubTab === 'entrada-saida' && <MarketingEntradaSaidaView />}
      {activeSubTab === 'apresentacao' && <MarketingPresentationView />}
    </div>
  );
});

MarketingView.displayName = 'MarketingView';

export default MarketingView;
