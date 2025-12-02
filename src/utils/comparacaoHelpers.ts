import { CurrentUser, AderenciaDia } from '@/types';
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

/**
 * Encontra os dados de aderência para um dia específico da semana
 * lida com diferentes formatos de dia (string, iso, date)
 */
export function findDayData(
  diaRef: string,
  aderenciaDia: AderenciaDia[] | undefined
): AderenciaDia | undefined {
  if (!aderenciaDia || aderenciaDia.length === 0) return undefined;

  return aderenciaDia.find(d => {
    // Tentativa 1: Match por dia_da_semana (string)
    if (d.dia_da_semana) {
      const diaApi = d.dia_da_semana.toLowerCase().trim();
      const diaTarget = diaRef.toLowerCase().trim();

      if (diaApi === diaTarget) return true;
      if (diaApi.includes(diaTarget) || diaTarget.includes(diaApi)) return true;

      const mapDias: Record<string, string> = {
        'monday': 'segunda', 'tuesday': 'terça', 'wednesday': 'quarta',
        'thursday': 'quinta', 'friday': 'sexta', 'saturday': 'sábado', 'sunday': 'domingo'
      };
      if (mapDias[diaApi] && mapDias[diaApi].includes(diaTarget)) return true;
    }

    // Tentativa 2: Match por dia_iso (number)
    // dia_iso: 1 (Segunda) a 7 (Domingo)
    if (d.dia_iso) {
      const mapIso: Record<number, string> = {
        1: 'segunda', 2: 'terça', 3: 'quarta', 4: 'quinta', 5: 'sexta', 6: 'sábado', 7: 'domingo'
      };
      const diaTarget = diaRef.toLowerCase().trim();
      if (mapIso[d.dia_iso] && mapIso[d.dia_iso].includes(diaTarget)) return true;
    }

    // Tentativa 3: Se tiver campo 'data', extrair o dia da semana
    if (d.data) {
      try {
        const date = new Date(d.data + 'T00:00:00');
        const dayOfWeek = date.getDay(); // 0=Domingo, 1=Segunda, ...
        const mapDayNumber: Record<number, string> = {
          0: 'domingo', 1: 'segunda', 2: 'terça', 3: 'quarta',
          4: 'quinta', 5: 'sexta', 6: 'sábado'
        };
        const diaFromDate = mapDayNumber[dayOfWeek];
        const diaTarget = diaRef.toLowerCase().trim();
        if (diaFromDate && diaFromDate.includes(diaTarget)) return true;
      } catch (e) {
        // Ignorar erros de parse de data
      }
    }

    return false;
  });
}
