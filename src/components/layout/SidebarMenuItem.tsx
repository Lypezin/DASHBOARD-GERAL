'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TabType } from '@/types';
import { prefetchDashboardTabResources } from '@/hooks/dashboard/prefetchDashboardTabResources';

interface SidebarMenuItemProps {
  item: {
    value: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  isActive: boolean;
  collapsed: boolean;
  displayLabel: string;
  onClick: (value: TabType) => void;
}

export const SidebarMenuItem = React.memo(function SidebarMenuItem({
  item,
  isActive,
  collapsed,
  displayLabel,
  onClick,
}: SidebarMenuItemProps) {
  const Icon = item.icon;

  const buttonEl = (
    <button
      onClick={() => onClick(item.value)}
      onMouseEnter={() => prefetchDashboardTabResources(item.value)}
      onFocus={() => prefetchDashboardTabResources(item.value)}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
        'relative overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
        isActive
          ? 'bg-[hsl(var(--sidebar-active))] text-[#091634] shadow-sm'
          : 'text-white/75 hover:bg-white/10 hover:text-white'
      )}
    >
      <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-current' : 'text-white/65 group-hover:text-white')} />
      
      {!collapsed && (
        <span className="truncate">
          {displayLabel}
        </span>
      )}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {buttonEl}
        </TooltipTrigger>
        <TooltipContent side="right" className="font-bold border border-border">
          {displayLabel}
        </TooltipContent>
      </Tooltip>
    );
  }

  return <React.Fragment>{buttonEl}</React.Fragment>;
});
