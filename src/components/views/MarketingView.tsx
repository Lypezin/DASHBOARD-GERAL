'use client';

import React, { useState } from 'react';
import MarketingDashboardView from './MarketingDashboardView';
import ResultadosView from './ResultadosView';
import ValoresCidadeView from './ValoresCidadeView';
import EntregadoresView from './EntregadoresView';
import TabButton from '@/components/TabButton';

const MarketingView = React.memo(function MarketingView() {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'resultados' | 'valores-cidade' | 'entregadores'>('dashboard');

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
            onClick={() => setActiveSubTab('dashboard')}
          />
          <TabButton
            label="Resultados"
            active={activeSubTab === 'resultados'}
            onClick={() => setActiveSubTab('resultados')}
          />
          <TabButton
            label="Valores por Cidade"
            active={activeSubTab === 'valores-cidade'}
            onClick={() => setActiveSubTab('valores-cidade')}
          />
          <TabButton
            label="Entregadores"
            active={activeSubTab === 'entregadores'}
            onClick={() => setActiveSubTab('entregadores')}
          />
        </div>
      </div>

      {/* Conteúdo das sub-guias */}
      {activeSubTab === 'dashboard' && <MarketingDashboardView />}
      {activeSubTab === 'resultados' && <ResultadosView />}
      {activeSubTab === 'valores-cidade' && <ValoresCidadeView />}
      {activeSubTab === 'entregadores' && <EntregadoresView />}
    </div>
  );
});

MarketingView.displayName = 'MarketingView';

export default MarketingView;
