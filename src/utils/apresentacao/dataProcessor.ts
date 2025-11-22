import { DashboardResumoData } from '@/types';
import { formatarHorasParaHMS, converterHorasParaDecimal } from '@/utils/formatters';
import { formatSignedInteger, formatSignedPercent } from '@/components/apresentacao/utils';

const diasOrdem = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const siglaDia = (dia: string) => dia.slice(0, 3).toUpperCase();

export const chunkArray = <T,>(array: T[], size: number): T[][] => {
  if (size <= 0) return [array];
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

export const formatarNumeroInteiro = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Number.isFinite(valor) ? valor : 0);

export const extrairNumeroSemana = (semana: string) => {
  if (semana?.includes('-W')) {
    return semana.split('-W')[1];
  }
  return semana;
};

export const calcularPeriodoSemana = (numeroSemana: string) => {
  const semanaNum = parseInt(numeroSemana, 10);
  if (Number.isNaN(semanaNum)) return '';
  const anoAtual = new Date().getFullYear();
  const primeiraSemana = new Date(anoAtual, 0, 1 + (semanaNum - 1) * 7);
  const primeiraDiaSemana = primeiraSemana.getDate() - primeiraSemana.getDay() + 1;
  const inicio = new Date(primeiraSemana.setDate(primeiraDiaSemana));
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  const formatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${formatter.format(inicio)} - ${formatter.format(fim)}`;
};

export const calcularDiferenca = (valor1: number, valor2: number) => valor2 - valor1;

export const formatarDiferenca = (diferenca: number, isTime: boolean = false) => {
  if (!Number.isFinite(diferenca)) {
    return isTime ? '0:00:00' : '0';
  }

  if (isTime) {
    const horas = Math.abs(diferenca);
    const prefix = diferenca > 0 ? '+' : diferenca < 0 ? '−' : '';
    return `${prefix}${formatarHorasParaHMS(horas.toString())}`;
  }

  if (diferenca === 0) {
    return '0';
  }

  return formatSignedInteger(diferenca);
};

export const calcularDiferencaPercentual = (valor1: number, valor2: number) => {
  if (!Number.isFinite(valor1) || valor1 === 0) return 0;
  return ((valor2 - valor1) / valor1) * 100;
};

export const formatarDiferencaPercentual = (diferenca: number) => {
  return formatSignedPercent(diferenca);
};

export interface DadosBasicos {
  semana1: DashboardResumoData | null;
  semana2: DashboardResumoData | null;
  numeroSemana1: string;
  numeroSemana2: string;
  periodoSemana1: string;
  periodoSemana2: string;
  aderencia1: number;
  aderencia2: number;
  horasEntregues1: number;
  horasEntregues2: number;
  horasPlanejadas1: number;
  horasPlanejadas2: number;
}

export const processarDadosBasicos = (
  dadosComparacao: DashboardResumoData[],
  semanasSelecionadas: string[]
): DadosBasicos => {
  if (!dadosComparacao || dadosComparacao.length < 2) {
    return {
      semana1: null,
      semana2: null,
      numeroSemana1: '—',
      numeroSemana2: '—',
      periodoSemana1: '',
      periodoSemana2: '',
      aderencia1: 0,
      aderencia2: 0,
      horasEntregues1: 0,
      horasEntregues2: 0,
      horasPlanejadas1: 0,
      horasPlanejadas2: 0,
    };
  }

  const sem1 = dadosComparacao[0];
  const sem2 = dadosComparacao[1];
  const semanaSelecionada1 = semanasSelecionadas[0] ?? '';
  const semanaSelecionada2 = semanasSelecionadas[1] ?? '';
  const numSem1 = extrairNumeroSemana(semanaSelecionada1) || semanaSelecionada1 || '—';
  const numSem2 = extrairNumeroSemana(semanaSelecionada2) || semanaSelecionada2 || '—';
  
  return {
    semana1: sem1,
    semana2: sem2,
    numeroSemana1: numSem1,
    numeroSemana2: numSem2,
    periodoSemana1: calcularPeriodoSemana(numSem1),
    periodoSemana2: calcularPeriodoSemana(numSem2),
    aderencia1: sem1?.semanal?.[0]?.aderencia_percentual || 0,
    aderencia2: sem2?.semanal?.[0]?.aderencia_percentual || 0,
    horasEntregues1: converterHorasParaDecimal(sem1?.semanal?.[0]?.horas_entregues || '0'),
    horasEntregues2: converterHorasParaDecimal(sem2?.semanal?.[0]?.horas_entregues || '0'),
    horasPlanejadas1: converterHorasParaDecimal(sem1?.semanal?.[0]?.horas_a_entregar || '0'),
    horasPlanejadas2: converterHorasParaDecimal(sem2?.semanal?.[0]?.horas_a_entregar || '0'),
  };
};

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
  const subPracasSemana1 = semana1.sub_praca || [];
  const subPracasSemana2 = semana2.sub_praca || [];
  const subPracasSemana1Map = new Map(
    subPracasSemana1.map((item) => [(item.sub_praca || '').trim(), item])
  );
  const subPracasSemana2Map = new Map(
    subPracasSemana2.map((item) => [(item.sub_praca || '').trim(), item])
  );

  const todasSubPracas = Array.from(
    new Set([...subPracasSemana1Map.keys(), ...subPracasSemana2Map.keys()])
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const subPracasComparativo = todasSubPracas.map((nome) => {
    const itemSemana1 = subPracasSemana1Map.get(nome) || ({} as any);
    const itemSemana2 = subPracasSemana2Map.get(nome) || ({} as any);
    const horasPlanejadasBase = converterHorasParaDecimal(
      itemSemana1?.horas_a_entregar || itemSemana2?.horas_a_entregar || '0'
    );
    const horasSem1 = converterHorasParaDecimal(itemSemana1?.horas_entregues || '0');
    const horasSem2 = converterHorasParaDecimal(itemSemana2?.horas_entregues || '0');
    const aderenciaSem1 = itemSemana1?.aderencia_percentual || 0;
    const aderenciaSem2 = itemSemana2?.aderencia_percentual || 0;

    const diffHoras = calcularDiferenca(horasSem1, horasSem2);
    const diffHorasPercent = calcularDiferencaPercentual(horasSem1, horasSem2);
    const diffAderenciaPercent = calcularDiferencaPercentual(aderenciaSem1, aderenciaSem2);

    return {
      nome: nome.toUpperCase(),
      horasPlanejadas: formatarHorasParaHMS(Math.abs(horasPlanejadasBase).toString()),
      semana1: {
        aderencia: aderenciaSem1,
        horasEntregues: formatarHorasParaHMS(Math.abs(horasSem1).toString()),
      },
      semana2: {
        aderencia: aderenciaSem2,
        horasEntregues: formatarHorasParaHMS(Math.abs(horasSem2).toString()),
      },
      variacoes: [
        {
          label: 'Δ Horas',
          valor: formatarDiferenca(diffHoras, true),
          positivo: diffHoras >= 0,
        },
        {
          label: '% Horas',
          valor: formatarDiferencaPercentual(diffHorasPercent),
          positivo: diffHorasPercent >= 0,
        },
        {
          label: '% Aderência',
          valor: formatarDiferencaPercentual(diffAderenciaPercent),
          positivo: diffAderenciaPercent >= 0,
        },
      ],
    };
  });

  // Processar Dias
  const diasSemana1Map = new Map((semana1.dia || []).map((item) => [item.dia_da_semana, item]));
  const diasSemana2Map = new Map((semana2.dia || []).map((item) => [item.dia_da_semana, item]));

  const semana1Dias = diasOrdem.map((dia) => {
    const info = diasSemana1Map.get(dia) || ({} as any);
    const horas = converterHorasParaDecimal(info?.horas_entregues || '0');
    return {
      nome: dia,
      sigla: siglaDia(dia),
      aderencia: info?.aderencia_percentual || 0,
      horasEntregues: formatarHorasParaHMS(horas.toString()),
    };
  });

  const semana2Dias = diasOrdem.map((dia) => {
    const info1 = diasSemana1Map.get(dia) || ({} as any);
    const info2 = diasSemana2Map.get(dia) || ({} as any);
    const horas1 = converterHorasParaDecimal(info1?.horas_entregues || '0');
    const horas2 = converterHorasParaDecimal(info2?.horas_entregues || '0');
    const aderencia1Dia = info1?.aderencia_percentual || 0;
    const aderencia2Dia = info2?.aderencia_percentual || 0;
    return {
      nome: dia,
      sigla: siglaDia(dia),
      aderencia: aderencia2Dia,
      horasEntregues: formatarHorasParaHMS(horas2.toString()),
      diferencaHoras: formatarDiferenca(calcularDiferenca(horas1, horas2), true),
      diferencaHorasPositiva: horas2 - horas1 >= 0,
      diferencaPercentualHoras: formatarDiferencaPercentual(calcularDiferencaPercentual(horas1, horas2)),
      diferencaPercentualHorasPositiva: calcularDiferencaPercentual(horas1, horas2) >= 0,
      diferencaAderencia: formatarDiferencaPercentual(calcularDiferencaPercentual(aderencia1Dia || 0.0001, aderencia2Dia || 0)),
      diferencaAderenciaPositiva: calcularDiferencaPercentual(aderencia1Dia || 0.0001, aderencia2Dia || 0) >= 0,
    };
  });

  // Processar Turnos
  const turnosSemana1 = semana1.turno || [];
  const turnosSemana2 = semana2.turno || [];
  const turnosSemana1Map = new Map(
    turnosSemana1.map((turno) => [(turno.periodo || '').trim(), turno])
  );
  const turnosSemana2Map = new Map(
    turnosSemana2.map((turno) => [(turno.periodo || '').trim(), turno])
  );

  const todosTurnos = Array.from(
    new Set([...turnosSemana1Map.keys(), ...turnosSemana2Map.keys()])
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const turnosComparativo = todosTurnos.map((nomeTurno) => {
    const turnoSemana1 = turnosSemana1Map.get(nomeTurno) || ({} as any);
    const turnoSemana2 = turnosSemana2Map.get(nomeTurno) || ({} as any);
    const horasSem1 = converterHorasParaDecimal(turnoSemana1?.horas_entregues || '0');
    const horasSem2 = converterHorasParaDecimal(turnoSemana2?.horas_entregues || '0');
    const aderenciaSem1 = turnoSemana1?.aderencia_percentual || 0;
    const aderenciaSem2 = turnoSemana2?.aderencia_percentual || 0;

    const diffHoras = calcularDiferenca(horasSem1, horasSem2);
    const diffHorasPercent = calcularDiferencaPercentual(horasSem1, horasSem2);
    const diffAderenciaPercent = calcularDiferencaPercentual(aderenciaSem1, aderenciaSem2);

    return {
      nome: nomeTurno.toUpperCase(),
      semana1: {
        aderencia: aderenciaSem1,
        horasEntregues: formatarHorasParaHMS(Math.abs(horasSem1).toString()),
      },
      semana2: {
        aderencia: aderenciaSem2,
        horasEntregues: formatarHorasParaHMS(Math.abs(horasSem2).toString()),
      },
      variacoes: [
        {
          label: 'Δ Horas',
          valor: formatarDiferenca(diffHoras, true),
          positivo: diffHoras >= 0,
        },
        {
          label: '% Horas',
          valor: formatarDiferencaPercentual(diffHorasPercent),
          positivo: diffHorasPercent >= 0,
        },
        {
          label: '% Aderência',
          valor: formatarDiferencaPercentual(diffAderenciaPercent),
          positivo: diffAderenciaPercent >= 0,
        },
      ],
    };
  });

  // Processar Origens
  const origensSemana1 = semana1.origem || [];
  const origensSemana2 = semana2.origem || [];
  const origensSemana1Map = new Map(
    origensSemana1.map((item) => [(item.origem || '').trim(), item])
  );
  const origensSemana2Map = new Map(
    origensSemana2.map((item) => [(item.origem || '').trim(), item])
  );

  const todasOrigens = Array.from(
    new Set([...origensSemana1Map.keys(), ...origensSemana2Map.keys()])
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const origensComparativo = todasOrigens.map((origemNome) => {
    const origemSemana1 = origensSemana1Map.get(origemNome) || ({} as any);
    const origemSemana2 = origensSemana2Map.get(origemNome) || ({} as any);
    const horasPlanejadasBase = converterHorasParaDecimal(
      origemSemana1?.horas_a_entregar || origemSemana2?.horas_a_entregar || '0'
    );
    const horasSem1 = converterHorasParaDecimal(origemSemana1?.horas_entregues || '0');
    const horasSem2 = converterHorasParaDecimal(origemSemana2?.horas_entregues || '0');
    const aderenciaSem1 = origemSemana1?.aderencia_percentual || 0;
    const aderenciaSem2 = origemSemana2?.aderencia_percentual || 0;

    const diffHoras = calcularDiferenca(horasSem1, horasSem2);
    const diffHorasPercent = calcularDiferencaPercentual(horasSem1, horasSem2);
    const diffAderenciaPercent = calcularDiferencaPercentual(aderenciaSem1, aderenciaSem2);

    return {
      nome: origemNome.toUpperCase(),
      horasPlanejadas: formatarHorasParaHMS(Math.abs(horasPlanejadasBase).toString()),
      semana1: {
        aderencia: aderenciaSem1,
        horasEntregues: formatarHorasParaHMS(Math.abs(horasSem1).toString()),
      },
      semana2: {
        aderencia: aderenciaSem2,
        horasEntregues: formatarHorasParaHMS(Math.abs(horasSem2).toString()),
      },
      variacoes: [
        {
          label: 'Δ Horas',
          valor: formatarDiferenca(diffHoras, true),
          positivo: diffHoras >= 0,
        },
        {
          label: '% Horas',
          valor: formatarDiferencaPercentual(diffHorasPercent),
          positivo: diffHorasPercent >= 0,
        },
        {
          label: '% Aderência',
          valor: formatarDiferencaPercentual(diffAderenciaPercent),
          positivo: diffAderenciaPercent >= 0,
        },
      ],
    };
  });

  // Processar Demanda
  const totaisSemana1 = semana1.totais || {};
  const totaisSemana2 = semana2.totais || {};

  const demandaItens = [
    {
      label: 'Ofertadas',
      icone: '📦',
      valor1: Number(totaisSemana1.corridas_ofertadas || 0),
      valor2: Number(totaisSemana2.corridas_ofertadas || 0),
    },
    {
      label: 'Aceitas',
      icone: '🤝',
      valor1: Number(totaisSemana1.corridas_aceitas || 0),
      valor2: Number(totaisSemana2.corridas_aceitas || 0),
    },
    {
      label: 'Completadas',
      icone: '🏁',
      valor1: Number(totaisSemana1.corridas_completadas || 0),
      valor2: Number(totaisSemana2.corridas_completadas || 0),
    },
    {
      label: 'Rejeitadas',
      icone: '⛔',
      valor1: Number(totaisSemana1.corridas_rejeitadas || 0),
      valor2: Number(totaisSemana2.corridas_rejeitadas || 0),
    },
  ].map((item) => {
    const diffValor = calcularDiferenca(item.valor1, item.valor2);
    const diffPercent = calcularDiferencaPercentual(item.valor1 || 0.0001, item.valor2 || 0);
    return {
      label: item.label,
      icone: item.icone,
      semana1Valor: formatarNumeroInteiro(item.valor1),
      semana2Valor: formatarNumeroInteiro(item.valor2),
      variacaoValor: formatarDiferenca(diffValor),
      variacaoPositiva: diffValor >= 0,
      variacaoPercentual: formatarDiferencaPercentual(diffPercent),
      variacaoPercentualPositiva: diffPercent >= 0,
    };
  });

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

