import React from 'react';
import { DashboardResumoData } from '@/types';
import { parsePrintParams, createFilterPayload, generatePrintStyles } from '@/utils/apresentacao/printPageHelpers';
import { processPrintData } from '@/utils/apresentacao/printDataProcessor';
import { ReportSlides } from './components/ReportSlides';

import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: {
    praca?: string;
    sem1?: string;
    sem2?: string;
  };
}

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apresentação de Impressão',
};

export default async function PrintablePage({ searchParams }: PageProps) {
  const params = parsePrintParams(searchParams);

  if (!params) {
    return (
      <div style={{ background: '#0f172a', color: 'white', padding: 24, minHeight: '100vh' }}>
        <h1>Parâmetros faltando</h1>
        <p>Informe sem1, sem2 e opcionalmente praca.</p>
      </div>
    );
  }

  const { praca, ano1, ano2, semanaNum1, semanaNum2, numeroSemana1, numeroSemana2 } = params;

  // Inicializar cliente Supabase Server com cookies
  const supabase = createClient();

  // Buscar os dois conjuntos de dados via RPC com cliente autenticado
  const [semana1Result, semana2Result] = await Promise.all([
    supabase.rpc('dashboard_resumo', createFilterPayload(ano1, semanaNum1, praca)),
    supabase.rpc('dashboard_resumo', createFilterPayload(ano2, semanaNum2, praca)),
  ]);

  const semana1 = (semana1Result.error ? null : semana1Result.data) as DashboardResumoData | null;
  const semana2 = (semana2Result.error ? null : semana2Result.data) as DashboardResumoData | null;

  // Processar dados para os slides
  const processedData = processPrintData(semana1, semana2, numeroSemana1, numeroSemana2);

  const pageStyle = generatePrintStyles();

  return (
    <div data-print-ready="true">
      <style dangerouslySetInnerHTML={{ __html: pageStyle }} />
      <ReportSlides
        praca={praca}
        numeroSemana1={numeroSemana1}
        numeroSemana2={numeroSemana2}
        processedData={processedData}
      />
    </div>
  );
}


