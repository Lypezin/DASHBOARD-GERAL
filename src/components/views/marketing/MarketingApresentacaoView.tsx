'use client';

import React from 'react';
import {
  AlertCircle,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  Database,
  Loader2,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ViewContainer } from '@/components/layout/ViewContainer';
import { cn } from '@/lib/utils';

type ReportLead = {
  code: string;
  lead: string;
  phone: string;
  attendant: string;
  region: string;
  subregion: string;
  stage: string;
  stageOrder: number;
  sentDate: string | null;
  releasedDate: string | null;
  ranDate: string | null;
};

type ReportSnapshot = {
  currentDate: string;
  leads: ReportLead[];
};

type ApiResponse<T> = { data: T | null; error: string | null; stale?: boolean };
type Mode = 'day' | 'week';
type Metrics = { sent: number; released: number; ran: number };

const DEFAULT_REGIONS = ['ABC', 'Taboão da Serra', 'Guarulhos', 'Sorocaba', 'Salvador', 'São Paulo', 'Manaus'];
const DEFAULT_ATTENDANTS = ['Beatriz', 'Henrique', 'Mariane', 'Melissa', 'Dafhny'];
const moneyFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function shiftDate(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(isoDate: string, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }) {
  return new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: 'America/Sao_Paulo' })
    .format(new Date(`${isoDate}T12:00:00.000Z`));
}

function inRange(value: string | null, start: string, end: string) {
  return Boolean(value && value >= start && value <= end);
}

function getMetrics(lead: ReportLead, mode: Mode, referenceDate: string, currentDate: string): Metrics {
  if (mode === 'day') {
    return {
      sent: lead.sentDate === referenceDate ? 1 : 0,
      released: lead.releasedDate === referenceDate ? 1 : 0,
      ran: lead.ranDate === shiftDate(referenceDate, -1) ? 1 : 0,
    };
  }

  const start = shiftDate(currentDate, -6);
  return {
    sent: inRange(lead.sentDate, start, currentDate) ? 1 : 0,
    released: inRange(lead.releasedDate, start, currentDate) ? 1 : 0,
    ran: inRange(lead.ranDate, start, currentDate) ? 1 : 0,
  };
}

function sumMetrics(rows: ReportLead[], mode: Mode, referenceDate: string, currentDate: string): Metrics {
  return rows.reduce<Metrics>((totals, lead) => {
    const metrics = getMetrics(lead, mode, referenceDate, currentDate);
    totals.sent += metrics.sent;
    totals.released += metrics.released;
    totals.ran += metrics.ran;
    return totals;
  }, { sent: 0, released: 0, ran: 0 });
}

function numberFormat(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function parseCurrency(value: string) {
  const cleaned = value.replace(/\s|R\$/gi, '').trim();
  if (!cleaned) return null;
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) / 100 : null;
}

function formatCurrencyInput(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getApiError<T>(payload: ApiResponse<T>, fallback: string) {
  return payload.error || fallback;
}

function SectionHeading({
  id,
  title,
  detail,
  trailing,
}: {
  id?: string;
  title: string;
  detail?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-end justify-between gap-3 border-b border-[#e1eaf0] px-4 py-3.5 dark:border-slate-800 sm:px-5">
      <div className="min-w-0">
        <h2 id={id} className="text-[15px] font-semibold tracking-[-0.015em] text-[#173f59] dark:text-slate-100">{title}</h2>
        {detail ? <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{detail}</p> : null}
      </div>
      {trailing}
    </div>
  );
}

function MetricCell({ label, value, note, tone }: { label: string; value: number; note: string; tone: 'blue' | 'teal' | 'slate' }) {
  const toneStyles = {
    blue: 'text-[#1d628c] dark:text-sky-300',
    teal: 'text-[#147a70] dark:text-teal-300',
    slate: 'text-[#4b6679] dark:text-slate-300',
  };
  return (
    <div className="min-w-0 px-4 py-4 sm:px-6 sm:py-5">
      <p className={cn('text-[11px] font-bold uppercase tracking-[0.09em]', toneStyles[tone])}>{label}</p>
      <p className="mt-1.5 tabular-nums text-[30px] font-semibold leading-none tracking-[-0.035em] text-[#183f58] dark:text-white sm:text-[34px]">
        {numberFormat(value)}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{note}</p>
    </div>
  );
}

function CostEditor({
  mode,
  date,
  totalSent,
}: {
  mode: Mode;
  date: string;
  totalSent: number;
}) {
  const [savedCost, setSavedCost] = React.useState(0);
  const [inputValue, setInputValue] = React.useState('0,00');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setNotice(null);
    fetch(`/api/marketing/apresentacao/custo?period=${mode}&date=${date}`, { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json() as ApiResponse<{ totalCost: number }>;
        if (!response.ok || !payload.data) throw new Error(getApiError(payload, 'Não foi possível consultar o custo salvo.'));
        return payload.data;
      })
      .then((data) => {
        if (!active) return;
        setSavedCost(data.totalCost);
        setInputValue(formatCurrencyInput(data.totalCost));
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Não foi possível consultar o custo salvo.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [date, mode]);

  const parsedCost = parseCurrency(inputValue);
  const dirty = parsedCost !== null && parsedCost !== savedCost;

  const saveCost = async () => {
    if (parsedCost === null) {
      setError('Informe um valor válido, como 1.250,00.');
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/marketing/apresentacao/custo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: mode, date, totalCost: parsedCost }),
      });
      const payload = await response.json() as ApiResponse<{ totalCost: number }>;
      if (!response.ok || !payload.data) throw new Error(getApiError(payload, 'Não foi possível salvar o custo.'));
      setSavedCost(payload.data.totalCost);
      setInputValue(formatCurrencyInput(payload.data.totalCost));
      setNotice('Custo compartilhado com a equipe.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar o custo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="marketing-cost-title" className="rounded-xl border border-[#d6e2e9] bg-white p-4 dark:border-slate-800 dark:bg-slate-950/80 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#edf5f9] text-[#1e5d80] dark:bg-sky-950/60 dark:text-sky-300">
          <CircleDollarSign className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="marketing-cost-title" className="text-sm font-semibold text-[#173f59] dark:text-slate-100">Custo de marketing</h2>
          <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-400">
            {mode === 'day' ? `Dia ${formatDate(date, { day: '2-digit', month: 'long' })}` : `Período de 7 dias · até ${formatDate(date)}`}
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <label className="min-w-0">
          <span className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">Custo total (R$)</span>
          <Input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label="Custo total de marketing em reais"
            value={inputValue}
            disabled={loading || saving}
            onChange={(event) => { setInputValue(event.target.value); setNotice(null); }}
            className="h-10 rounded-lg border-[#cfdae2] text-sm tabular-nums dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
        <Button
          type="button"
          onClick={saveCost}
          disabled={loading || saving || !dirty}
          className="h-10 gap-2 rounded-lg bg-[#1e5d80] px-3 text-xs font-semibold text-white hover:bg-[#174966] disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
          Salvar
        </Button>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[#e6edf1] pt-3 dark:border-slate-800">
        <span className="text-xs text-slate-600 dark:text-slate-400">Custo por enviado</span>
        <strong className="tabular-nums text-sm font-semibold text-[#173f59] dark:text-slate-100">
          {totalSent > 0 ? moneyFormat.format((parsedCost ?? savedCost) / totalSent) : '—'}
        </strong>
      </div>
      <p role={error ? 'alert' : 'status'} aria-live="polite" className={cn(
        'mt-2 min-h-4 text-[11px] leading-4',
        error ? 'text-rose-700 dark:text-rose-300' : 'text-slate-500 dark:text-slate-400',
      )}>
        {error || notice || (loading ? 'Consultando valor salvo…' : 'Valor compartilhado com quem tem acesso ao Marketing.')}
      </p>
    </section>
  );
}

function WeeklyTrend({ leads, currentDate }: { leads: ReportLead[]; currentDate: string }) {
  const days = Array.from({ length: 7 }, (_, index) => shiftDate(currentDate, index - 6));
  const dailyMetrics = days.map((date) => ({
    date,
    metrics: leads.reduce<Metrics>((totals, lead) => {
      totals.sent += lead.sentDate === date ? 1 : 0;
      totals.released += lead.releasedDate === date ? 1 : 0;
      totals.ran += lead.ranDate === date ? 1 : 0;
      return totals;
    }, { sent: 0, released: 0, ran: 0 }),
  }));
  const maximum = Math.max(1, ...dailyMetrics.flatMap(({ metrics }) => [metrics.sent, metrics.released, metrics.ran]));

  return (
    <section aria-labelledby="marketing-trend-title" className="overflow-hidden rounded-xl border border-[#d6e2e9] bg-white dark:border-slate-800 dark:bg-slate-950/80">
      <SectionHeading
        id="marketing-trend-title"
        title="Ritmo dos últimos 7 dias"
        detail="Cada barra conta os registros conforme a data informada no DataCrazy."
        trailing={<span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">{formatDate(days[0])} — {formatDate(currentDate)}</span>}
      />
      <div className="px-4 pb-4 pt-5 sm:px-5">
        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-slate-600 dark:text-slate-400" aria-label="Legenda do gráfico">
          <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-sm bg-[#3279a3]" />Enviados</span>
          <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-sm bg-[#239284]" />Liberados</span>
          <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-sm bg-[#8295a2]" />Rodou</span>
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
          {dailyMetrics.map(({ date, metrics }) => (
            <div key={date} className="min-w-0 text-center">
              <div className="flex h-28 items-end justify-center gap-[3px] border-b border-[#dfe8ed] px-1 dark:border-slate-800 sm:gap-1">
                {([
                  ['sent', '#3279a3'],
                  ['released', '#239284'],
                  ['ran', '#8295a2'],
                ] as const).map(([key, color]) => (
                  <div
                    key={key}
                    aria-label={`${key === 'sent' ? 'Enviados' : key === 'released' ? 'Liberados' : 'Rodou'}: ${metrics[key]}`}
                    title={`${key === 'sent' ? 'Enviados' : key === 'released' ? 'Liberados' : 'Rodou'}: ${metrics[key]}`}
                    className="w-full max-w-5 rounded-t-[3px] transition-[height] duration-300 motion-reduce:transition-none"
                    style={{ height: `${metrics[key] === 0 ? 2 : Math.max(7, (metrics[key] / maximum) * 92)}px`, backgroundColor: color, opacity: metrics[key] === 0 ? 0.28 : 1 }}
                  />
                ))}
              </div>
              <p className="mt-2 truncate text-[10px] font-medium text-slate-600 dark:text-slate-400 sm:text-[11px]">{formatDate(date, { weekday: 'short', day: '2-digit' })}</p>
              <p className="mt-1 tabular-nums text-[10px] text-slate-500 dark:text-slate-500">{numberFormat(metrics.sent + metrics.released + metrics.ran)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RegionBreakdown({
  rows,
  mode,
  referenceDate,
  currentDate,
}: {
  rows: ReportLead[];
  mode: Mode;
  referenceDate: string;
  currentDate: string;
}) {
  const otherRegions = Array.from(new Set(rows.map((lead) => lead.region))).filter((region) => !DEFAULT_REGIONS.includes(region)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const regions = [...DEFAULT_REGIONS, ...otherRegions];
  return (
    <section aria-labelledby="marketing-regions-title" className="overflow-hidden rounded-xl border border-[#d6e2e9] bg-white dark:border-slate-800 dark:bg-slate-950/80">
      <SectionHeading id="marketing-regions-title" title="Resultado por região" detail="Cadastros contados por data e praça." />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-xs">
          <thead>
            <tr className="bg-[#f3f7f9] text-[10px] font-bold uppercase tracking-[0.07em] text-slate-600 dark:bg-slate-900 dark:text-slate-400">
              <th scope="col" className="px-4 py-2.5 sm:px-5">Região</th>
              <th scope="col" className="px-3 py-2.5 text-right">Enviados</th>
              <th scope="col" className="px-3 py-2.5 text-right">Liberados</th>
              <th scope="col" className="px-4 py-2.5 text-right sm:px-5">Rodou</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e7edf1] dark:divide-slate-800">
            {regions.map((region) => {
              const regionRows = rows.filter((lead) => lead.region === region);
              const totals = sumMetrics(regionRows, mode, referenceDate, currentDate);
              return (
                <tr key={region} className="text-slate-700 dark:text-slate-300">
                  <th scope="row" className="px-4 py-3 font-medium text-[#173f59] dark:text-slate-200 sm:px-5">{region}</th>
                  <td className="px-3 py-3 text-right tabular-nums">{numberFormat(totals.sent)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{numberFormat(totals.released)}</td>
                  <td className="px-4 py-3 text-right tabular-nums sm:px-5">{numberFormat(totals.ran)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AttendantBreakdown({
  rows,
  mode,
  referenceDate,
  currentDate,
}: {
  rows: ReportLead[];
  mode: Mode;
  referenceDate: string;
  currentDate: string;
}) {
  const namesInData = Array.from(new Set(rows.map((lead) => lead.attendant)));
  const primary = DEFAULT_ATTENDANTS.filter((name) => namesInData.some((current) => current.toLocaleLowerCase('pt-BR').includes(name.toLocaleLowerCase('pt-BR'))));
  const otherNames = namesInData.filter((name) => !primary.some((known) => name.toLocaleLowerCase('pt-BR').includes(known.toLocaleLowerCase('pt-BR')))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const names = [...DEFAULT_ATTENDANTS, ...otherNames];
  return (
    <section aria-labelledby="marketing-attendants-title" className="overflow-hidden rounded-xl border border-[#d6e2e9] bg-white dark:border-slate-800 dark:bg-slate-950/80">
      <SectionHeading id="marketing-attendants-title" title="Produção por atendente" detail="Enviados e liberados no período selecionado." />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px] text-left text-xs">
          <thead>
            <tr className="bg-[#f3f7f9] text-[10px] font-bold uppercase tracking-[0.07em] text-slate-600 dark:bg-slate-900 dark:text-slate-400">
              <th scope="col" className="px-4 py-2.5 sm:px-5">Atendente</th>
              <th scope="col" className="px-3 py-2.5 text-right">Enviados</th>
              <th scope="col" className="px-4 py-2.5 text-right sm:px-5">Liberados</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e7edf1] dark:divide-slate-800">
            {names.length > 0 ? names.map((name) => {
              const attendantRows = rows.filter((lead) => lead.attendant.toLocaleLowerCase('pt-BR').includes(name.toLocaleLowerCase('pt-BR')));
              const totals = sumMetrics(attendantRows, mode, referenceDate, currentDate);
              return (
                <tr key={name} className="text-slate-700 dark:text-slate-300">
                  <th scope="row" className="max-w-[220px] truncate px-4 py-3 font-medium text-[#173f59] dark:text-slate-200 sm:px-5">{name}</th>
                  <td className="px-3 py-3 text-right tabular-nums">{numberFormat(totals.sent)}</td>
                  <td className="px-4 py-3 text-right tabular-nums sm:px-5">{numberFormat(totals.released)}</td>
                </tr>
              );
            }) : (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">Nenhum atendente teve movimento no período.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LeadList({
  rows,
  mode,
  referenceDate,
  currentDate,
}: {
  rows: ReportLead[];
  mode: Mode;
  referenceDate: string;
  currentDate: string;
}) {
  const [search, setSearch] = React.useState('');
  const [stage, setStage] = React.useState('all');
  const [metric, setMetric] = React.useState('all');
  const stages = Array.from(new Set(rows.map((lead) => lead.stage))).sort((a, b) => {
    const aOrder = rows.find((lead) => lead.stage === a)?.stageOrder ?? 99;
    const bOrder = rows.find((lead) => lead.stage === b)?.stageOrder ?? 99;
    return aOrder - bOrder || a.localeCompare(b, 'pt-BR');
  });
  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
  const filteredRows = rows.filter((lead) => {
    const text = [lead.lead, lead.phone, lead.code, lead.subregion].join(' ').toLocaleLowerCase('pt-BR');
    const metrics = getMetrics(lead, mode, referenceDate, currentDate);
    const matchesMetric = metric === 'all' || (metric === 'sent' && metrics.sent > 0) || (metric === 'released' && metrics.released > 0) || (metric === 'ran' && metrics.ran > 0);
    return (!normalizedSearch || text.includes(normalizedSearch))
      && (stage === 'all' || lead.stage === stage)
      && matchesMetric;
  });
  const hasFilters = Boolean(search || stage !== 'all' || metric !== 'all');

  return (
    <section aria-labelledby="marketing-leads-title" className="overflow-hidden rounded-xl border border-[#d6e2e9] bg-white dark:border-slate-800 dark:bg-slate-950/80">
      <SectionHeading
        id="marketing-leads-title"
        title="Leads do período"
        detail="Datas e etapa atuais de cada negócio na pipeline Status."
        trailing={<span className="text-xs tabular-nums text-slate-600 dark:text-slate-400">{numberFormat(filteredRows.length)} {filteredRows.length === 1 ? 'registro' : 'registros'}</span>}
      />
      <div className="grid gap-2.5 border-b border-[#e7edf1] p-3 dark:border-slate-800 sm:grid-cols-[minmax(220px,1fr)_minmax(150px,190px)_minmax(155px,190px)_auto] sm:items-center sm:px-4">
        <label className="relative min-w-0">
          <span className="sr-only">Buscar lead, telefone ou código</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar lead, telefone ou código" className="h-9 rounded-lg border-[#cfdae2] pl-9 text-xs dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <label className="min-w-0">
          <span className="sr-only">Filtrar por etapa</span>
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger className="h-9 rounded-lg border-[#cfdae2] text-xs dark:border-slate-700 dark:bg-slate-900"><SelectValue placeholder="Todas as etapas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as etapas</SelectItem>
              {stages.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
        </label>
        <label className="min-w-0">
          <span className="sr-only">Filtrar por indicador</span>
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="h-9 rounded-lg border-[#cfdae2] text-xs dark:border-slate-700 dark:bg-slate-900"><SelectValue placeholder="Todos os indicadores" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os indicadores</SelectItem>
              <SelectItem value="sent">Enviados</SelectItem>
              <SelectItem value="released">Liberados</SelectItem>
              <SelectItem value="ran">Rodou</SelectItem>
            </SelectContent>
          </Select>
        </label>
        {hasFilters ? (
          <Button type="button" variant="ghost" onClick={() => { setSearch(''); setStage('all'); setMetric('all'); }} className="h-9 gap-1.5 px-2 text-xs text-slate-600 hover:text-[#1e5d80] dark:text-slate-400 dark:hover:text-sky-300">
            <X className="h-3.5 w-3.5" aria-hidden="true" /> Limpar
          </Button>
        ) : <span aria-hidden="true" className="hidden sm:block" />}
      </div>
      <p className="px-4 pt-2 text-[11px] text-slate-500 dark:text-slate-400 sm:hidden">Deslize para ver todas as colunas.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-xs">
          <thead>
            <tr className="bg-[#f3f7f9] text-[10px] font-bold uppercase tracking-[0.07em] text-slate-600 dark:bg-slate-900 dark:text-slate-400">
              <th scope="col" className="px-4 py-2.5">Código / lead</th>
              <th scope="col" className="px-3 py-2.5">Telefone</th>
              <th scope="col" className="px-3 py-2.5">Atendente</th>
              <th scope="col" className="px-3 py-2.5">Região / subpraça</th>
              <th scope="col" className="px-3 py-2.5">Etapa atual</th>
              <th scope="col" className="px-3 py-2.5">Datas no CRM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e7edf1] dark:divide-slate-800">
            {filteredRows.length > 0 ? filteredRows.map((lead, index) => {
              const metrics = getMetrics(lead, mode, referenceDate, currentDate);
              return (
                <tr key={`${lead.code || lead.lead}-${index}`} className="align-top text-slate-700 hover:bg-[#f8fbfc] dark:text-slate-300 dark:hover:bg-slate-900/70">
                  <td className="max-w-[260px] px-4 py-3">
                    <p className="truncate font-semibold text-[#173f59] dark:text-slate-100">{lead.lead}</p>
                    <p className="mt-1 text-[10px] tabular-nums text-slate-500 dark:text-slate-400">{lead.code ? `#${lead.code}` : 'Sem código'}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 tabular-nums">{lead.phone ? <a className="underline decoration-slate-300 underline-offset-2 hover:text-[#1e5d80] dark:decoration-slate-600 dark:hover:text-sky-300" href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}>{lead.phone}</a> : '—'}</td>
                  <td className="max-w-[160px] truncate px-3 py-3">{lead.attendant}</td>
                  <td className="max-w-[170px] px-3 py-3">
                    <p className="truncate font-medium">{lead.region}</p>
                    <p className="mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400">{lead.subregion || 'Sem subpraça'}</p>
                  </td>
                  <td className="max-w-[170px] px-3 py-3"><span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-md bg-[#eef4f7] px-2 py-1 text-[10px] font-medium text-[#385d73] dark:bg-slate-800 dark:text-slate-300"><span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">{lead.stageOrder}.</span>{lead.stage}</span></td>
                  <td className="px-3 py-2.5">
                    <div className="grid grid-cols-3 gap-x-2 text-[10px] leading-5 tabular-nums">
                      <span className={metrics.sent ? 'font-semibold text-sky-800 dark:text-sky-300' : 'text-slate-500 dark:text-slate-400'}>Env. {lead.sentDate ? formatDate(lead.sentDate, { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'}</span>
                      <span className={metrics.released ? 'font-semibold text-teal-800 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400'}>Lib. {lead.releasedDate ? formatDate(lead.releasedDate, { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'}</span>
                      <span className={metrics.ran ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}>Rodou {lead.ranDate ? formatDate(lead.ranDate, { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'}</span>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={6} className="px-4 py-12 text-center">
                <p className="text-sm font-medium text-[#173f59] dark:text-slate-200">Nenhum lead encontrado</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Ajuste a busca ou os filtros desta tabela.</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[360px] items-center justify-center rounded-xl border border-[#d6e2e9] bg-white text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300">
      <div className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin text-[#1e5d80] motion-reduce:animate-none dark:text-sky-300" aria-hidden="true" />Consultando pipeline Status no DataCrazy…</div>
    </div>
  );
}

const MarketingApresentacaoView = React.memo(function MarketingApresentacaoView() {
  const [snapshot, setSnapshot] = React.useState<ReportSnapshot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [stale, setStale] = React.useState(false);
  const [updatedAt, setUpdatedAt] = React.useState<Date | null>(null);
  const [mode, setMode] = React.useState<Mode>('day');
  const [selectedDate, setSelectedDate] = React.useState('');
  const [region, setRegion] = React.useState('all');
  const [attendant, setAttendant] = React.useState('all');

  const loadReport = React.useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/marketing/apresentacao${forceRefresh ? '?refresh=1' : ''}`, { cache: 'no-store' });
      const payload = await response.json() as ApiResponse<ReportSnapshot>;
      if (!response.ok || !payload.data) throw new Error(getApiError(payload, 'Não foi possível carregar a apresentação.'));
      setSnapshot(payload.data);
      setStale(Boolean(payload.stale));
      setUpdatedAt(new Date());
      setSelectedDate((current) => current || payload.data!.currentDate);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível consultar os dados do DataCrazy.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void loadReport(); }, [loadReport]);

  const currentDate = snapshot?.currentDate || '';
  const selectedReference = mode === 'day' ? selectedDate : currentDate;
  const scopedRows = React.useMemo(() => {
    if (!snapshot || !selectedReference) return [];
    return snapshot.leads.filter((lead) => {
      const metrics = getMetrics(lead, mode, selectedReference, currentDate);
      return (metrics.sent || metrics.released || metrics.ran)
        && (region === 'all' || lead.region === region)
        && (attendant === 'all' || lead.attendant === attendant);
    });
  }, [attendant, currentDate, mode, region, selectedReference, snapshot]);
  const totals = React.useMemo(() => sumMetrics(scopedRows, mode, selectedReference, currentDate), [currentDate, mode, scopedRows, selectedReference]);
  const availableRegions = React.useMemo(() => Array.from(new Set([...DEFAULT_REGIONS, ...(snapshot?.leads.map((lead) => lead.region) || [])])), [snapshot]);
  const availableAttendants = React.useMemo(() => Array.from(new Set(snapshot?.leads.map((lead) => lead.attendant) || [])).sort((a, b) => a.localeCompare(b, 'pt-BR')), [snapshot]);
  const visibleStartDate = currentDate ? shiftDate(currentDate, -6) : '';
  const reportLabel = mode === 'day' && selectedReference
    ? formatDate(selectedReference, { day: '2-digit', month: 'long', year: 'numeric' })
    : currentDate ? `${formatDate(visibleStartDate, { day: '2-digit', month: 'short' })} a ${formatDate(currentDate, { day: '2-digit', month: 'short', year: 'numeric' })}` : '';

  return (
    <ViewContainer className="space-y-5 pb-10 pt-3 sm:space-y-6">
      <header className="flex min-w-0 flex-col gap-4 rounded-xl border border-[#164d70] bg-[#174d70] px-4 py-4 text-white shadow-[0_8px_28px_-22px_rgba(12,54,81,0.6)] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div className="min-w-0">
          <h1 className="text-[21px] font-semibold leading-tight tracking-[-0.025em] sm:text-[24px]">Apresentação Marketing</h1>
          <p className="mt-1.5 max-w-3xl text-[12px] leading-5 text-sky-100/90 sm:text-[13px]">Acompanhe cadastros enviados, liberados e iniciados pela pipeline Status.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="inline-flex h-8 items-center gap-2 rounded-md border border-white/20 bg-white/[0.08] px-2.5 text-[11px] font-medium text-sky-50">
            <Database className="h-3.5 w-3.5" aria-hidden="true" /> DataCrazy
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadReport(true)}
            disabled={loading}
            className="h-8 gap-2 rounded-md border-white/30 bg-transparent px-2.5 text-[11px] font-semibold text-white hover:bg-white/10 hover:text-white disabled:opacity-60"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin motion-reduce:animate-none')} aria-hidden="true" />
            Atualizar
          </Button>
        </div>
      </header>

      <section aria-label="Parâmetros da apresentação" className="flex min-w-0 flex-col gap-4 border-b border-[#d5e1e9] bg-[#f2f7fa] px-3 py-3 dark:border-[#263b4b] dark:bg-[#101c26] sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="min-w-0">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600 dark:text-slate-400">Período</p>
          <div className="inline-flex rounded-lg border border-[#cbd9e2] bg-white p-1 dark:border-slate-700 dark:bg-slate-900" role="group" aria-label="Escolher período">
            <button type="button" aria-pressed={mode === 'day'} onClick={() => setMode('day')} className={cn('rounded-md px-3.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38708e] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900', mode === 'day' ? 'bg-[#1e5d80] text-white shadow-sm' : 'text-slate-600 hover:bg-[#edf4f7] hover:text-[#173f59] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white')}>Dia</button>
            <button type="button" aria-pressed={mode === 'week'} onClick={() => setMode('week')} className={cn('rounded-md px-3.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38708e] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900', mode === 'week' ? 'bg-[#1e5d80] text-white shadow-sm' : 'text-slate-600 hover:bg-[#edf4f7] hover:text-[#173f59] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white')}>Últimos 7 dias</button>
          </div>
        </div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(210px,1fr)_minmax(185px,0.85fr)] sm:items-end sm:gap-5">
          {mode === 'day' ? (
            <label className="min-w-0">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600 dark:text-slate-400">Data do relatório</span>
              <span className="relative block">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#47718a] dark:text-sky-300" aria-hidden="true" />
                <Input
                  type="date"
                  value={selectedDate}
                  min={visibleStartDate}
                  max={currentDate}
                  disabled={!snapshot}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  aria-label="Data do relatório, últimos sete dias"
                  className="h-10 rounded-lg border-[#cbd9e2] bg-white pl-10 text-xs text-[#173f59] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </span>
            </label>
          ) : (
            <div className="min-w-0">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600 dark:text-slate-400">Período fechado</span>
              <div className="flex h-10 items-center gap-2 rounded-lg border border-[#cbd9e2] bg-white px-3 text-xs text-[#173f59] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <CalendarDays className="h-4 w-4 shrink-0 text-[#47718a] dark:text-sky-300" aria-hidden="true" />{reportLabel || 'Carregando período…'}
              </div>
            </div>
          )}
          <div className="flex min-w-0 items-center gap-2 text-[11px] leading-4 text-slate-600 dark:text-slate-400">
            <Clock3 className="h-4 w-4 shrink-0 text-[#47718a] dark:text-sky-300" aria-hidden="true" />
            <span>{updatedAt ? `Atualizado às ${updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Aguardando atualização'}{stale ? ' · exibindo dados em cache' : ''}</span>
          </div>
        </div>
      </section>

      {error && snapshot ? (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-100">
          <span>Não foi possível atualizar agora; mantendo os dados carregados. {error}</span>
          <Button variant="outline" size="sm" onClick={() => void loadReport(true)} disabled={loading} className="h-8 gap-2 text-xs"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Tentar novamente</Button>
        </div>
      ) : null}

      {loading && !snapshot ? <LoadingState /> : error && !snapshot ? (
        <Alert variant="destructive" role="alert" className="rounded-xl">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><AlertTitle>Não foi possível carregar os dados</AlertTitle><AlertDescription className="mt-1">{error}</AlertDescription></div>
            <Button type="button" variant="outline" onClick={() => void loadReport(true)} disabled={loading} className="shrink-0 gap-2"><RefreshCw className="h-4 w-4" aria-hidden="true" />Tentar novamente</Button>
          </div>
        </Alert>
      ) : snapshot ? (
        <div className="space-y-5 sm:space-y-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch">
            <section aria-label={`Resumo do período ${reportLabel}`} className="grid min-w-0 flex-1 grid-cols-1 divide-y divide-[#e1eaf0] overflow-hidden rounded-xl border border-[#d6e2e9] bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950/80 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <MetricCell label="Cadastros enviados" value={totals.sent} note={mode === 'day' ? `Data a enviar: ${formatDate(selectedReference)}` : 'DT a enviar dentro do período'} tone="blue" />
              <MetricCell label="Cadastros liberados" value={totals.released} note={mode === 'day' ? 'Liberados na data selecionada' : 'Liberados nos últimos 7 dias'} tone="teal" />
              <MetricCell label={mode === 'day' ? 'Começou ontem' : 'Rodou no período'} value={totals.ran} note={mode === 'day' ? `RODOU em ${formatDate(shiftDate(selectedReference, -1))}` : 'RODOU nos últimos 7 dias'} tone="slate" />
            </section>
            <div className="w-full shrink-0 xl:w-[340px]"><CostEditor mode={mode} date={selectedReference} totalSent={totals.sent} /></div>
          </div>

          <section aria-label="Filtros por região e atendente" className="flex min-w-0 flex-col gap-3 rounded-lg border border-[#d6e2e9] bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-950/80 sm:flex-row sm:items-end sm:px-4">
            <div className="flex items-center gap-2 pb-0.5 text-xs font-semibold text-[#173f59] dark:text-slate-200 sm:mr-1"><Users className="h-4 w-4 text-[#47718a] dark:text-sky-300" aria-hidden="true" />Filtrar resumo</div>
            <label className="min-w-0 flex-1">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400">Região</span>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="h-9 rounded-lg border-[#cfdae2] text-xs dark:border-slate-700 dark:bg-slate-900"><SelectValue placeholder="Todas as regiões" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todas as regiões</SelectItem>{availableRegions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <label className="min-w-0 flex-1">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400">Atendente</span>
              <Select value={attendant} onValueChange={setAttendant}>
                <SelectTrigger className="h-9 rounded-lg border-[#cfdae2] text-xs dark:border-slate-700 dark:bg-slate-900"><SelectValue placeholder="Todos os atendentes" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todos os atendentes</SelectItem>{availableAttendants.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            {(region !== 'all' || attendant !== 'all') ? (
              <Button type="button" variant="ghost" onClick={() => { setRegion('all'); setAttendant('all'); }} className="h-9 gap-1.5 self-end px-2 text-xs text-slate-600 hover:text-[#1e5d80] dark:text-slate-400 dark:hover:text-sky-300"><X className="h-3.5 w-3.5" aria-hidden="true" />Limpar filtros</Button>
            ) : null}
          </section>

          {mode === 'week' ? <WeeklyTrend leads={scopedRows} currentDate={currentDate} /> : null}

          <div className="grid min-w-0 gap-5 lg:grid-cols-[1.12fr_0.88fr]">
            <RegionBreakdown rows={scopedRows} mode={mode} referenceDate={selectedReference} currentDate={currentDate} />
            <AttendantBreakdown rows={scopedRows} mode={mode} referenceDate={selectedReference} currentDate={currentDate} />
          </div>

          <LeadList rows={scopedRows} mode={mode} referenceDate={selectedReference} currentDate={currentDate} />
          <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">
            Fonte: pipeline Status do DataCrazy. No resumo diário, “Começou ontem” considera o campo RODOU DIA do dia anterior; os demais indicadores comparam a data escolhida.
          </p>
        </div>
      ) : null}
    </ViewContainer>
  );
});

MarketingApresentacaoView.displayName = 'MarketingApresentacaoView';

export default MarketingApresentacaoView;
