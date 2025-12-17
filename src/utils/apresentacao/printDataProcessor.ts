/**
 * Processador de dados para página de impressão
 * Extraído de src/app/apresentacao/print/page.tsx
 */

import { DashboardResumoData } from '@/types';
import { processResumo } from './processors/processResumo';
import { processSubPracas } from './processors/processSubPracas';
import { processDias } from './processors/processDias';
import { processTurnos } from './processors/processTurnos';
import { processOrigens } from './processors/processOrigens';

export interface ProcessedPrintData {
  resumoSemana1: {
    numeroSemana: string;
    aderencia: number;
    horasPlanejadas: string;
    horasEntregues: string;
  };
  resumoSemana2: {
    numeroSemana: string;
    aderencia: number;
    horasPlanejadas: string;
    horasEntregues: string;
  };
  variacaoResumo: {
    horasDiferenca: string;
    horasPercentual: string;
    positiva: boolean;
  };
  semana1Dias: Array<{
    nome: string;
    sigla: string;
    aderencia: number;
    horasEntregues: string;
  }>;
  semana2Dias: Array<{
    nome: string;
    sigla: string;
    aderencia: number;
    horasEntregues: string;
    diferencaHoras: string;
    diferencaHorasPositiva: boolean;
    diferencaPercentualHoras: string;
    diferencaPercentualHorasPositiva: boolean;
    diferencaAderencia: string;
    diferencaAderenciaPositiva: boolean;
  }>;
  subPracasPaginas: any[][];
  turnosPaginas: any[][];
  origensPaginas: any[][];
}

export function processPrintData(
  semana1: DashboardResumoData | null,
  semana2: DashboardResumoData | null,
  numeroSemana1: string,
  numeroSemana2: string
): ProcessedPrintData {

  const { resumoSemana1, resumoSemana2, variacaoResumo } = processResumo(semana1, semana2, numeroSemana1, numeroSemana2);
  const subPracasPaginas = processSubPracas(semana1, semana2);
  const { semana1Dias, semana2Dias } = processDias(semana1, semana2);
  const turnosPaginas = processTurnos(semana1, semana2);
  const origensPaginas = processOrigens(semana1, semana2);

  return {
    resumoSemana1,
    resumoSemana2,
    variacaoResumo,
    semana1Dias,
    semana2Dias,
    subPracasPaginas,
    turnosPaginas,
    origensPaginas,
  };
}
