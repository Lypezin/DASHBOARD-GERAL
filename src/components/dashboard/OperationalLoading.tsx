'use client';

import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const panelClass = 'rounded-2xl border border-slate-200/75 bg-white/90 shadow-[0_14px_36px_-32px_rgba(15,23,42,0.5)] dark:border-slate-800/75 dark:bg-slate-950/65';

function Shimmer({ className }: { className: string }) {
  return <div aria-hidden="true" className={cn('dashboard-loading-shimmer rounded-lg', className)} />;
}

function LoadingHeading({ title, description }: { title: string; description: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-w-0 items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <p className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100">{title}</p>
        <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/80 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/35 dark:text-blue-300">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-50 motion-safe:animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
        </span>
        Carregando
      </span>
    </div>
  );
}

function PanelHeaderSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200/60 px-4 py-4 dark:border-slate-800/70 sm:px-5">
      <div className="min-w-0 flex-1 space-y-2">
        <Shimmer className="h-2.5 w-24 rounded-full" />
        <Shimmer className={cn('h-4 rounded-full', wide ? 'w-56 max-w-full' : 'w-40 max-w-full')} />
        <Shimmer className="h-2.5 w-64 max-w-full rounded-full" />
      </div>
      <Shimmer className="h-9 w-24 shrink-0 rounded-xl" />
    </div>
  );
}

function MetricSkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-slate-200/65 bg-white/80 p-4 dark:border-slate-800/70 dark:bg-slate-950/50', className)}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <Shimmer className="h-2.5 w-24 rounded-full" />
        <Shimmer className="h-8 w-8 rounded-xl" />
      </div>
      <Shimmer className="h-7 w-28 max-w-full rounded-lg" />
      <Shimmer className="mt-2 h-2.5 w-16 rounded-full" />
      <Shimmer className="mt-5 h-1.5 w-full rounded-full" />
    </div>
  );
}

export function DashboardOverviewLoading() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-8" aria-label="Carregando visão geral">
      <LoadingHeading
        title="Preparando a visão geral"
        description="Buscando corridas, aderência e recortes da operação para os filtros selecionados."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className={cn(panelClass, 'min-h-[230px] p-5 lg:col-span-4 sm:p-6')}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Shimmer className="h-4 w-32 rounded-full" />
              <Shimmer className="h-2.5 w-40 max-w-full rounded-full" />
            </div>
            <Shimmer className="h-6 w-24 rounded-full" />
          </div>
          <div className="mt-5 flex justify-center">
            <Shimmer className="h-32 w-32 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:col-span-8">
          <MetricSkeletonCard className="min-h-[230px]" />
          <MetricSkeletonCard className="min-h-[230px]" />
          <MetricSkeletonCard className="min-h-[145px] md:col-span-2" />
        </div>
      </div>

      <section className={panelClass}>
        <PanelHeaderSkeleton wide />
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 lg:grid-cols-7 sm:p-4">
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className="rounded-xl border border-slate-200/60 p-3 dark:border-slate-800/70">
              <Shimmer className="h-2.5 w-14 rounded-full" />
              <Shimmer className="mt-4 h-6 w-20 max-w-full rounded-lg" />
              <Shimmer className="mt-3 h-2.5 w-full rounded-full" />
              <Shimmer className="mt-2 h-2.5 w-3/4 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      <section className={panelClass}>
        <PanelHeaderSkeleton wide />
        <div className="grid gap-3 p-4 sm:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <MetricSkeletonCard key={index} className="min-h-[142px]" />
          ))}
        </div>
      </section>
    </div>
  );
}

export function AnalysisLoading() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-8" aria-label="Carregando análise">
      <LoadingHeading
        title="Preparando a análise"
        description="Consolidando horas, corridas e taxas para o período selecionado."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <MetricSkeletonCard key={index} className="min-h-[174px]" />
        ))}
      </div>

      <section className={panelClass}>
        <PanelHeaderSkeleton wide />
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/60 px-4 py-3 dark:border-slate-800/70 sm:px-5">
          {Array.from({ length: 5 }, (_, index) => (
            <Shimmer key={index} className="h-8 w-24 rounded-lg" />
          ))}
        </div>
        <div className="space-y-2 p-4 sm:p-5">
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200/50 px-3 py-3 dark:border-slate-800/50 sm:grid-cols-5">
              <Shimmer className="h-3 w-28 max-w-full rounded-full" />
              <Shimmer className="hidden h-3 w-20 rounded-full sm:block" />
              <Shimmer className="h-3 w-16 rounded-full" />
              <Shimmer className="hidden h-3 w-24 rounded-full sm:block" />
              <Shimmer className="h-3 w-14 justify-self-end rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function UtrLoading() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-8" aria-label="Carregando UTR">
      <LoadingHeading
        title="Preparando a UTR"
        description="Reunindo os indicadores gerais e a divisão por segmentos operacionais."
      />

      <section className={panelClass}>
        <PanelHeaderSkeleton wide />
        <div className="grid gap-3 border-t border-slate-200/60 p-4 dark:border-slate-800/70 sm:grid-cols-2 sm:p-5">
          <MetricSkeletonCard className="min-h-[88px]" />
          <MetricSkeletonCard className="min-h-[88px]" />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <MetricSkeletonCard key={index} className="min-h-[142px]" />
        ))}
      </div>

      <section className={panelClass}>
        <PanelHeaderSkeleton wide />
        <div className="grid gap-4 p-4 xl:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-800/70">
              <div className="flex items-center gap-3 border-b border-slate-200/60 bg-slate-50/80 px-4 py-4 dark:border-slate-800/70 dark:bg-slate-900/40">
                <Shimmer className="h-9 w-9 rounded-xl" />
                <div className="space-y-2">
                  <Shimmer className="h-3 w-24 rounded-full" />
                  <Shimmer className="h-2.5 w-40 max-w-full rounded-full" />
                </div>
              </div>
              <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {Array.from({ length: 3 }, (_, row) => (
                  <div key={row} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Shimmer className="h-3 w-32 max-w-full rounded-full" />
                      <Shimmer className="h-2.5 w-44 max-w-full rounded-full" />
                    </div>
                    <Shimmer className="h-8 w-16 shrink-0 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function FilterRefreshIndicator({
  isLoading,
  viewName,
}: {
  isLoading: boolean;
  viewName: string;
}) {
  const shouldReduceMotion = useReducedMotion() ?? true;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsVisible(false);
      return;
    }

    const timeout = window.setTimeout(() => setIsVisible(true), 160);
    return () => window.clearTimeout(timeout);
  }, [isLoading]);

  return (
    <AnimatePresence initial={false}>
      {isLoading && isVisible ? (
        <motion.div
          key="filter-refresh-indicator"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -3 }}
          transition={{ duration: shouldReduceMotion ? 0.1 : 0.18, ease: 'easeOut' }}
          className="relative isolate overflow-hidden rounded-xl border border-blue-200/70 bg-white/90 px-3 py-2.5 shadow-[0_10px_28px_-24px_rgba(37,99,235,0.55)] dark:border-blue-900/55 dark:bg-slate-950/75"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/70 to-transparent" />
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/45 dark:text-blue-300">
              <Activity className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-2">
              <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">Atualizando {viewName}</p>
              <span className="hidden text-xs font-medium text-slate-500 dark:text-slate-400 sm:inline">Os resultados atuais continuam visíveis enquanto os filtros são consultados.</span>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-blue-700 dark:bg-blue-950/45 dark:text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 motion-safe:animate-pulse" />
              Atualizando
            </span>
          </div>
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden bg-blue-100 dark:bg-blue-950/70">
            <span className="dashboard-loading-progress absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-blue-400 via-blue-600 to-cyan-400" />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function FilteredDataTransition({
  isUpdating,
  children,
  className,
}: {
  isUpdating: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion() ?? true;

  return (
    <motion.div
      aria-busy={isUpdating}
      initial={false}
      animate={{ opacity: isUpdating ? 0.9 : 1 }}
      transition={{ duration: shouldReduceMotion ? 0.08 : 0.22, ease: 'easeOut' }}
      className={cn('min-w-0', className)}
    >
      {children}
    </motion.div>
  );
}
