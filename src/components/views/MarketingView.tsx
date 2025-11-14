'use client';

import React, { useState } from 'react';
import MarketingDashboardView from './MarketingDashboardView';
import ResultadosView from './ResultadosView';
import TabButton from '@/components/TabButton';

const MarketingView = React.memo(function MarketingView() {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'resultados'>('dashboard');

  return (
    <div className="space-y-6">
      {/* Sub-guias */}
      <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-4 dark:border-purple-900 dark:from-purple-950/30 dark:to-pink-950/30">
        <div className="flex gap-2 overflow-x-auto pb-2">
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
        </div>
      </div>

      {/* Conteúdo das sub-guias */}
      {activeSubTab === 'dashboard' && <MarketingDashboardView />}
      {activeSubTab === 'resultados' && <ResultadosView />}
    </div>
  );
});

MarketingView.displayName = 'MarketingView';

export default MarketingView;
