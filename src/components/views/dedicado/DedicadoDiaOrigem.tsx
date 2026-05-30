import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnaliseDiaOrigemTable } from '../analise/components/AnaliseDiaOrigemTable';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DedicadoInlineNotice } from './DedicadoInlineNotice';
import type { AderenciaDiaOrigem } from '@/types';
import type { FilterPayload } from '@/types/filters';

type DedicadoDiaOrigemRow = AderenciaDiaOrigem & {
  dia_semana?: string;
  dia_da_semana?: string;
  data?: string;
  data_do_periodo?: string;
};

export function buildDayDateMap(diaOrigem: AderenciaDiaOrigem[], filterPayload: FilterPayload) {
  const map: Record<string, string> = {};

  (diaOrigem as DedicadoDiaOrigemRow[]).forEach((dia) => {
    const dayName = dia.dia || dia.dia_semana || dia.dia_da_semana;
    const rawDate = dia.data || dia.data_do_periodo;
    if (!dayName || !rawDate || typeof rawDate !== 'string') return;

    const normalizedKey = dayName.split('-')[0].trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const parts = rawDate.split('T')[0].split('-');

    if (parts.length === 3) {
      const [, month, day] = parts;
      map[normalizedKey] = `${day}/${month}`;
    }
  });

  if (Object.keys(map).length > 0 || !filterPayload?.p_ano || !filterPayload?.p_semana) {
    return map;
  }

  try {
    const year = Number(filterPayload.p_ano);
    const week = Number(filterPayload.p_semana);
    const jan4 = new Date(year, 0, 4);
    const jan4Day = jan4.getDay() || 7;
    const monday1 = new Date(jan4.getTime());
    monday1.setDate(jan4.getDate() - (jan4Day - 1));

    const startOfSpecifiedWeek = new Date(monday1.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
    const nomesDias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];

    nomesDias.forEach((nome, index) => {
      const curr = new Date(startOfSpecifiedWeek.getTime() + index * 24 * 60 * 60 * 1000);
      const dStr = String(curr.getDate()).padStart(2, '0');
      const mStr = String(curr.getMonth() + 1).padStart(2, '0');
      map[nome] = `${dStr}/${mStr}`;
    });
  } catch {
    return map;
  }

  return map;
}

interface DedicadoDiaOrigemProps {
  data: AderenciaDiaOrigem[];
  dayDateMap: Record<string, string>;
  loading: boolean;
  error?: string | null;
}

export function DedicadoDiaOrigem({
  data,
  dayDateMap,
  loading,
  error,
}: DedicadoDiaOrigemProps) {
  if (loading) return <DashboardSkeleton contentOnly />;

  return (
    <Card className="min-w-0 overflow-hidden border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/85">
      <CardHeader>
        <CardTitle className="text-lg font-black text-slate-950 dark:text-white">Dia x Origem</CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Matriz migrada da guia Análise e filtrada para as origens do período atual.
        </p>
      </CardHeader>
      <CardContent className="min-w-0 p-3 sm:p-6">
        {error ? <DedicadoInlineNotice message={error} /> : null}
        <AnaliseDiaOrigemTable data={data} dayDateMap={dayDateMap} />
      </CardContent>
    </Card>
  );
}

export default DedicadoDiaOrigem;
