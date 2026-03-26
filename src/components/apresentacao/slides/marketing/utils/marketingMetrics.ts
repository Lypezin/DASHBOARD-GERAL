import { 
    BarChart3, 
    Send, 
    CheckCircle2, 
    Rocket, 
    MailOpen, 
    RotateCcw,
    LucideIcon 
} from 'lucide-react';
import { MarketingTotals } from '@/types';

export interface MetricConfig {
    label: string;
    value: number;
    icon: LucideIcon;
    color: string;
    bg: string;
    border: string;
}

export const getMarketingMetrics = (totals: MarketingTotals, isDark: boolean): MetricConfig[] => [
    { 
        label: "Criado", 
        value: totals.criado, 
        icon: BarChart3, 
        color: "text-blue-600", 
        bg: isDark ? "bg-blue-500/10" : "bg-blue-50/50", 
        border: isDark ? "border-blue-900/50" : "border-blue-100" 
    },
    { 
        label: "Enviado", 
        value: totals.enviado, 
        icon: Send, 
        color: "text-emerald-600", 
        bg: isDark ? "bg-emerald-500/10" : "bg-emerald-50/50", 
        border: isDark ? "border-emerald-900/50" : "border-emerald-100" 
    },
    { 
        label: "Liberado", 
        value: totals.liberado, 
        icon: CheckCircle2, 
        color: "text-purple-600", 
        bg: isDark ? "bg-purple-500/10" : "bg-purple-50/50", 
        border: isDark ? "border-purple-900/50" : "border-purple-100" 
    },
    { 
        label: "Rodando", 
        value: totals.rodandoInicio, 
        icon: Rocket, 
        color: "text-orange-600", 
        bg: isDark ? "bg-orange-500/10" : "bg-orange-50/50", 
        border: isDark ? "border-orange-900/50" : "border-orange-100" 
    },
    { 
        label: "Aberto", 
        value: totals.aberto, 
        icon: MailOpen, 
        color: "text-cyan-600", 
        bg: isDark ? "bg-cyan-500/10" : "bg-cyan-50/50", 
        border: isDark ? "border-cyan-900/50" : "border-cyan-100" 
    },
    { 
        label: "Voltou", 
        value: totals.voltou, 
        icon: RotateCcw, 
        color: "text-rose-600", 
        bg: isDark ? "bg-rose-500/10" : "bg-rose-50/50", 
        border: isDark ? "border-rose-900/50" : "border-rose-100" 
    },
];
