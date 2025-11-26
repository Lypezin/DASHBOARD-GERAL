/**
 * Processador de dados para página de impressão
 * Extraído de src/app/apresentacao/print/page.tsx
 */

import { converterHorasParaDecimal } from '@/utils/formatters';
import { DashboardResumoData, AderenciaDia, AderenciaSubPraca, AderenciaTurno, AderenciaOrigem } from '@/types';
import { formatSigned, formatHMS, chunkArray, diasOrdem, siglaDia, SUB_PRACAS_PER_PAGE, TURNOS_PER_PAGE, ORIGENS_PER_PAGE } from './printHelpers';

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
  const aderencia1 = semana1?.semanal?.[0]?.aderencia_percentual || 0;
  const aderencia2 = semana2?.semanal?.[0]?.aderencia_percentual || 0;
  const horasEntregues1 = converterHorasParaDecimal(semana1?.semanal?.[0]?.horas_entregues || '0');
  const horasEntregues2 = converterHorasParaDecimal(semana2?.semanal?.[0]?.horas_entregues || '0');
  const horasPlanejadas1 = converterHorasParaDecimal(semana1?.semanal?.[0]?.horas_a_entregar || '0');
  const horasPlanejadas2 = converterHorasParaDecimal(semana2?.semanal?.[0]?.horas_a_entregar || '0');

  const resumoSemana1 = {
    numeroSemana: numeroSemana1,
    aderencia: aderencia1,
    horasPlanejadas: formatHMS(Math.abs(horasPlanejadas1).toString()),
    horasEntregues: formatHMS(Math.abs(horasEntregues1).toString()),
  };
  const resumoSemana2 = {
    numeroSemana: numeroSemana2,
    aderencia: aderencia2,
    horasPlanejadas: formatHMS(Math.abs(horasPlanejadas2).toString()),
    horasEntregues: formatHMS(Math.abs(horasEntregues2).toString()),
  };
  const variacaoResumo = {
    horasDiferenca: (() => {
      const dif = horasEntregues2 - horasEntregues1;
      const prefix = dif > 0 ? '+' : dif < 0 ? '−' : '';
      return `${prefix}${formatHMS(Math.abs(dif).toString())}`;
    })(),
    horasPercentual: formatSigned(((horasEntregues2 - horasEntregues1) / (horasEntregues1 || 1)) * 100),
    positiva: horasEntregues2 >= horasEntregues1,
  };

  // Processar Sub Praças
  const subPracasSemana1 = semana1?.sub_praca || [];
  const subPracasSemana2 = semana2?.sub_praca || [];
  const subPracasSemana1Map = new Map(subPracasSemana1.map((i: AderenciaSubPraca) => [String(i.sub_praca || '').trim(), i]));
  const subPracasSemana2Map = new Map(subPracasSemana2.map((i: AderenciaSubPraca) => [String(i.sub_praca || '').trim(), i]));
  const todasSubPracas = Array.from(new Set([...subPracasSemana1Map.keys(), ...subPracasSemana2Map.keys()])) as string[];
  todasSubPracas.sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const subPracasComparativo = todasSubPracas.map((nome) => {
    const itemSemana1 = subPracasSemana1Map.get(nome) || ({} as any);
    const itemSemana2 = subPracasSemana2Map.get(nome) || ({} as any);
    const horasPlanejadasBase = converterHorasParaDecimal(itemSemana1?.horas_a_entregar || itemSemana2?.horas_a_entregar || '0');
    const horasSem1 = converterHorasParaDecimal(itemSemana1?.horas_entregues || '0');
    const horasSem2 = converterHorasParaDecimal(itemSemana2?.horas_entregues || '0');
    const aderenciaSem1 = itemSemana1?.aderencia_percentual || 0;
    const aderenciaSem2 = itemSemana2?.aderencia_percentual || 0;

    return {
      nome: nome.toUpperCase(),
      horasPlanejadas: formatHMS(Math.abs(horasPlanejadasBase).toString()),
      semana1: { aderencia: aderenciaSem1, horasEntregues: formatHMS(Math.abs(horasSem1).toString()) },
      semana2: { aderencia: aderenciaSem2, horasEntregues: formatHMS(Math.abs(horasSem2).toString()) },
      variacoes: [
        {
          label: 'Δ Horas', valor: (() => {
            const dif = horasSem2 - horasSem1;
            const prefix = dif > 0 ? '+' : dif < 0 ? '−' : '';
            return `${prefix}${formatHMS(Math.abs(dif).toString())}`;
          })(), positivo: horasSem2 - horasSem1 >= 0
        },
        { label: '% Horas', valor: formatSigned(((horasSem2 - horasSem1) / (horasSem1 || 1)) * 100), positivo: ((horasSem2 - horasSem1) / (horasSem1 || 1)) * 100 >= 0 },
        { label: '% Aderência', valor: formatSigned(((aderenciaSem2 - aderenciaSem1) / (aderenciaSem1 || 1)) * 100), positivo: ((aderenciaSem2 - aderenciaSem1) / (aderenciaSem1 || 1)) * 100 >= 0 },
      ],
    };
  });
  const subPracasPaginas = chunkArray(subPracasComparativo, SUB_PRACAS_PER_PAGE);

  // Processar Dias
  const diasSemana1Map = new Map((semana1?.dia || []).map((d: AderenciaDia) => [d.dia_da_semana, d]));
  const diasSemana2Map = new Map((semana2?.dia || []).map((d: AderenciaDia) => [d.dia_da_semana, d]));

  const semana1Dias = diasOrdem.map((dia) => {
    const info = diasSemana1Map.get(dia) || ({} as Partial<AderenciaDia>);
    const horas = converterHorasParaDecimal(info?.horas_entregues || '0');
    return { nome: dia, sigla: siglaDia(dia), aderencia: info?.aderencia_percentual || 0, horasEntregues: formatHMS(horas.toString()) };
  });
  const semana2Dias = diasOrdem.map((dia) => {
    const info1 = diasSemana1Map.get(dia) || ({} as Partial<AderenciaDia>);
    const info2 = diasSemana2Map.get(dia) || ({} as Partial<AderenciaDia>);
    const horas1 = converterHorasParaDecimal(info1?.horas_entregues || '0');
    const horas2 = converterHorasParaDecimal(info2?.horas_entregues || '0');
    const aderencia1Dia = info1?.aderencia_percentual || 0;
    const aderencia2Dia = info2?.aderencia_percentual || 0;
    const difHoras = horas2 - horas1;
    return {
      nome: dia, sigla: siglaDia(dia), aderencia: aderencia2Dia, horasEntregues: formatHMS(horas2.toString()),
      diferencaHoras: `${difHoras > 0 ? '+' : difHoras < 0 ? '−' : ''}${formatHMS(Math.abs(difHoras).toString())}`,
      diferencaHorasPositiva: difHoras >= 0,
      diferencaPercentualHoras: formatSigned(((horas2 - horas1) / (horas1 || 1)) * 100),
      diferencaPercentualHorasPositiva: ((horas2 - horas1) / (horas1 || 1)) * 100 >= 0,
      diferencaAderencia: formatSigned(((aderencia2Dia - aderencia1Dia) / (aderencia1Dia || 1)) * 100),
      diferencaAderenciaPositiva: ((aderencia2Dia - aderencia1Dia) / (aderencia1Dia || 1)) * 100 >= 0,
    };
  });

  // Processar Turnos
  const turnosSemana1 = semana1?.turno || [];
  const turnosSemana2 = semana2?.turno || [];
  const turnosSemana1Map = new Map(turnosSemana1.map((t: AderenciaTurno) => [String(t.turno || '').trim(), t]));
  const turnosSemana2Map = new Map(turnosSemana2.map((t: AderenciaTurno) => [String(t.turno || '').trim(), t]));
  const todosTurnos = Array.from(new Set([...turnosSemana1Map.keys(), ...turnosSemana2Map.keys()])) as string[];
  todosTurnos.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const turnosComparativo = todosTurnos.map((nomeTurno) => {
    const t1 = turnosSemana1Map.get(nomeTurno) || ({} as any);
    const t2 = turnosSemana2Map.get(nomeTurno) || ({} as any);
    const h1 = converterHorasParaDecimal(t1?.horas_entregues || '0');
    const h2 = converterHorasParaDecimal(t2?.horas_entregues || '0');
    const a1 = t1?.aderencia_percentual || 0;
    const a2 = t2?.aderencia_percentual || 0;
    return {
      nome: nomeTurno.toUpperCase(),
      semana1: { aderencia: a1, horasEntregues: formatHMS(Math.abs(h1).toString()) },
      semana2: { aderencia: a2, horasEntregues: formatHMS(Math.abs(h2).toString()) },
      variacoes: [
        { label: 'Δ Horas', valor: `${h2 - h1 > 0 ? '+' : h2 - h1 < 0 ? '−' : ''}${formatHMS(Math.abs(h2 - h1).toString())}`, positivo: h2 - h1 >= 0 },
        { label: '% Horas', valor: formatSigned(((h2 - h1) / (h1 || 1)) * 100), positivo: ((h2 - h1) / (h1 || 1)) * 100 >= 0 },
        { label: '% Aderência', valor: formatSigned(((a2 - a1) / (a1 || 1)) * 100), positivo: ((a2 - a1) / (a1 || 1)) * 100 >= 0 },
      ],
    };
  });
  const turnosPaginas = chunkArray(turnosComparativo, TURNOS_PER_PAGE);

  // Processar Origens
  const origensSemana1 = semana1?.origem || [];
  const origensSemana2 = semana2?.origem || [];
  const origensSemana1Map = new Map(origensSemana1.map((o: AderenciaOrigem) => [String(o.origem || '').trim(), o]));
  const origensSemana2Map = new Map(origensSemana2.map((o: AderenciaOrigem) => [String(o.origem || '').trim(), o]));
  const todasOrigens = Array.from(new Set([...origensSemana1Map.keys(), ...origensSemana2Map.keys()])) as string[];
  todasOrigens.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const origensComparativo = todasOrigens.map((nome) => {
    const o1 = origensSemana1Map.get(nome) || ({} as any);
    const o2 = origensSemana2Map.get(nome) || ({} as any);
    const horasPlanejadasBase = converterHorasParaDecimal(o1?.horas_a_entregar || o2?.horas_a_entregar || '0');
    const h1 = converterHorasParaDecimal(o1?.horas_entregues || '0');
    const h2 = converterHorasParaDecimal(o2?.horas_entregues || '0');
    const a1 = o1?.aderencia_percentual || 0;
    const a2 = o2?.aderencia_percentual || 0;
    return {
      nome: nome.toUpperCase(),
      horasPlanejadas: formatHMS(Math.abs(horasPlanejadasBase).toString()),
      semana1: { aderencia: a1, horasEntregues: formatHMS(Math.abs(h1).toString()) },
      semana2: { aderencia: a2, horasEntregues: formatHMS(Math.abs(h2).toString()) },
      variacoes: [
        { label: 'Δ Horas', valor: `${h2 - h1 > 0 ? '+' : h2 - h1 < 0 ? '−' : ''}${formatHMS(Math.abs(h2 - h1).toString())}`, positivo: h2 - h1 >= 0 },
        { label: '% Horas', valor: formatSigned(((h2 - h1) / (h1 || 1)) * 100), positivo: ((h2 - h1) / (h1 || 1)) * 100 >= 0 },
        { label: '% Aderência', valor: formatSigned(((a2 - a1) / (a1 || 1)) * 100), positivo: ((a2 - a1) / (a1 || 1)) * 100 >= 0 },
      ],
    };
  });
  const origensPaginas = chunkArray(origensComparativo, ORIGENS_PER_PAGE);

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

