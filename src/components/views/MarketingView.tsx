'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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
  const shouldReduceMotion = useReducedMotion();

  const activeSubTab = searchParams.get('mkt_tab') || 'dashboard';

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('mkt_tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const content = (() => {
    switch (activeSubTab) {
      case 'resultados':
        return <ResultadosView />;
      case 'valores-cidade':
        return <ValoresCidadeView />;
      case 'entrada-saida':
        return <MarketingEntradaSaidaView />;
      case 'apresentacao':
        return <MarketingPresentationView />;
      default:
        return <MarketingDashboardView />;
    }
  })();

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 py-6 animate-fade-in sm:px-6 sm:py-7 lg:px-8">
      <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-[0_18px_48px_-42px_rgba(15,23,42,0.7)] dark:border-slate-800/70 dark:bg-slate-950/80 sm:p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="min-w-0">
            <div className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              Marketing
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Marketing</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Gerencie campanhas e acompanhe os resultados da operação.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200/70 bg-slate-100/80 p-1.5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/60 md:justify-end">
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
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeSubTab}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10, scale: 0.996 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.998 }}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0 transform-gpu will-change-transform"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

MarketingView.displayName = 'MarketingView';

export default MarketingView;
