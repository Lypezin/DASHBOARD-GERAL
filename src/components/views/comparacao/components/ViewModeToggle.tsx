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
        <SaasSegmentedControl>
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
                label="Grafico"
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
            className={`${small ? 'h-8 px-3 text-[11px]' : 'h-9 px-3.5 text-xs'} inline-flex items-center gap-1.5 rounded-xl font-semibold transition-[background-color,color,box-shadow,transform] duration-200 ${active
                ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-950 dark:text-slate-50 dark:ring-slate-800'
                : 'text-slate-500 hover:-translate-y-0.5 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                }`}
        >
            <Icon className={small ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            {label}
        </button>
    );
}
