'use client';

import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw } from 'lucide-react';

import { useCityLastUpdates } from '@/hooks/data/useCityLastUpdates';

export function CityLastUpdatesTicker({ className = '' }: { className?: string }) {
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

  if (visibleItems.length === 0) {
    if (!loading) {
      return (
        <div
          role="status"
          className={`w-full flex h-8 items-center gap-3 overflow-hidden select-none pl-1 ${className}`}
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
        className={`w-full flex h-8 items-center gap-3 overflow-hidden select-none pl-1 ${className}`}
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

  // Repete os itens 4 vezes para garantir que preencha toda a tela mesmo em monitores ultrawide
  const marqueeItems = [...visibleItems, ...visibleItems, ...visibleItems, ...visibleItems];

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
      <div className="relative flex-1 overflow-hidden h-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-card to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-card to-transparent" />

        <div className="absolute inset-y-0 left-0 flex items-center overflow-visible">
          <div
            role="list"
            aria-label="Últimas atualizações por cidade"
            className="flex items-center gap-4 w-max animate-marquee hover:[animation-play-state:paused]"
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

      
    </div>
  );
}
