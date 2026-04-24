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

  return (
    <div className="mb-6 w-full">
      <Card className="overflow-hidden border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90">
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <RefreshCw className="h-4 w-4" />
            </span>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                Atualizacao
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Ultimas pracas sincronizadas
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item) => (
              <div
                key={item.city}
                className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 transition-[background-color,border-color] duration-200 dark:border-slate-800/70 dark:bg-slate-950/40"
              >
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {item.city}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {item.last_update_date
                    ? format(parseISO(item.last_update_date), "dd 'de' MMM, HH:mm", { locale: ptBR })
                    : 'N/A'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
