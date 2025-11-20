/**
 * Constantes relacionadas ao módulo de Upload
 * Centralizadas para facilitar manutenção e reutilização
 */

/**
 * Mapeamento de colunas do Excel para colunas do banco de dados (Dados de Corridas)
 */
export const COLUMN_MAP: { [key: string]: string } = {
  data_do_periodo: 'data_do_periodo',
  periodo: 'periodo',
  duracao_do_periodo: 'duracao_do_periodo',
  numero_minimo_de_entregadores_regulares_na_escala: 'numero_minimo_de_entregadores_regulares_na_escala',
  tag: 'tag',
  id_da_pessoa_entregadora: 'id_da_pessoa_entregadora',
  pessoa_entregadora: 'pessoa_entregadora',
  praca: 'praca',
  sub_praca: 'sub_praca',
  origem: 'origem',
  tempo_disponivel_escalado: 'tempo_disponivel_escalado',
  tempo_disponivel_absoluto: 'tempo_disponivel_absoluto',
  numero_de_corridas_ofertadas: 'numero_de_corridas_ofertadas',
  numero_de_corridas_aceitas: 'numero_de_corridas_aceitas',
  numero_de_corridas_rejeitadas: 'numero_de_corridas_rejeitadas',
  numero_de_corridas_completadas: 'numero_de_corridas_completadas',
  numero_de_corridas_canceladas_pela_pessoa_entregadora: 'numero_de_corridas_canceladas_pela_pessoa_entregadora',
  numero_de_pedidos_aceitos_e_concluidos: 'numero_de_pedidos_aceitos_e_concluidos',
  soma_das_taxas_das_corridas_aceitas: 'soma_das_taxas_das_corridas_aceitas',
};

/**
 * Mapeamento de colunas do Excel para colunas do banco de dados (Dados de Marketing)
 */
export const MARKETING_COLUMN_MAP: { [key: string]: string } = {
  'Nome': 'nome',
  'Status': 'status',
  'Id do entregador*': 'id_entregador',
  'Região de Atuação': 'regiao_atuacao',
  'Data de Liberação*': 'data_liberacao',
  'SubPraça 2.0 (ABC)': 'sub_praca_abc',
  'Telefone de trabalho': 'telefone_trabalho',
  'Outro número de telefone': 'outro_telefone',
  'Data de Envio': 'data_envio',
  'Rodando': 'rodando',
  'Rodou dia': 'rodou_dia',
  'Responsável': 'responsavel',
};

/**
 * Mapeamento de colunas do Excel para colunas do banco de dados (Valores por Cidade)
 */
export const VALORES_CIDADE_COLUMN_MAP: { [key: string]: string } = {
  'DATA': 'data',
  'ID': 'id_atendente',
  'CIDADE': 'cidade',
  'VALOR': 'valor',
};

/**
 * Tamanho do lote para inserção no banco de dados
 */
export const BATCH_SIZE = 500;

/**
 * Tamanho máximo do arquivo em bytes (50MB)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Número máximo de arquivos permitidos por upload
 */
export const MAX_FILES = 10;

/**
 * Tipos MIME permitidos para upload
 */
export const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
];

/**
 * Extensões de arquivo permitidas
 */
export const ALLOWED_EXTENSIONS = ['xlsx', 'xls', 'xlsm'];

/**
 * Assinaturas de arquivo (magic bytes) para validação
 */
export const EXCEL_SIGNATURES = {
  XLSX: '504b0304', // ZIP signature (XLSX é um arquivo ZIP)
  XLS: 'd0cf11e0a1b11ae1', // OLE2 signature (XLS antigo)
} as const;

