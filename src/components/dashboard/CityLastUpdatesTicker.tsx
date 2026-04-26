'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw } from 'lucide-react';
import { useCityLastUpdates } from '@/hooks/data/useCityLastUpdates';

export function CityLastUpdatesTicker() {
  const { data, loading } = useCityLastUpdates();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setReducedMotion(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener?.('change', handleChange);

    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const visibleItems = useMemo(() => {
    if (!data || data.length === 0) return [];

    return [...data]
      .sort((a, b) => (b.last_update_date || '').localeCompare(a.last_update_date || ''))
      .slice(0, 6);
  }, [data]);

  if (loading || visibleItems.length === 0) return null;

  const shouldAnimate = isVisible && !reducedMotion;
  const marqueeItems = shouldAnimate ? [...visibleItems, ...visibleItems] : visibleItems;

  return (
    <div ref={containerRef} className="mb-6 w-full">
      <div className="overflow-hidden rounded-2xl border border-slate-200/40 bg-white/70 shadow-sm dark:border-slate-800/40 dark:bg-slate-900/70 supports-[backdrop-filter]:backdrop-blur-sm">
        <div className="flex items-center gap-6 px-5 py-3">
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/15">
              <RefreshCw className={`h-3.5 w-3.5 text-blue-500 dark:text-blue-400 ${shouldAnimate ? 'animate-city-updates-spin' : ''}`} />
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

            <div className={`${shouldAnimate ? 'city-updates-marquee min-w-max hover:[animation-play-state:paused]' : 'flex-wrap'} flex items-center gap-5`}>
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
          animation: city-updates-marquee 30s linear infinite;
          will-change: transform;
        }

        .animate-city-updates-spin {
          animation: city-updates-spin 6s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .city-updates-marquee,
          .animate-city-updates-spin {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
