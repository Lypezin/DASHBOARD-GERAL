'use client';

import React from 'react';
import { motion } from 'framer-motion';
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
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150',
        'relative overflow-hidden group focus:outline-none',
        isActive
          ? 'bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(59,130,246,0.15)]'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-current' : 'text-muted-foreground/80 group-hover:text-foreground')} />
      
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.2 }}
          className="truncate"
        >
          {displayLabel}
        </motion.span>
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
