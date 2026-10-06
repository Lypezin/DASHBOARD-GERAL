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
  reducedMotion: boolean;
  displayLabel: string;
  onClick: (value: TabType) => void;
}

export const SidebarMenuItem = React.memo(function SidebarMenuItem({
  item,
  isActive,
  collapsed,
  reducedMotion,
  displayLabel,
  onClick,
}: SidebarMenuItemProps) {
  const Icon = item.icon;

  const buttonEl = (
    <button
      type="button"
      onClick={() => onClick(item.value)}
      onMouseEnter={() => prefetchDashboardTabResources(item.value)}
      onFocus={() => prefetchDashboardTabResources(item.value)}
      aria-current={isActive ? 'page' : undefined}
      aria-label={collapsed ? displayLabel : undefined}
      className={cn(
        'group relative flex min-h-10 w-full items-center gap-3 rounded-[9px] px-3 py-[9px] text-left text-[13px] font-semibold',
        'transition-[background-color,color,transform] duration-150 hover:translate-x-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card',
        isActive
          ? 'bg-primary/10 text-primary dark:bg-primary/15'
          : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
      )}
    >
      {isActive ? (
        <motion.span
          initial={reducedMotion ? false : { opacity: 0, scaleY: 0.7 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-primary"
          aria-hidden="true"
        />
      ) : null}

      <Icon className={cn('h-[18px] w-[18px] shrink-0 transition-colors duration-150', isActive ? 'text-primary' : 'text-muted-foreground/80 group-hover:text-foreground')} />
      
      {!collapsed && (
        <motion.span
          initial={reducedMotion ? false : { opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
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
        <TooltipContent side="right" className="border border-border bg-popover font-semibold text-popover-foreground shadow-md">
          {displayLabel}
        </TooltipContent>
      </Tooltip>
    );
  }

  return <React.Fragment>{buttonEl}</React.Fragment>;
});
