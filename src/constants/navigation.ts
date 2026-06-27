import {
  LayoutDashboard,
  BarChart3,
  Gauge,
  Users,
  Coins,
  Star,
  TrendingUp,
  GitCompare,
  Megaphone,
  Target,
  Shield,
  type LucideIcon
} from 'lucide-react';
import { TabType } from '@/types';

export interface SidebarItem {
  label: string;
  value: TabType;
  icon: React.ComponentType<any> | LucideIcon;
}

export interface SidebarGroup {
  name: string;
  items: SidebarItem[];
}

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    name: 'Principal',
    items: [
      { label: 'Visão Geral', value: 'dashboard', icon: LayoutDashboard },
      { label: 'Análise', value: 'analise', icon: BarChart3 },
      { label: 'UTR', value: 'utr', icon: Gauge },
      { label: 'Comparação', value: 'comparacao', icon: GitCompare },
    ],
  },
  {
    name: 'Operacional',
    items: [
      { label: 'Entregadores', value: 'entregadores', icon: Users },
      { label: 'Valores', value: 'valores', icon: Coins },
      { label: 'Prioridade | Promo', value: 'prioridade', icon: Star },
      { label: 'Evolução', value: 'evolucao', icon: TrendingUp },
      { label: 'Dedicado', value: 'dedicado', icon: Shield },
    ],
  },
  {
    name: 'Marketing',
    items: [
      { label: 'Operacional Marketing', value: 'marketing_comparacao', icon: Megaphone },
      { label: 'Marketing', value: 'marketing', icon: Target },
    ],
  },
];

export const SIDEBAR_LABELS: Partial<Record<TabType, string>> = {
  dashboard: 'Visão Geral',
  analise: 'Análise',
  comparacao: 'Comparação',
  evolucao: 'Evolução',
};
