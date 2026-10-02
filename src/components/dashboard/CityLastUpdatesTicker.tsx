'use client';

import React, { useMemo, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { Pause, Play, RefreshCw } from 'lucide-react';
import { useCityLastUpdates } from '@/hooks/data/useCityLastUpdates';

export function CityLastUpdatesTicker() {
  const { data, loading } = useCityLastUpdates();

  const items = useMemo(() => {
    return [...(data || [])]
      .filter((item) => item.city)
      .sort((a, b) => (b.last_update_date || '').localeCompare(a.last_update_date || ''))
      .map((item) => {
        const date = item.last_update_date ? parseISO(item.last_update_date) : null;
        return {
          city: item.city,
          date: date && isValid(date) ? format(date, 'dd/MM') : 'Data indisponível',
        };
      });
  }, [data]);

  return <CityUpdatesMarquee items={items} loading={loading} />;
}

export function CityUpdatesMarquee({ items, loading = false }: {
  items: { city: string; date: string }[];
  loading?: boolean;
}) {
  const [paused, setPaused] = useState(false);

  return (
    <div className="flex min-w-0 w-full items-center gap-3" aria-label="Última atualização por cidade">
      <div className="flex shrink-0 items-center gap-2 text-primary">
        <RefreshCw className="animate-city-updates-spin h-4 w-4" aria-hidden="true" />
        <span className="hidden text-xs font-semibold sm:inline">Sincronizado</span>
      </div>
      <span className="h-5 w-px shrink-0 bg-border" aria-hidden="true" />

      {items.length ? (
        <>
          <div className="city-ticker-window subtle-scrollbar min-w-0 flex-1 overflow-x-auto" role="region" aria-label="Cidades e datas de atualização" tabIndex={0}>
            <div
              className="city-ticker-track animate-marquee flex w-max items-center"
              style={{ animationDuration: `${Math.max(24, items.length * 3.5)}s`, ...(paused ? { animationPlayState: 'paused' } : {}) }}
            >
              {[0, 1].map((copy) => (
                <div key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center gap-5 pr-5">
                  {items.map((item, index) => (
                    <span key={`${copy}-${item.city}-${index}`} className="flex shrink-0 items-baseline gap-1.5 whitespace-nowrap text-xs text-foreground">
                      <span className="font-semibold">{item.city}</span>
                      <time className="tabular-nums text-muted-foreground">{item.date}</time>
                      <span className="ml-3 text-muted-foreground" aria-hidden="true">·</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? 'Retomar rolagem das cidades' : 'Pausar rolagem das cidades'}
            aria-pressed={paused}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
        </>
      ) : (
        <span className="min-w-0 truncate text-xs text-muted-foreground" aria-live="polite">
          {loading ? 'Carregando datas das cidades…' : 'Datas das cidades indisponíveis'}
        </span>
      )}
    </div>
  );
}
