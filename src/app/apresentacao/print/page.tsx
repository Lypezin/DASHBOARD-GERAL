import React from 'react';
import { safeRpc } from '@/lib/rpcWrapper';
import { DashboardResumoData } from '@/types';
import SlideCapa from '@/components/apresentacao/slides/SlideCapa';
import SlideAderenciaGeral from '@/components/apresentacao/slides/SlideAderenciaGeral';
import SlideSubPracas from '@/components/apresentacao/slides/SlideSubPracas';
import SlideAderenciaDiaria from '@/components/apresentacao/slides/SlideAderenciaDiaria';
import SlideTurnos from '@/components/apresentacao/slides/SlideTurnos';
import SlideOrigem from '@/components/apresentacao/slides/SlideOrigem';
import { parsePrintParams, createFilterPayload, generatePrintStyles } from '@/utils/apresentacao/printPageHelpers';
import { processPrintData } from '@/utils/apresentacao/printDataProcessor';

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

  // Buscar os dois conjuntos de dados via RPC
  const [semana1Result, semana2Result] = await Promise.all([
    safeRpc<DashboardResumoData>('dashboard_resumo', createFilterPayload(ano1, semanaNum1, praca), {
      timeout: 30000,
      validateParams: true
    }),
    safeRpc<DashboardResumoData>('dashboard_resumo', createFilterPayload(ano2, semanaNum2, praca), {
      timeout: 30000,
      validateParams: true
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
        <div className="page">
          <SlideCapa
            isVisible
            pracaSelecionada={praca}
            numeroSemana1={numeroSemana1}
            numeroSemana2={numeroSemana2}
            periodoSemana1={''}
            periodoSemana2={''}
          />
        </div>

        <div className="page">
          <SlideAderenciaGeral
            isVisible
            semana1={processedData.resumoSemana1}
            semana2={processedData.resumoSemana2}
            variacao={processedData.variacaoResumo}
          />
        </div>

        <div className="page">
          <SlideAderenciaDiaria
            isVisible
            numeroSemana1={numeroSemana1}
            numeroSemana2={numeroSemana2}
            semana1Dias={processedData.semana1Dias}
            semana2Dias={processedData.semana2Dias}
          />
        </div>

        {processedData.turnosPaginas.map((pagina, idx) => (
          <div className="page" key={`turnos-${idx}`}>
            <SlideTurnos
              isVisible
              numeroSemana1={numeroSemana1}
              numeroSemana2={numeroSemana2}
              paginaAtual={idx + 1}
              totalPaginas={processedData.turnosPaginas.length}
              itens={pagina as any}
            />
          </div>
        ))}

        {processedData.subPracasPaginas.map((pagina, idx) => (
          <div className="page" key={`subpracas-${idx}`}>
            <SlideSubPracas
              isVisible
              numeroSemana1={numeroSemana1}
              numeroSemana2={numeroSemana2}
              paginaAtual={idx + 1}
              totalPaginas={processedData.subPracasPaginas.length}
              itens={pagina as any}
            />
          </div>
        ))}

        {processedData.origensPaginas.map((pagina, idx) => (
          <div className="page" key={`origens-${idx}`}>
            <SlideOrigem
              isVisible
              numeroSemana1={numeroSemana1}
              numeroSemana2={numeroSemana2}
              paginaAtual={idx + 1}
              totalPaginas={processedData.origensPaginas.length}
              itens={pagina as any}
            />
          </div>
        ))}
      </body>
    </html>
  );
}


