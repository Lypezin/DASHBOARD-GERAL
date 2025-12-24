import React from 'react';
import { safeRpc } from '@/lib/rpcWrapper';
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

export default async function PrintablePage({ searchParams }: PageProps) {
  const params = parsePrintParams(searchParams);

  if (!params) {
    return (
      <html>
        <body style={{ background: '#0f172a', color: 'white', padding: 24 }}>
          <h1>Parâmetros faltando</h1>
          <p>Informe sem1, sem2 e opcionalmente praca.</p>
        </body>
      </html>
    );
  }

  const { praca, ano1, ano2, semanaNum1, semanaNum2, numeroSemana1, numeroSemana2 } = params;

  // Inicializar cliente Supabase Server com cookies
  const supabase = createClient();

  // Buscar os dois conjuntos de dados via RPC com cliente autenticado
  const [semana1Result, semana2Result] = await Promise.all([
    safeRpc<DashboardResumoData>('dashboard_resumo', createFilterPayload(ano1, semanaNum1, praca), {
      timeout: 30000,
      validateParams: true,
      client: supabase
    }),
    safeRpc<DashboardResumoData>('dashboard_resumo', createFilterPayload(ano2, semanaNum2, praca), {
      timeout: 30000,
      validateParams: true,
      client: supabase
    }),
  ]);

  const semana1 = semana1Result.data;
  const semana2 = semana2Result.data;

  // Processar dados para os slides
  const processedData = processPrintData(semana1, semana2, numeroSemana1, numeroSemana2);

  const pageStyle = generatePrintStyles();

  return (
    <html>
      <head>
        <style dangerouslySetInnerHTML={{ __html: pageStyle }} />
      </head>
      <body data-print-ready="true">
        <ReportSlides
          praca={praca}
          numeroSemana1={numeroSemana1}
          numeroSemana2={numeroSemana2}
          processedData={processedData}
        />
      </body>
    </html>
  );
}


