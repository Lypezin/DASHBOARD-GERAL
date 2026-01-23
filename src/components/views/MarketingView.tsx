'use client';

import React from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import MarketingDashboardView from './MarketingDashboardView';
import ResultadosView from './ResultadosView';
import ValoresCidadeView from './ValoresCidadeView';
import EntregadoresView from './EntregadoresView';
import MarketingEntradaSaidaView from './marketing/MarketingEntradaSaidaView';
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
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Marketing</h2>
            <p className="text-muted-foreground">
              Gerencie campanhas e resultados
            </p>
          </div>
        </div>

        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
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
        </div>
      </div>

      {/* Conteúdo das sub-guias */}
      {/* Conteúdo das sub-guias */}
      {activeSubTab === 'dashboard' && <MarketingDashboardView />}
      {activeSubTab === 'resultados' && <ResultadosView />}
      {activeSubTab === 'valores-cidade' && <ValoresCidadeView />}
      {activeSubTab === 'entregadores' && <EntregadoresView />}
      {activeSubTab === 'entrada-saida' && <MarketingEntradaSaidaView />}
    </div>
  );
});

MarketingView.displayName = 'MarketingView';

export default MarketingView;
