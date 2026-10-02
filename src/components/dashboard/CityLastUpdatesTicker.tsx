'use client';

import React, { useCallback, useMemo, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

import { useCityLastUpdates } from '@/hooks/data/useCityLastUpdates';

export function CityLastUpdatesTicker() {
  const { data, loading } = useCityLastUpdates();

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

  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollCities = useCallback((direction: -1 | 1) => {
    scrollerRef.current?.scrollBy({ left: direction * 260, behavior: 'smooth' });
  }, []);

  return (
    <div className="flex min-w-0 w-full items-center gap-2" aria-label="Última atualização por cidade">
      <div className="hidden shrink-0 items-center gap-1.5 xl:flex">
        <RefreshCw className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Sincronizado</span>
      </div>
      <button
        type="button"
        onClick={() => scrollCities(-1)}
        aria-label="Rolar cidades para a esquerda"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div
        ref={scrollerRef}
        role="region"
        aria-label="Cidades e datas de atualização"
        tabIndex={0}
        className="subtle-scrollbar min-w-0 flex-1 overflow-x-auto overscroll-x-contain pb-1"
      >
        {visibleItems.length > 0 ? (
          <div className="flex w-max min-w-full items-center gap-1.5">
            {visibleItems.map((item) => (
              <div key={`${item.city}-${item.last_update_date}`} className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs">
                <span className="max-w-[10rem] truncate font-semibold text-foreground">{item.city}</span>
                <span className="tabular-nums text-muted-foreground">{item.formattedDate}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-8 min-w-full items-center rounded-md border border-dashed border-border px-3 text-xs text-muted-foreground" aria-live="polite">
            {loading ? 'Carregando datas de atualização…' : 'Datas de atualização indisponíveis'}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => scrollCities(1)}
        aria-label="Rolar cidades para a direita"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
