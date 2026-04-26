'use client';

import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw } from 'lucide-react';
import { useCityLastUpdates } from '@/hooks/data/useCityLastUpdates';

export function CityLastUpdatesTicker() {
  const { data, loading } = useCityLastUpdates();

  const visibleItems = useMemo(() => {
    if (!data || data.length === 0) return [];

    return [...data]
      .sort((a, b) => (b.last_update_date || '').localeCompare(a.last_update_date || ''))
      .slice(0, 6);
  }, [data]);

  if (loading || visibleItems.length === 0) return null;

  const marqueeItems = [...visibleItems, ...visibleItems];

  return (
    <div className="mb-6 w-full">
      <div className="overflow-hidden rounded-2xl border border-slate-200/40 bg-white/70 shadow-sm dark:border-slate-800/40 dark:bg-slate-900/70 supports-[backdrop-filter]:backdrop-blur-sm">
        <div className="flex items-center gap-6 px-5 py-3">
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/15">
              <RefreshCw className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 animate-city-updates-spin" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 leading-none mb-1">
                Atualizacao
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-none">
                Ultimas pracas sincronizadas
              </p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200/60 dark:bg-slate-700/60 shrink-0" />

          <div className="relative flex-1 overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white/70 to-transparent dark:from-slate-900/70 dark:to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white/70 to-transparent dark:from-slate-900/70 dark:to-transparent" />

            <div className="city-updates-marquee flex min-w-max items-center gap-5 hover:[animation-play-state:paused]">
              {marqueeItems.map((item, index) => (
                <div
                  key={`${item.city}-${index}`}
                  className="flex items-center gap-2.5 shrink-0"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/80 dark:bg-emerald-400/60 shrink-0" />
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {item.city}
                    </span>
                    <span className="rounded-full bg-slate-100/90 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800/90 dark:text-slate-300 whitespace-nowrap tabular-nums">
                      {item.last_update_date
                        ? format(parseISO(item.last_update_date), "dd 'de' MMM", { locale: ptBR })
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes city-updates-marquee {
          0% {
            transform: translate3d(100%, 0, 0);
          }
          100% {
            transform: translate3d(-100%, 0, 0);
          }
        }

        @keyframes city-updates-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .city-updates-marquee {
          animation: city-updates-marquee 22s linear infinite !important;
          transform: translate3d(100%, 0, 0);
          will-change: transform;
        }

        .animate-city-updates-spin {
          animation: city-updates-spin 6s linear infinite !important;
        }
      `}</style>
    </div>
  );
}
