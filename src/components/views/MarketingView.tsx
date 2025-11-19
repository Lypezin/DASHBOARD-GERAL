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
      {/* Sub-guias com design premium */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-300/20 via-pink-300/20 to-purple-300/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative rounded-3xl border-0 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 p-6 shadow-xl dark:from-slate-900 dark:via-purple-950/20 dark:to-pink-950/20 overflow-hidden">
          {/* Elementos decorativos de fundo */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Marketing</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Gerencie campanhas e resultados</p>
              </div>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-transparent">
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
