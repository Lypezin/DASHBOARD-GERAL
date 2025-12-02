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
 * Normaliza uma string para comparação (remove acentos e converte para minúsculas)
 */
function normalizeString(str: string): string {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
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

  const diaRefNorm = normalizeString(diaRef);

  return aderenciaDia.find(d => {
    // Tentativa 1: Match por dia_da_semana (string)
    if (d.dia_da_semana) {
      const diaApiNorm = normalizeString(d.dia_da_semana);

      if (diaApiNorm === diaRefNorm) return true;
      if (diaApiNorm.includes(diaRefNorm) || diaRefNorm.includes(diaApiNorm)) return true;

      // Mapa estendido com variações sem acento e em inglês
      const mapDias: Record<string, string> = {
        'monday': 'segunda', 'segunda': 'segunda', 'seg': 'segunda',
        'tuesday': 'terca', 'terca': 'terca', 'ter': 'terca',
        'wednesday': 'quarta', 'quarta': 'quarta', 'qua': 'quarta',
        'thursday': 'quinta', 'quinta': 'quinta', 'qui': 'quinta',
        'friday': 'sexta', 'sexta': 'sexta', 'sex': 'sexta',
        'saturday': 'sabado', 'sabado': 'sabado', 'sab': 'sabado',
        'sunday': 'domingo', 'domingo': 'domingo', 'dom': 'domingo'
      };

      // Tenta mapear ambos para uma chave comum
      const keyApi = mapDias[diaApiNorm] || diaApiNorm;
      const keyRef = mapDias[diaRefNorm] || diaRefNorm;

      if (keyApi === keyRef) return true;
    }

    // Tentativa 2: Match por dia_iso (number)
    // dia_iso: 1 (Segunda) a 7 (Domingo)
    if (d.dia_iso) {
      const mapIso: Record<number, string> = {
        1: 'segunda', 2: 'terca', 3: 'quarta', 4: 'quinta', 5: 'sexta', 6: 'sabado', 7: 'domingo'
      };
      // Normalizar o valor do mapa também (embora já esteja sem acento ali)
      const keyIso = mapIso[d.dia_iso];

      // Mapa reverso para o diaRef (caso ele seja 'terça' e o mapa tenha 'terca')
      const mapDiasRef: Record<string, string> = {
        'segunda': 'segunda', 'terça': 'terca', 'terca': 'terca',
        'quarta': 'quarta', 'quinta': 'quinta', 'sexta': 'sexta',
        'sábado': 'sabado', 'sabado': 'sabado', 'domingo': 'domingo'
      };
      const keyRefNorm = mapDiasRef[diaRefNorm] || diaRefNorm;

      if (keyIso && keyIso === keyRefNorm) return true;
    }

    // Tentativa 3: Se tiver campo 'data', extrair o dia da semana
    if (d.data) {
      try {
        const date = new Date(d.data + 'T00:00:00');
        const dayOfWeek = date.getDay(); // 0=Domingo, 1=Segunda, ...
        const mapDayNumber: Record<number, string> = {
          0: 'domingo', 1: 'segunda', 2: 'terca', 3: 'quarta',
          4: 'quinta', 5: 'sexta', 6: 'sabado'
        };
        const diaFromDate = mapDayNumber[dayOfWeek];

        const mapDiasRef: Record<string, string> = {
          'segunda': 'segunda', 'terça': 'terca', 'terca': 'terca',
          'quarta': 'quarta', 'quinta': 'quinta', 'sexta': 'sexta',
          'sábado': 'sabado', 'sabado': 'sabado', 'domingo': 'domingo'
        };
        const keyRefNorm = mapDiasRef[diaRefNorm] || diaRefNorm;

        if (diaFromDate && diaFromDate === keyRefNorm) return true;
      } catch (e) {
        // Ignorar erros de parse de data
      }
    }

    // Tentativa 4: Match por propriedade 'dia' ou 'day_name'
    const propDia = (d as any).dia || (d as any).day_name;
    if (propDia) {
      const diaApiNorm = normalizeString(String(propDia));

      // Mapa estendido
      const mapDias: Record<string, string> = {
        'monday': 'segunda', 'segunda': 'segunda',
        'tuesday': 'terca', 'terca': 'terca', 'terça': 'terca',
        'wednesday': 'quarta', 'quarta': 'quarta',
        'thursday': 'quinta', 'quinta': 'quinta',
        'friday': 'sexta', 'sexta': 'sexta',
        'saturday': 'sabado', 'sabado': 'sabado', 'sábado': 'sabado',
        'sunday': 'domingo', 'domingo': 'domingo'
      };

      const keyApi = mapDias[diaApiNorm] || diaApiNorm;

      const mapDiasRef: Record<string, string> = {
        'segunda': 'segunda', 'terça': 'terca', 'terca': 'terca',
        'quarta': 'quarta', 'quinta': 'quinta', 'sexta': 'sexta',
        'sábado': 'sabado', 'sabado': 'sabado', 'domingo': 'domingo'
      };
      const keyRef = mapDiasRef[diaRefNorm] || diaRefNorm;

      if (keyApi === keyRef) return true;
    }

    return false;
  });
}

/**
 * Obtém o valor de uma métrica tentando diferentes chaves possíveis
 */
export function getMetricValue(obj: any, metricKey: string): number {
  if (!obj) return 0;

  // Mapa de variações de chaves conhecidas
  const keyMap: Record<string, string[]> = {
    'corridas_ofertadas': ['corridas_ofertadas', 'ofertadas', 'total_ofertadas', 'qtd_ofertadas'],
    'corridas_aceitas': ['corridas_aceitas', 'aceitas', 'total_aceitas', 'qtd_aceitas'],
    'corridas_rejeitadas': ['corridas_rejeitadas', 'rejeitadas', 'total_rejeitadas', 'qtd_rejeitadas'],
    'corridas_completadas': ['corridas_completadas', 'completadas', 'total_completadas', 'qtd_completadas'],
    'aderencia_percentual': ['aderencia_percentual', 'aderencia', 'taxa_aderencia', 'percentual_aderencia'],
    'taxa_aceitacao': ['taxa_aceitacao', 'aceitacao', 'percentual_aceitacao'],
    'taxa_completude': ['taxa_completude', 'completude', 'percentual_completude']
  };

  // Tentar a chave exata primeiro
  if (obj[metricKey] !== undefined && obj[metricKey] !== null) {
    return Number(obj[metricKey]);
  }

  // Tentar variações
  const variations = keyMap[metricKey];
  if (variations) {
    for (const key of variations) {
      if (obj[key] !== undefined && obj[key] !== null) {
        return Number(obj[key]);
      }
    }
  }

  return 0;
}

/**
 * Obtém o valor de uma métrica de tempo (string HH:MM:SS ou número) tentando diferentes chaves
 */
export function getTimeMetric(obj: any, metricKey: string): string | number {
  if (!obj) return '0';

  const keyMap: Record<string, string[]> = {
    'horas_planejadas': ['horas_a_entregar', 'horas_planejadas', 'total_horas_planejadas', 'meta_horas', 'horas_meta'],
    'horas_entregues': ['horas_entregues', 'horas_realizadas', 'total_horas_entregues', 'horas_feitas', 'horas_executadas']
  };

  // Tentar a chave exata primeiro
  if (obj[metricKey] !== undefined && obj[metricKey] !== null) {
    return obj[metricKey];
  }

  // Tentar variações
  const variations = keyMap[metricKey];
  if (variations) {
    for (const key of variations) {
      if (obj[key] !== undefined && obj[key] !== null) {
        return obj[key];
      }
    }
  }

  return '0';
}
