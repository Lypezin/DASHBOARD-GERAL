import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnaliseTable } from '@/components/analise/AnaliseTable';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DedicadoInlineNotice } from './DedicadoInlineNotice';
import type { AderenciaOrigem } from '@/types';

type DedicadoOrigemRow = AderenciaOrigem & {
  segundos_realizados?: number;
  segundos_planejados?: number;
  taxa_aceitacao?: number;
  taxa_completude?: number;
};

interface DedicadoResumoProps {
  rows: Array<DedicadoOrigemRow & { label: string; horas_entregues?: string }>;
  loading: boolean;
  error?: string | null;
}

export function DedicadoResumo({
  rows,
  loading,
  error,
}: DedicadoResumoProps) {
  if (loading && rows.length === 0) return <DashboardSkeleton contentOnly />;

  return (
    <Card className="min-w-0 overflow-hidden border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/85">
      <CardHeader>
        <CardTitle className="text-lg font-black text-slate-950 dark:text-white">Resumo por Origem</CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Dados agrupados por origem, respeitando os filtros atuais de período, cidade e organização.
        </p>
      </CardHeader>
      {loading ? (
        <CardContent className="pb-0">
          <DedicadoInlineNotice message="Atualizando resumo por origem com os filtros atuais..." tone="info" />
        </CardContent>
      ) : null}
      {error ? (
        <CardContent className="pb-0">
          <DedicadoInlineNotice message={error} />
        </CardContent>
      ) : null}
      <CardContent className="max-w-full overflow-hidden p-0">
        <AnaliseTable data={rows} labelColumn="Origem" />
      </CardContent>
    </Card>
  );
}

export default DedicadoResumo;
