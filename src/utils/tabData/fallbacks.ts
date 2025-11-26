import { safeLog } from '@/lib/errorHandler';
import { supabase } from '@/lib/supabaseClient';
import { ensureDateFilter, validateDateFilter } from '@/utils/queryOptimization';
import { UtrData, EntregadoresData, ValoresEntregador, UtrGeral, UtrPorPraca, Entregador } from '@/types';
import { QUERY_LIMITS } from '@/constants/config';
import type { FilterPayload } from '@/types/filters';

/**
 * Fallback: Busca dados de UTR diretamente da tabela dados_corridas
 */
export async function fetchUtrFallback(payload: FilterPayload): Promise<UtrData | null> {
  try {
    validateDateFilter(payload, 'fetchUtrFallback');
    const safePayload = ensureDateFilter(payload);

    let query = supabase
      .from('dados_corridas')
      .select('tempo_disponivel_escalado, numero_de_corridas_aceitas, praca, sub_praca, origem, periodo');

    if (safePayload.p_semana && safePayload.p_ano) {
      const dataInicio = new Date(safePayload.p_ano, 0, 1);
      const diaSemana = dataInicio.getDay();
      const diasParaSegunda = (diaSemana === 0 ? -6 : 1) - diaSemana;
      const primeiraSegunda = new Date(dataInicio);
      primeiraSegunda.setDate(primeiraSegunda.getDate() + diasParaSegunda);
      const semanaInicio = new Date(primeiraSegunda);
      semanaInicio.setDate(semanaInicio.getDate() + (safePayload.p_semana - 1) * 7);
      const semanaFim = new Date(semanaInicio);
      semanaFim.setDate(semanaFim.getDate() + 6);

      query = query.gte('data_do_periodo', semanaInicio.toISOString().split('T')[0])
        .lte('data_do_periodo', semanaFim.toISOString().split('T')[0]);
    } else if (payload.p_ano) {
      const anoInicio = `${payload.p_ano}-01-01`;
      const anoFim = `${payload.p_ano}-12-31`;
      query = query.gte('data_do_periodo', anoInicio).lte('data_do_periodo', anoFim);
    }

    if (payload.p_data_inicial) {
      query = query.gte('data_do_periodo', payload.p_data_inicial);
    }

    if (payload.p_data_final) {
      query = query.lte('data_do_periodo', payload.p_data_final);
    }

    if (payload.p_praca) {
      const pracas = Array.isArray(payload.p_praca)
        ? payload.p_praca.map((p) => String(p).trim())
        : payload.p_praca.split(',').map((p: string) => p.trim());
      if (pracas.length === 1) {
        query = query.eq('praca', pracas[0]);
      } else {
        query = query.in('praca', pracas);
      }
    }

    if (payload.p_sub_praca) {
      const subPracas = Array.isArray(payload.p_sub_praca)
        ? payload.p_sub_praca.map((p) => String(p).trim())
        : payload.p_sub_praca.split(',').map((p: string) => p.trim());
      if (subPracas.length === 1) {
        query = query.eq('sub_praca', subPracas[0]);
      } else {
        query = query.in('sub_praca', subPracas);
      }
    }

    if (payload.p_origem) {
      const origens = Array.isArray(payload.p_origem)
        ? payload.p_origem.map((o) => String(o).trim())
        : payload.p_origem.split(',').map((o: string) => o.trim());
      if (origens.length === 1) {
        query = query.eq('origem', origens[0]);
      } else {
        query = query.in('origem', origens);
      }
    }

    query = query.limit(QUERY_LIMITS.AGGREGATION_MAX);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        geral: { tempo_horas: 0, corridas: 0, utr: 0 },
        praca: [],
        sub_praca: [],
        origem: [],
        turno: []
      };
    }

    let totalTempoSegundos = 0;
    let totalCorridas = 0;

    for (const row of data) {
      const tempoStr = row.tempo_disponivel_escalado || '0:00:00';
      const [hours, minutes, seconds] = tempoStr.split(':').map(Number);
      totalTempoSegundos += (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
      totalCorridas += Number(row.numero_de_corridas_aceitas) || 0;
    }

    const tempoHoras = totalTempoSegundos / 3600;
    const utrGeral: UtrGeral = {
      tempo_horas: tempoHoras,
      corridas: totalCorridas,
      utr: tempoHoras > 0 ? totalCorridas / tempoHoras : 0
    };

    const pracaMap = new Map<string, { tempo: number; corridas: number }>();
    for (const row of data) {
      const praca = row.praca || 'Não especificada';
      const tempoStr = row.tempo_disponivel_escalado || '0:00:00';
      const [hours, minutes, seconds] = tempoStr.split(':').map(Number);
      const tempo = (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
      const corridas = Number(row.numero_de_corridas_aceitas) || 0;

      if (pracaMap.has(praca)) {
        const existing = pracaMap.get(praca)!;
        existing.tempo += tempo;
        existing.corridas += corridas;
      } else {
        pracaMap.set(praca, { tempo, corridas });
      }
    }

    const utrPorPraca: UtrPorPraca[] = Array.from(pracaMap.entries()).map(([praca, data]) => ({
      praca,
      tempo_horas: data.tempo / 3600,
      corridas: data.corridas,
      utr: data.tempo > 0 ? data.corridas / (data.tempo / 3600) : 0
    }));

    return {
      geral: utrGeral,
      praca: utrPorPraca,
      sub_praca: [],
      origem: [],
      turno: []
    };
  } catch (error) {
    safeLog.error('Erro no fallback fetchUtrFallback:', error);
    throw error;
  }
}

/**
 * Fallback: Busca dados de entregadores diretamente da tabela dados_corridas
 */
export async function fetchEntregadoresFallback(payload: FilterPayload): Promise<EntregadoresData> {
  try {
    validateDateFilter(payload, 'fetchEntregadoresFallback');
    const safePayload = ensureDateFilter(payload);

    // 1. Buscar IDs distintos de entregadores que correspondem aos filtros
    // Isso é muito mais leve do que buscar todas as corridas
    let entregadoresQuery = supabase
      .from('dados_corridas')
      .select('id_da_pessoa_entregadora, pessoa_entregadora')
      .not('id_da_pessoa_entregadora', 'is', null);

    // Aplicar filtros na query de entregadores
    if (safePayload.p_semana && safePayload.p_ano) {
      const dataInicio = new Date(safePayload.p_ano, 0, 1);
      const diaSemana = dataInicio.getDay();
      const diasParaSegunda = (diaSemana === 0 ? -6 : 1) - diaSemana;
      const primeiraSegunda = new Date(dataInicio);
      primeiraSegunda.setDate(primeiraSegunda.getDate() + diasParaSegunda);
      const semanaInicio = new Date(primeiraSegunda);
      semanaInicio.setDate(semanaInicio.getDate() + (safePayload.p_semana - 1) * 7);
      const semanaFim = new Date(semanaInicio);
      semanaFim.setDate(semanaFim.getDate() + 6);

      entregadoresQuery = entregadoresQuery.gte('data_do_periodo', semanaInicio.toISOString().split('T')[0])
        .lte('data_do_periodo', semanaFim.toISOString().split('T')[0]);
    } else if (safePayload.p_ano) {
      const anoInicio = `${safePayload.p_ano}-01-01`;
      const anoFim = `${safePayload.p_ano}-12-31`;
      entregadoresQuery = entregadoresQuery.gte('data_do_periodo', anoInicio).lte('data_do_periodo', anoFim);
    }

    if (safePayload.p_data_inicial) {
      entregadoresQuery = entregadoresQuery.gte('data_do_periodo', safePayload.p_data_inicial);
    }

    if (safePayload.p_data_final) {
      entregadoresQuery = entregadoresQuery.lte('data_do_periodo', safePayload.p_data_final);
    }

    if (safePayload.p_praca) {
      const pracas = typeof safePayload.p_praca === 'string'
        ? safePayload.p_praca.split(',').map((p: string) => p.trim())
        : [String(safePayload.p_praca).trim()];
      if (pracas.length === 1) {
        entregadoresQuery = entregadoresQuery.eq('praca', pracas[0]);
      } else {
        entregadoresQuery = entregadoresQuery.in('praca', pracas);
      }
    }

    if (safePayload.p_sub_praca) {
      const subPracas = typeof safePayload.p_sub_praca === 'string'
        ? safePayload.p_sub_praca.split(',').map((p: string) => p.trim())
        : [String(safePayload.p_sub_praca).trim()];
      if (subPracas.length === 1) {
        entregadoresQuery = entregadoresQuery.eq('sub_praca', subPracas[0]);
      } else {
        entregadoresQuery = entregadoresQuery.in('sub_praca', subPracas);
      }
    }

    if (safePayload.p_origem) {
      const origens = typeof safePayload.p_origem === 'string'
        ? safePayload.p_origem.split(',').map((o: string) => o.trim())
        : [String(safePayload.p_origem).trim()];
      if (origens.length === 1) {
        entregadoresQuery = entregadoresQuery.eq('origem', origens[0]);
      } else {
        entregadoresQuery = entregadoresQuery.in('origem', origens);
      }
    }

    // Usar limit alto para IDs distintos (mas não absurdo)
    // Como não temos DISTINCT ON fácil via client sem raw SQL complexo, 
    // vamos buscar normal e dedublicar no cliente.
    // O ideal seria .select('...', { count: 'exact', head: false }).range(0, 5000)
    // Mas vamos confiar no limit
    entregadoresQuery = entregadoresQuery.limit(5000);

    const { data: rawEntregadores, error: entregadoresError } = await entregadoresQuery;

    if (entregadoresError) throw entregadoresError;

    if (!rawEntregadores || rawEntregadores.length === 0) {
      return { entregadores: [], total: 0 };
    }

    // Deduplicar entregadores
    const uniqueEntregadores = new Map<string, string>();
    rawEntregadores.forEach(r => {
      if (r.id_da_pessoa_entregadora) {
        uniqueEntregadores.set(r.id_da_pessoa_entregadora, r.pessoa_entregadora || r.id_da_pessoa_entregadora);
      }
    });

    const entregadoresIds = Array.from(uniqueEntregadores.keys());

    if (entregadoresIds.length === 0) {
      return { entregadores: [], total: 0 };
    }

    // 2. Buscar estatísticas em lotes
    const BATCH_SIZE = 50;
    const entregadoresMap = new Map<string, {
      id_entregador: string;
      nome_entregador: string;
      corridas_ofertadas: number;
      corridas_aceitas: number;
      corridas_rejeitadas: number;
      corridas_completadas: number;
      tempo_total: number;
    }>();

    // Inicializar mapa
    entregadoresIds.forEach(id => {
      entregadoresMap.set(id, {
        id_entregador: id,
        nome_entregador: uniqueEntregadores.get(id) || id,
        corridas_ofertadas: 0,
        corridas_aceitas: 0,
        corridas_rejeitadas: 0,
        corridas_completadas: 0,
        tempo_total: 0
      });
    });

    for (let i = 0; i < entregadoresIds.length; i += BATCH_SIZE) {
      const batchIds = entregadoresIds.slice(i, i + BATCH_SIZE);

      let statsQuery = supabase
        .from('dados_corridas')
        .select('id_da_pessoa_entregadora, numero_de_corridas_ofertadas, numero_de_corridas_aceitas, numero_de_corridas_rejeitadas, numero_de_corridas_completadas, tempo_disponivel_escalado')
        .in('id_da_pessoa_entregadora', batchIds);

      // Reaplicar filtros de data para garantir estatísticas corretas
      if (safePayload.p_semana && safePayload.p_ano) {
        // ... (mesma lógica de data)
        const dataInicio = new Date(safePayload.p_ano, 0, 1);
        const diaSemana = dataInicio.getDay();
        const diasParaSegunda = (diaSemana === 0 ? -6 : 1) - diaSemana;
        const primeiraSegunda = new Date(dataInicio);
        primeiraSegunda.setDate(primeiraSegunda.getDate() + diasParaSegunda);
        const semanaInicio = new Date(primeiraSegunda);
        semanaInicio.setDate(semanaInicio.getDate() + (safePayload.p_semana - 1) * 7);
        const semanaFim = new Date(semanaInicio);
        semanaFim.setDate(semanaFim.getDate() + 6);

        statsQuery = statsQuery.gte('data_do_periodo', semanaInicio.toISOString().split('T')[0])
          .lte('data_do_periodo', semanaFim.toISOString().split('T')[0]);
      } else if (safePayload.p_ano) {
        const anoInicio = `${safePayload.p_ano}-01-01`;
        const anoFim = `${safePayload.p_ano}-12-31`;
        statsQuery = statsQuery.gte('data_do_periodo', anoInicio).lte('data_do_periodo', anoFim);
      }

      if (safePayload.p_data_inicial) {
        statsQuery = statsQuery.gte('data_do_periodo', safePayload.p_data_inicial);
      }

      if (safePayload.p_data_final) {
        statsQuery = statsQuery.lte('data_do_periodo', safePayload.p_data_final);
      }

      // Limite alto por lote
      statsQuery = statsQuery.limit(QUERY_LIMITS.AGGREGATION_MAX);

      const { data: batchData, error: batchError } = await statsQuery;

      if (batchError) {
        safeLog.error(`Erro ao buscar lote ${i} de estatísticas:`, batchError);
        continue;
      }

      if (batchData) {
        for (const row of batchData) {
          const id = row.id_da_pessoa_entregadora;
          if (!id || !entregadoresMap.has(id)) continue;

          const existing = entregadoresMap.get(id)!;
          existing.corridas_ofertadas += Number(row.numero_de_corridas_ofertadas) || 0;
          existing.corridas_aceitas += Number(row.numero_de_corridas_aceitas) || 0;
          existing.corridas_rejeitadas += Number(row.numero_de_corridas_rejeitadas) || 0;
          existing.corridas_completadas += Number(row.numero_de_corridas_completadas) || 0;

          const tempoStr = row.tempo_disponivel_escalado || '0:00:00';
          const [hours, minutes, seconds] = tempoStr.split(':').map(Number);
          existing.tempo_total += (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
        }
      }
    }

    const entregadores: Entregador[] = Array.from(entregadoresMap.values()).map(item => {
      const tempoHoras = item.tempo_total / 3600;
      const horasEsperadas = tempoHoras;
      const horasEntregues = item.corridas_completadas > 0 ? (item.corridas_completadas / (item.corridas_aceitas || 1)) * tempoHoras : 0;
      const aderencia = horasEsperadas > 0 ? (horasEntregues / horasEsperadas) * 100 : 0;
      const rejeicao = item.corridas_ofertadas > 0 ? (item.corridas_rejeitadas / item.corridas_ofertadas) * 100 : 0;

      return {
        id_entregador: item.id_entregador,
        nome_entregador: item.nome_entregador,
        corridas_ofertadas: item.corridas_ofertadas,
        corridas_aceitas: item.corridas_aceitas,
        corridas_rejeitadas: item.corridas_rejeitadas,
        corridas_completadas: item.corridas_completadas,
        aderencia_percentual: Math.round(aderencia * 100) / 100,
        rejeicao_percentual: Math.round(rejeicao * 100) / 100
      };
    });

    return {
      entregadores,
      total: entregadores.length
    };
  } catch (error) {
    safeLog.error('Erro no fallback fetchEntregadoresFallback:', error);
    throw error;
  }
}

/**
 * Fallback: Busca dados de valores diretamente da tabela dados_corridas
 */
export async function fetchValoresFallback(payload: FilterPayload): Promise<ValoresEntregador[]> {
  try {
    validateDateFilter(payload, 'fetchValoresFallback');
    const safePayload = ensureDateFilter(payload);

    let query = supabase
      .from('dados_corridas')
      .select('id_da_pessoa_entregadora, pessoa_entregadora, soma_das_taxas_das_corridas_aceitas, numero_de_corridas_aceitas, data_do_periodo, praca, sub_praca, origem');

    if (safePayload.p_semana && safePayload.p_ano) {
      const dataInicio = new Date(safePayload.p_ano, 0, 1);
      const diaSemana = dataInicio.getDay();
      const diasParaSegunda = (diaSemana === 0 ? -6 : 1) - diaSemana;
      const primeiraSegunda = new Date(dataInicio);
      primeiraSegunda.setDate(primeiraSegunda.getDate() + diasParaSegunda);
      const semanaInicio = new Date(primeiraSegunda);
      semanaInicio.setDate(semanaInicio.getDate() + (safePayload.p_semana - 1) * 7);
      const semanaFim = new Date(semanaInicio);
      semanaFim.setDate(semanaFim.getDate() + 6);

      query = query.gte('data_do_periodo', semanaInicio.toISOString().split('T')[0])
        .lte('data_do_periodo', semanaFim.toISOString().split('T')[0]);
    } else if (safePayload.p_ano) {
      const anoInicio = `${safePayload.p_ano}-01-01`;
      const anoFim = `${safePayload.p_ano}-12-31`;
      query = query.gte('data_do_periodo', anoInicio).lte('data_do_periodo', anoFim);
    }

    if (safePayload.p_data_inicial) {
      query = query.gte('data_do_periodo', safePayload.p_data_inicial);
    }

    if (safePayload.p_data_final) {
      query = query.lte('data_do_periodo', safePayload.p_data_final);
    }

    if (safePayload.p_praca) {
      const pracas = typeof safePayload.p_praca === 'string'
        ? safePayload.p_praca.split(',').map((p: string) => p.trim())
        : [String(safePayload.p_praca).trim()];
      if (pracas.length === 1) {
        query = query.eq('praca', pracas[0]);
      } else {
        query = query.in('praca', pracas);
      }
    }

    if (safePayload.p_sub_praca) {
      const subPracas = typeof safePayload.p_sub_praca === 'string'
        ? safePayload.p_sub_praca.split(',').map((p: string) => p.trim())
        : [String(safePayload.p_sub_praca).trim()];
      if (subPracas.length === 1) {
        query = query.eq('sub_praca', subPracas[0]);
      } else {
        query = query.in('sub_praca', subPracas);
      }
    }

    if (safePayload.p_origem) {
      const origens = typeof safePayload.p_origem === 'string'
        ? safePayload.p_origem.split(',').map((o: string) => o.trim())
        : [String(safePayload.p_origem).trim()];
      if (origens.length === 1) {
        query = query.eq('origem', origens[0]);
      } else {
        query = query.in('origem', origens);
      }
    }

    query = query.limit(QUERY_LIMITS.AGGREGATION_MAX);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    const valoresMap = new Map<string, {
      id_entregador: string;
      nome_entregador: string;
      total_taxas: number;
      numero_corridas_aceitas: number;
    }>();

    for (const row of data) {
      const id = row.id_da_pessoa_entregadora;
      if (!id) continue;

      const nome = row.pessoa_entregadora || id;
      const taxas = Number(row.soma_das_taxas_das_corridas_aceitas) || 0;
      const corridas = Number(row.numero_de_corridas_aceitas) || 0;

      if (valoresMap.has(id)) {
        const existing = valoresMap.get(id)!;
        existing.total_taxas += taxas;
        existing.numero_corridas_aceitas += corridas;
      } else {
        valoresMap.set(id, {
          id_entregador: id,
          nome_entregador: nome,
          total_taxas: taxas,
          numero_corridas_aceitas: corridas,
        });
      }
    }

    const valores: ValoresEntregador[] = Array.from(valoresMap.values()).map(item => ({
      id_entregador: item.id_entregador,
      nome_entregador: item.nome_entregador,
      total_taxas: item.total_taxas,
      numero_corridas_aceitas: item.numero_corridas_aceitas,
      taxa_media: item.numero_corridas_aceitas > 0
        ? item.total_taxas / item.numero_corridas_aceitas
        : 0,
    }));

    return valores;
  } catch (error) {
    safeLog.error('Erro no fallback fetchValoresFallback:', error);
    throw error;
  }
}

