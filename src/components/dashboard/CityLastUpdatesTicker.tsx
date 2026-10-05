'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useReducedMotion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

import { useCityLastUpdates } from '@/hooks/data/useCityLastUpdates';

const CITY_TICKER_MOTION_STORAGE_KEY = 'dashboard_city_ticker_motion_enabled';

export function CityLastUpdatesTicker({ className = '' }: { className?: string }) {
  const { data, loading } = useCityLastUpdates();
  const motionPreference = useReducedMotion();
  const prefersReducedMotion = motionPreference ?? true;
  const [tickerMotionEnabled, setTickerMotionEnabled] = useState(false);
  const shouldAnimateTicker = !prefersReducedMotion || tickerMotionEnabled;

  useEffect(() => {
    try {
      setTickerMotionEnabled(window.localStorage.getItem(CITY_TICKER_MOTION_STORAGE_KEY) === 'true');
    } catch {
      // Keep the in-memory preference when browser storage is unavailable.
    }
  }, []);

  const visibleItems = useMemo(() => {
    if (!data || data.length === 0) return [];

    return [...data]
      .sort((a, b) => (b.last_update_date || '').localeCompare(a.last_update_date || ''))
      .slice(0, 10)
      .map((item) => ({
        ...item,
        formattedDate: item.last_update_date
          ? format(parseISO(item.last_update_date), "dd/MM", { locale: ptBR })
          : 'N/A',
      }));
  }, [data]);

  if (visibleItems.length === 0) {
    if (!loading) {
      return (
        <div
          role="status"
          className={`w-full min-w-0 flex h-8 items-center gap-3 overflow-hidden select-none pl-1 ${className}`}
        >
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/70">
              <RefreshCw aria-hidden="true" className="h-3 w-3 text-muted-foreground" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/75 whitespace-nowrap">
              Sem atualização recente
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        role="status"
        aria-label="Carregando atualização das cidades"
        className={`w-full min-w-0 flex h-8 items-center gap-3 overflow-hidden select-none pl-1 ${className}`}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 dark:bg-emerald-500/15">
            <RefreshCw
              aria-hidden="true"
              className={`h-3 w-3 text-emerald-500 ${loading ? 'animate-city-updates-spin' : ''}`}
            />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/75 whitespace-nowrap">
            Carregando cidades...
          </span>
        </div>
        <div className="h-4 w-px bg-border shrink-0" />
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden" aria-hidden="true">
          <span className="h-5 w-24 shrink-0 rounded-full bg-slate-200/80 motion-safe:animate-pulse motion-reduce:animate-none dark:bg-slate-800" />
          <span className="h-5 w-32 shrink-0 rounded-full bg-slate-200/80 motion-safe:animate-pulse motion-reduce:animate-none dark:bg-slate-800" />
          <span className="h-5 w-28 shrink-0 rounded-full bg-slate-200/80 motion-safe:animate-pulse motion-reduce:animate-none dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  // Duplicates make the marquee loop seamless. Reduced-motion users retain
  // their previously saved choice while the ticker stays manually scrollable.
  const marqueeItems = shouldAnimateTicker
    ? [...visibleItems, ...visibleItems, ...visibleItems, ...visibleItems]
    : visibleItems;

  return (
    <div className={`w-full flex h-8 items-center gap-3 overflow-hidden select-none pl-1 ${className}`}>
      {/* Indicador de Status / Refresh sutil */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 dark:bg-emerald-500/15">
          <RefreshCw
            aria-hidden="true"
            className={`h-3 w-3 text-emerald-500 ${loading ? 'animate-city-updates-spin' : ''}`}
          />
        </div>
        <span className="hidden xl:inline text-[9px] font-bold uppercase tracking-wider text-muted-foreground/75 whitespace-nowrap">
          {loading ? 'Atualizando' : 'Sincronizado'}
        </span>
      </div>

      <div className="h-4 w-px bg-border shrink-0" />

      {/* Marquee de Cidades e Datas */}
      <div
        role="region"
        aria-label="Atualizações recentes das cidades"
        tabIndex={0}
        className={`group relative h-6 min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 focus-visible:rounded-sm ${shouldAnimateTicker ? 'overflow-hidden focus-within:overflow-x-auto' : 'no-scrollbar overflow-x-auto overscroll-x-contain'}`}
      >
        {shouldAnimateTicker ? (
          <>
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-card to-transparent" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-card to-transparent" />
          </>
        ) : null}

        <div
          role="list"
          aria-label="Últimas atualizações por cidade"
          data-motion-opt-in={prefersReducedMotion && tickerMotionEnabled ? 'true' : undefined}
          className={`flex h-full w-max items-center gap-4 ${shouldAnimateTicker ? 'animate-marquee group-focus-within:[animation-play-state:paused]' : ''}`}
        >
          {marqueeItems.map((item, index) => (
            <div
              key={`${item.city}-${index}`}
              role={index < visibleItems.length ? 'listitem' : undefined}
              aria-hidden={index >= visibleItems.length}
              className="flex items-center gap-2 shrink-0"
            >
              <div className="h-1 w-1 rounded-full bg-emerald-500/80 shrink-0" />
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <span className="text-foreground/90 font-bold whitespace-nowrap font-outfit">
                  {item.city}
                </span>
                <span className="text-[10px] font-mono font-extrabold text-emerald-600 dark:text-emerald-400 opacity-100 whitespace-nowrap bg-emerald-500/10 dark:bg-emerald-500/15 px-1.5 py-0.5 rounded shadow-sm">
                  {item.formattedDate}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      
    </div>
  );
}
