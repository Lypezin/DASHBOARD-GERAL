import React from 'react';
import { FileSpreadsheet, BarChart2 } from 'lucide-react';
import { SaasSegmentedControl } from '@/components/views/shared/SaasPrimitives';

interface ViewModeToggleProps {
    viewMode: 'table' | 'chart';
    onViewModeChange: (mode: 'table' | 'chart') => void;
    size?: 'sm' | 'md';
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
    viewMode,
    onViewModeChange,
    size = 'md',
}) => {
    const isSmall = size === 'sm';

    return (
        <SaasSegmentedControl className="rounded-lg border-[#d8e4eb] bg-[#f4f8fa] p-0.5 shadow-none dark:border-slate-800 dark:bg-slate-900/70">
            <ModeButton
                active={viewMode === 'table'}
                onClick={() => onViewModeChange('table')}
                icon={FileSpreadsheet}
                label="Tabela"
                small={isSmall}
            />
            <ModeButton
                active={viewMode === 'chart'}
                onClick={() => onViewModeChange('chart')}
                icon={BarChart2}
                label="Gráfico"
                small={isSmall}
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
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
    small: boolean;
}) {
    return (
        <button
            onClick={onClick}
            type="button"
            aria-pressed={active}
            className={`${small ? 'h-7 px-2.5 text-[11px]' : 'h-8 px-3 text-xs'} inline-flex items-center gap-1.5 rounded-md font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38708e] focus-visible:ring-offset-1 ${active
                ? 'bg-white text-[#183f58] shadow-sm ring-1 ring-[#d8e4eb] dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700'
                : 'text-slate-500 hover:bg-white/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                }`}
        >
            <Icon className={small ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            {label}
        </button>
    );
}
