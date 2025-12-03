/**
 * Tipos relacionados a Marketing
 */

export interface DadosMarketing {
  id: number;
  nome: string | null;
  status: string | null;
  id_entregador: string | null; // Pode ser null
  regiao_atuacao: string | null;
  data_liberacao: string | null; // DATE format (YYYY-MM-DD), pode ser null
  sub_praca_abc: string | null;
  telefone_trabalho: string | null;
  outro_telefone: string | null;
  data_envio: string | null; // DATE format (YYYY-MM-DD)
  rodando: string | null; // "Sim" ou "Não"
  rodou_dia: string | null; // DATE format (YYYY-MM-DD)
  responsavel: string | null; // Nome do atendente responsável
  created_at: string;
  updated_at: string;
}

export interface MarketingDateFilter {
  dataInicial: string | null; // YYYY-MM-DD
  dataFinal: string | null; // YYYY-MM-DD
}

export interface MarketingFilters {
  filtroLiberacao: MarketingDateFilter;
  filtroEnviados: MarketingDateFilter;
  filtroRodouDia: MarketingDateFilter;
  filtroDataInicio: MarketingDateFilter;
}

export interface MarketingCityData {
  cidade: string;
  enviado: number;
  liberado: number;
  rodandoInicio: number;
}

export interface MarketingTotals {
  criado: number; // Total de registros
  enviado: number; // Contagem com filtro de Enviados
  liberado: number; // Contagem com filtro de Liberação
  rodandoInicio: number; // Contagem com filtro de Rodou Dia
}

export interface EntregadorMarketing {
  id_entregador: string;
  nome: string;
  total_ofertadas: number;
  total_aceitas: number;
  total_completadas: number;
  total_rejeitadas: number;
  total_segundos: number;
  ultima_data: string | null;
  dias_sem_rodar: number | null;
  regiao_atuacao: string | null;
}

export interface AtendenteCidadeData {
  atendente: string;
  cidade: string;
  enviado: number;
  liberado: number;
  custoPorLiberado?: number;
  quantidadeLiberados?: number;
  valorTotal?: number;
}

export interface DadosValoresCidade {
  id: number;
  data: string; // DATE format (YYYY-MM-DD)
  id_atendente: string;
  cidade: string;
  valor: number;
  created_at: string;
  updated_at: string;
}

export interface ValoresCidadeDateFilter {
  dataInicial: string | null; // YYYY-MM-DD
  dataFinal: string | null; // YYYY-MM-DD
}

export interface ValoresCidadePorCidade {
  cidade: string;
  valor_total: number;
  custo_por_liberado?: number;
  quantidade_liberados?: number;
  valor_total_enviados?: number; // Valor total no período de Enviados para calcular faltam
}

// Mapeamento de IDs de atendentes para nomes
export const MAPEAMENTO_ATENDENTES: { [key: string]: string } = {
  '6905': 'Carol',
  '4182': 'Mellisa',
  '6976': 'Beatriz',
  '5447': 'Fernanda',
};

