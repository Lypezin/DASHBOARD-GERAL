'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useCityLastUpdates } from '@/hooks/data/useCityLastUpdates';

export function CityLastUpdatesTicker() {
  const { data, loading } = useCityLastUpdates();

  if (loading || !data || data.length === 0) return null;

  const visibleItems = [...data]
    .sort((a, b) => (b.last_update_date || '').localeCompare(a.last_update_date || ''))
    .slice(0, 6);
  const marqueeItems = [...visibleItems, ...visibleItems];

  return (
    <div className="mb-6 w-full">
      <Card className="overflow-hidden border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90">
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <RefreshCw className="h-4 w-4 animate-city-updates-spin" />
            </span>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                Atualização
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Últimas praças sincronizadas
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-50/70 dark:border-slate-800/70 dark:bg-slate-950/40">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-slate-50 via-slate-50/85 to-transparent dark:from-slate-950 dark:via-slate-950/85 dark:to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-slate-50 via-slate-50/85 to-transparent dark:from-slate-950 dark:via-slate-950/85 dark:to-transparent" />

            <div className="city-updates-marquee group flex min-w-max items-center gap-3 px-3 py-3 hover:[animation-play-state:paused]">
              {marqueeItems.map((item, index) => (
                <div
                  key={`${item.city}-${index}`}
                  className="flex min-w-[220px] shrink-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-900/80"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {item.city}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {item.last_update_date
                        ? format(parseISO(item.last_update_date), "dd 'de' MMM, HH:mm", { locale: ptBR })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <style jsx global>{`
        @keyframes city-updates-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
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
          animation: city-updates-marquee 34s linear infinite;
          will-change: transform;
        }

        .animate-city-updates-spin {
          animation: city-updates-spin 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
