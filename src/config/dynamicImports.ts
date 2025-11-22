/**
 * Configuração centralizada de dynamic imports
 */

import dynamic from 'next/dynamic';

const loadingComponent = (
  <div className="flex h-64 items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
  </div>
);

const dynamicOptions = {
  ssr: false,
  loading: () => loadingComponent,
};

export const DashboardView = dynamic(
  () => import('@/components/views/DashboardView').then(mod => ({ default: mod.default })),
  dynamicOptions
);

export const MarketingView = dynamic(
  () => import('@/components/views/MarketingView').then(mod => ({ default: mod.default })),
  { ...dynamicOptions, loading: () => (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
    </div>
  )}
);

export const AnaliseView = dynamic(
  () => import('@/components/views/AnaliseView').then(mod => ({ default: mod.default })),
  dynamicOptions
);

export const UtrView = dynamic(
  () => import('@/components/views/UtrView').then(mod => ({ default: mod.default })),
  dynamicOptions
);

export const EvolucaoView = dynamic(
  () => import('@/components/views/EvolucaoView').then(mod => ({ default: mod.default })),
  dynamicOptions
);

export const ValoresView = dynamic(
  () => import('@/components/views/ValoresView').then(mod => ({ default: mod.default })),
  dynamicOptions
);

export const EntregadoresMainView = dynamic(
  () => import('@/components/views/EntregadoresMainView').then(mod => ({ default: mod.default })),
  dynamicOptions
);

export const PrioridadePromoView = dynamic(
  () => import('@/components/views/PrioridadePromoView').then(mod => ({ default: mod.default })),
  dynamicOptions
);

export const ComparacaoView = dynamic(
  () => import('@/components/views/ComparacaoView').then(mod => ({ default: mod.default })),
  dynamicOptions
);

