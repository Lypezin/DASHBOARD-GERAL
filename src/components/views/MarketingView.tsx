'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ViewContainer } from '@/components/layout/ViewContainer';
import { SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';

const ValoresCidadeView = dynamic(() => import('./ValoresCidadeView'), {
  ssr: false,
  loading: () => <DashboardSkeleton contentOnly />,
});

const MarketingView = React.memo(function MarketingView() {
  return (
    <ViewContainer className="space-y-5 pb-10 pt-4">
      <SaasPanel>
        <SaasPanelHeader
          eyebrow="Marketing"
          title="Valores por Cidade"
          description="Acompanhe o investimento e o custo por liberado em cada praça."
          icon={MapPin}
          tone="blue"
        />
      </SaasPanel>
      <ValoresCidadeView />
    </ViewContainer>
  );
});

MarketingView.displayName = 'MarketingView';

export default MarketingView;
