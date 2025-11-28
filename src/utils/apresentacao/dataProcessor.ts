import { formatarHorasParaHMS } from '@/utils/formatters';
import {
  calcularDiferenca,
  calcularDiferencaPercentual,
  formatarDiferenca,
  formatarDiferencaPercentual,
} from './processors/common';
import { DadosBasicos } from './processors/basicData';
import { processarSubPracas } from './processors/subPracas';
import { processarDias } from './processors/dias';
import { processarTurnos } from './processors/turnos';
import { processarOrigens } from './processors/origens';
import { processarDemanda } from './processors/demanda';

// Re-exportar helpers e tipos para compatibilidade
export * from './processors/common';
export * from './processors/basicData';

export interface DadosProcessados {
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
  subPracasComparativo: any[];
  semana1Dias: any[];
  semana2Dias: any[];
  turnosComparativo: any[];
  origensComparativo: any[];
  demandaItens: any[];
}

export const processarDadosCompletos = (dadosBasicos: DadosBasicos): DadosProcessados | null => {
  const { semana1, semana2, numeroSemana1, numeroSemana2, aderencia1, aderencia2, horasEntregues1, horasEntregues2, horasPlanejadas1, horasPlanejadas2 } = dadosBasicos;

  if (!semana1 || !semana2) return null;

  const resumoSemana1 = {
    numeroSemana: numeroSemana1,
    aderencia: aderencia1,
    horasPlanejadas: formatarHorasParaHMS(Math.abs(horasPlanejadas1).toString()),
    horasEntregues: formatarHorasParaHMS(Math.abs(horasEntregues1).toString()),
  };

  const resumoSemana2 = {
    numeroSemana: numeroSemana2,
    aderencia: aderencia2,
    horasPlanejadas: formatarHorasParaHMS(Math.abs(horasPlanejadas2).toString()),
    horasEntregues: formatarHorasParaHMS(Math.abs(horasEntregues2).toString()),
  };

  const variacaoResumo = {
    horasDiferenca: formatarDiferenca(calcularDiferenca(horasEntregues1, horasEntregues2), true),
    horasPercentual: formatarDiferencaPercentual(calcularDiferencaPercentual(horasEntregues1, horasEntregues2)),
    positiva: horasEntregues2 >= horasEntregues1,
  };

  // Processar Sub-Praças
  const subPracasComparativo = processarSubPracas(dadosBasicos);

  // Processar Dias
  const { semana1Dias, semana2Dias } = processarDias(dadosBasicos);

  // Processar Turnos
  const turnosComparativo = processarTurnos(dadosBasicos);

  // Processar Origens
  const origensComparativo = processarOrigens(dadosBasicos);

  // Processar Demanda
  const demandaItens = processarDemanda(dadosBasicos);

  return {
    resumoSemana1,
    resumoSemana2,
    variacaoResumo,
    subPracasComparativo,
    semana1Dias,
    semana2Dias,
    turnosComparativo,
    origensComparativo,
    demandaItens,
  };
};
