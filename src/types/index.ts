export interface Totals {
  ofertadas: number;
  aceitas: number;
  rejeitadas: number;
  completadas: number;
}

export interface AderenciaSemanal {
  semana: string;
  horas_a_entregar: string;
  horas_entregues: string;
  aderencia_percentual: number;
}

export interface AderenciaDia {
  dia_iso: number;
  dia_da_semana: string;
  horas_a_entregar: string;
  horas_entregues: string;
  aderencia_percentual: number;
  corridas_ofertadas?: number;
  corridas_aceitas?: number;
  corridas_rejeitadas?: number;
  corridas_completadas?: number;
  taxa_aceitacao?: number;
  taxa_completude?: number;
}

export interface AderenciaTurno {
  periodo: string;
  horas_a_entregar: string;
  horas_entregues: string;
  aderencia_percentual: number;
  corridas_ofertadas?: number;
  corridas_aceitas?: number;
  corridas_rejeitadas?: number;
  corridas_completadas?: number;
  taxa_aceitacao?: number;
  taxa_completude?: number;
}

export interface AderenciaSubPraca {
  sub_praca: string;
  horas_a_entregar: string;
  horas_entregues: string;
  aderencia_percentual: number;
  corridas_ofertadas?: number;
  corridas_aceitas?: number;
  corridas_rejeitadas?: number;
  corridas_completadas?: number;
  taxa_aceitacao?: number;
  taxa_completude?: number;
}

export interface AderenciaOrigem {
  origem: string;
  horas_a_entregar: string;
  horas_entregues: string;
  aderencia_percentual: number;
  corridas_ofertadas?: number;
  corridas_aceitas?: number;
  corridas_rejeitadas?: number;
  corridas_completadas?: number;
  taxa_aceitacao?: number;
  taxa_completude?: number;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface Filters {
  ano: number | null;
  semana: number | null;
  praca: string | null;
  subPraca: string | null;
  origem: string | null;
  turno: string | null;
  subPracas: string[];
  origens: string[];
  turnos: string[];
  semanas: number[];
  // Filtro de intervalo de datas
  filtroModo: 'ano_semana' | 'intervalo';
  dataInicial: string | null; // Formato: YYYY-MM-DD
  dataFinal: string | null; // Formato: YYYY-MM-DD
}

export interface DimensoesDashboard {
  anos: number[];
  semanas: string[];
  pracas: string[];
  sub_pracas: string[];
  origens: string[];
  turnos?: string[];
}

export interface DashboardResumoData {
  totais: {
    corridas_ofertadas: number;
    corridas_aceitas: number;
    corridas_rejeitadas: number;
    corridas_completadas: number;
  };
  semanal: AderenciaSemanal[];
  dia: AderenciaDia[];
  turno: AderenciaTurno[];
  sub_praca: AderenciaSubPraca[];
  origem: AderenciaOrigem[];
  dimensoes: DimensoesDashboard;
}

export interface UtrGeral {
  tempo_horas: number;
  corridas: number;
  utr: number;
}

export interface UtrPorPraca {
  praca: string;
  tempo_horas: number;
  corridas: number;
  utr: number;
}

export interface UtrPorSubPraca {
  sub_praca: string;
  tempo_horas: number;
  corridas: number;
  utr: number;
}

export interface UtrPorOrigem {
  origem: string;
  tempo_horas: number;
  corridas: number;
  utr: number;
}

export interface UtrPorTurno {
  turno?: string;
  periodo?: string;
  tempo_horas: number;
  corridas: number;
  utr: number;
}

export interface UtrData {
  geral: UtrGeral;
  praca?: UtrPorPraca[];
  sub_praca?: UtrPorSubPraca[];
  origem?: UtrPorOrigem[];
  turno?: UtrPorTurno[];
  por_praca?: UtrPorPraca[];
  por_sub_praca?: UtrPorSubPraca[];
  por_origem?: UtrPorOrigem[];
  por_turno?: UtrPorTurno[];
}

export interface Entregador {
  id_entregador: string;
  nome_entregador: string;
  corridas_ofertadas: number;
  corridas_aceitas: number;
  corridas_rejeitadas: number;
  corridas_completadas: number;
  aderencia_percentual: number;
  rejeicao_percentual: number;
}

export interface EntregadoresData {
  entregadores: Entregador[];
  total: number;
}

export interface ValoresEntregador {
  id_entregador: string;
  nome_entregador: string;
  total_taxas: number;
  numero_corridas_aceitas: number;
  taxa_media: number;
}

export interface ValoresData {
  valores: ValoresEntregador[];
  total_geral: number;
}

export interface UsuarioOnline {
  user_id: string;
  email: string;
  nome: string | null;
  pracas: string[];
  ultima_acao: string;
  aba_atual: string | null;
  filtros: any;
  ultima_atividade: string;
  segundos_inativo: number;
  acoes_ultima_hora: number;
  is_active?: boolean;
}

export interface MonitoramentoData {
  success: boolean;
  total_online: number;
  usuarios: UsuarioOnline[];
}

export interface EvolucaoMensal {
  ano: number;
  mes: number;
  mes_nome: string;
  total_corridas?: number;
  corridas_completadas?: number;
  corridas_ofertadas?: number;
  corridas_aceitas?: number;
  corridas_rejeitadas?: number;
  total_segundos: number;
}

export interface EvolucaoSemanal {
  ano: number;
  semana: number;
  semana_label: string;
  total_corridas?: number;
  corridas_completadas?: number;
  corridas_ofertadas?: number;
  corridas_aceitas?: number;
  corridas_rejeitadas?: number;
  total_segundos: number;
}

export interface UtrSemanal {
  ano: number;
  semana: number;
  semana_label: string;
  tempo_horas: number;
  total_corridas: number;
  utr: number;
}

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
  created_at: string;
  updated_at: string;
}