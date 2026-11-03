'use client';

import React from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingReportSlides } from '@/app/apresentacao/marketing/components/MarketingReportSlides';
import type { MarketingPresentationReport } from '@/utils/marketing/buildMarketingPresentation';

type ApiResponse = {
  data: MarketingPresentationReport | null;
  error: string | null;
  stale?: boolean;
};

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${isoDate}T12:00:00.000Z`));
}

function formatShortRange(start: string, end: string) {
  if (end < start) return 'Sem dados no período';
  const dateOptions: Intl.DateTimeFormatOptions = { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short' };
  const formatter = new Intl.DateTimeFormat('pt-BR', dateOptions);
  return `${formatter.format(new Date(`${start}T12:00:00.000Z`))} a ${formatter.format(new Date(`${end}T12:00:00.000Z`))}`;
}

function PresentationLoading() {
  return (
    <main role="status" aria-live="polite" className="flex min-h-screen items-center justify-center bg-slate-50 px-5 text-center text-slate-700 dark:bg-slate-950 dark:text-slate-200">
      <div className="max-w-md">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-700 motion-reduce:animate-none dark:text-sky-300" aria-hidden="true" />
        <h1 className="mt-5 text-lg font-semibold">Montando a apresentação</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">Consultando a pipeline Status e os custos da planilha importada. A primeira consulta pode levar alguns instantes.</p>
      </div>
    </main>
  );
}

export function MarketingGeneratedPresentation({ reportDate }: { reportDate: string }) {
  const [report, setReport] = React.useState<MarketingPresentationReport | null>(null);
  const [stale, setStale] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [retry, setRetry] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ presentation: '1' });
        if (reportDate) params.set('date', reportDate);
        if (retry > 0) params.set('refresh', '1');
        const response = await fetch(`/api/marketing/apresentacao?${params.toString()}`, { cache: 'no-store' });
        const payload = await response.json() as ApiResponse;
        if (!response.ok || !payload.data) throw new Error(payload.error || 'Não foi possível gerar a apresentação.');
        if (!active) return;
        setReport(payload.data);
        setStale(Boolean(payload.stale));
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Não foi possível gerar a apresentação.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [reportDate, retry]);

  if (loading && !report) return <PresentationLoading />;

  if (error || !report) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 dark:bg-slate-950">
        <section role="alert" className="w-full max-w-xl rounded-xl border border-rose-200 bg-white p-6 text-slate-900 shadow-sm dark:border-rose-900/60 dark:bg-slate-900 dark:text-white sm:p-8">
          <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-300" aria-hidden="true" />
          <h1 className="mt-4 text-lg font-semibold">Não foi possível montar a apresentação</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{error || 'Nenhum dado foi recebido.'}</p>
          <Button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-5 gap-2 bg-[#1e5d80] text-white hover:bg-[#174966]">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />Tentar novamente
          </Button>
        </section>
      </main>
    );
  }

  const period = report.monthEnd < report.monthStart
    ? 'Sem dados no período mensal'
    : `${formatDate(report.monthStart)} a ${formatDate(report.monthEnd)}`;
  const sourceNote = stale ? `${report.dataNote} A consulta do DataCrazy usou o último resultado disponível em cache.` : report.dataNote;

  return (
    <>
      {stale ? <div role="status" className="fixed bottom-4 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-amber-100 px-4 py-2 text-xs font-medium text-amber-950 shadow-lg dark:bg-amber-950 dark:text-amber-100">Dados operacionais em cache</div> : null}
      <MarketingReportSlides
        citiesData={report.citiesData}
        evolutionData={report.evolutionData}
        weeklyData={report.weeklyData}
        weeklyDataByCity={report.weeklyDataByCity}
        costsComparison={report.costsComparison}
        titulo="APRESENTAÇÃO MARKETING"
        periodoFormatado={period}
        subtitulo="Resumo executivo e resultados por cidade"
        sourceNote={sourceNote}
        costsCurrentPeriod={formatShortRange(report.trafficCurrentStart, report.trafficCurrentEnd)}
        costsPreviousPeriod={formatShortRange(report.trafficPreviousStart, report.trafficPreviousEnd)}
      />
    </>
  );
}
