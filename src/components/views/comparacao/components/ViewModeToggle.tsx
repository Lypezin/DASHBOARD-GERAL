import React from 'react';
import { FileSpreadsheet, BarChart2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { SaasSegmentedControl } from '@/components/views/shared/SaasPrimitives';

interface ViewModeToggleProps {
    viewMode: 'table' | 'chart';
    onViewModeChange: (mode: 'table' | 'chart') => void;
    size?: 'sm' | 'md';
    layoutId?: string;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
    viewMode,
    onViewModeChange,
    size = 'md',
    layoutId,
}) => {
    const isSmall = size === 'sm';
    const generatedId = React.useId();
    const resolvedLayoutId = layoutId || `view-mode-pill-${generatedId}`;

    return (
        <SaasSegmentedControl className="rounded-lg border-[#d8e4eb] bg-[#f4f8fa] p-0.5 shadow-none dark:border-slate-800 dark:bg-slate-900/70">
            <ModeButton
                active={viewMode === 'table'}
                onClick={() => onViewModeChange('table')}
                icon={FileSpreadsheet}
                label="Tabela"
                small={isSmall}
                layoutId={resolvedLayoutId}
            />
            <ModeButton
                active={viewMode === 'chart'}
                onClick={() => onViewModeChange('chart')}
                icon={BarChart2}
                label="Gráfico"
                small={isSmall}
                layoutId={resolvedLayoutId}
            />
        </SaasSegmentedControl>
    );
};

function ModeButton({
    active,
    onClick,
    icon: Icon,
    label,
    small,
    layoutId,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
    small: boolean;
    layoutId: string;
}) {
    const prefersReducedMotion = useReducedMotion();

    return (
        <button
            onClick={onClick}
            type="button"
            aria-pressed={active}
            className={`${small ? 'h-7 px-2.5 text-[11px]' : 'h-8 px-3 text-xs'} relative inline-flex items-center gap-1.5 rounded-md font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38708e] focus-visible:ring-offset-1 ${active
                ? 'text-[#183f58] dark:text-slate-100'
                : 'text-slate-500 hover:bg-white/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                }`}
        >
            {active ? (
                <motion.span
                    layoutId={layoutId}
                    transition={prefersReducedMotion ? { duration: 0.01 } : { type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-md bg-white shadow-sm ring-1 ring-[#d8e4eb] dark:bg-slate-800 dark:ring-slate-700"
                    aria-hidden="true"
                />
            ) : null}
            <Icon className={`relative z-10 ${small ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} aria-hidden="true" />
            <span className="relative z-10">{label}</span>
        </button>
    );
}
