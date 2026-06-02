/**
 * Hook para mapear dados do useTabData para as props dos componentes de view
 */

import { useMemo } from 'react';
import {
  UtrData,
  EntregadoresData,
  ValoresEntregador,
  TabType,
} from '@/types';

interface TabDataMapperProps {
  activeTab: TabType;
  tabData: any;
}

export function useTabDataMapper({ activeTab, tabData }: TabDataMapperProps) {
  const utrData = useMemo(() => {
    return activeTab === 'utr' ? (tabData as UtrData) : null;
  }, [activeTab, tabData]);

  const entregadoresData = useMemo(() => {
    return activeTab === 'entregadores' || activeTab === 'dedicado' ? (tabData as EntregadoresData) : null;
  }, [activeTab, tabData]);

  const valoresData = useMemo(() => {
    if (activeTab !== 'valores') return [];
    if (!tabData) return [];
    if (Array.isArray(tabData)) {
      return tabData as ValoresEntregador[];
    }
    if (Array.isArray(tabData?.entregadores)) {
      const list = tabData.entregadores as ValoresEntregador[];
      if (tabData.total !== undefined) (list as any).total = tabData.total;
      return list;
    }
    return [];
  }, [activeTab, tabData]);

  const prioridadeData = useMemo(() => {
    return activeTab === 'prioridade' ? (tabData as EntregadoresData) : null;
  }, [activeTab, tabData]);

  return {
    utrData,
    entregadoresData,
    valoresData,
    prioridadeData,
  };
}

