import { CurrentUser } from '@/types';
import { buildFilterPayload } from '@/utils/helpers';

export interface WeekInfo {
  semanaNumero: number;
  anoNumero: number;
}

export function parseWeekString(semana: string | number): WeekInfo {
  let semanaNumero: number;
  let anoNumero: number;

  if (typeof semana === 'string') {
    if (semana.includes('W')) {
      // Formato: "2025-W45" ou "S2025-W45"
      const anoMatch = semana.match(/(\d{4})/);
      const semanaMatch = semana.match(/W(\d+)/);
      anoNumero = anoMatch ? parseInt(anoMatch[1], 10) : new Date().getFullYear();
      semanaNumero = semanaMatch ? parseInt(semanaMatch[1], 10) : parseInt(semana, 10);
    } else {
      // Apenas número da semana, usar ano atual
      semanaNumero = parseInt(semana, 10);
      anoNumero = new Date().getFullYear();
    }
  } else {
    semanaNumero = semana;
    anoNumero = new Date().getFullYear();
  }

  return { semanaNumero, anoNumero };
}

export function createComparisonFilter(
  semana: string | number,
  pracaSelecionada: string | null,
  currentUser: CurrentUser | null
) {
  const { semanaNumero, anoNumero } = parseWeekString(semana);

  const filters = {
    ano: anoNumero,
    semana: semanaNumero,
    semanas: [], // Array vazio para evitar duplicação
    praca: pracaSelecionada,
    subPraca: null,
    origem: null,
    turno: null,
    subPracas: [],
    origens: [],
    turnos: [],
    filtroModo: 'ano_semana' as const,
    dataInicial: null,
    dataFinal: null,
  };

  return buildFilterPayload(filters, currentUser);
}
