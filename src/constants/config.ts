/**
 * Constantes de configuração centralizadas
 * Evita valores "mágicos" espalhados pelo código
 */

/**
 * Timeouts para requisições RPC (em milissegundos)
 */
export const RPC_TIMEOUTS = {
  /** Timeout padrão para requisições RPC */
  DEFAULT: 30000, // 30 segundos
  /** Timeout para requisições rápidas (queries simples) */
  FAST: 10000, // 10 segundos
  /** Timeout para requisições médias (queries moderadas) */
  MEDIUM: 20000, // 20 segundos
  /** Timeout para requisições longas (processamento pesado) */
  LONG: 60000, // 60 segundos
} as const;

/**
 * Delays para debounce e retry (em milissegundos)
 */
export const DELAYS = {
  /** Debounce padrão para inputs e filtros */
  DEBOUNCE: 100, // 100ms
  /** Debounce para mudanças de tab */
  TAB_CHANGE: 100, // 100ms
  /** Delay para retry de erros 500 */
  RETRY_500: 2000, // 2 segundos
  /** Delay para retry de rate limit */
  RETRY_RATE_LIMIT: 5000, // 5 segundos
  /** Delay para retry de entregadores (erro 500) */
  RETRY_ENTREGADORES: 3000, // 3 segundos
  /** Delay para refresh assíncrono */
  REFRESH_ASYNC: 1000, // 1 segundo
  /** Delay para evolução (evitar requisições muito rápidas) */
  EVOLUCAO: 300, // 300ms
  /** Delay para proteção contra cliques rápidos em tabs */
  TAB_CHANGE_PROTECTION: 800, // 800ms
} as const;

/**
 * Configurações de cache (em milissegundos)
 */
export const CACHE = {
  /** TTL padrão para cache de dados de tab */
  TAB_DATA_TTL: 180000, // 180 segundos (3 minutos)
  /** TTL para cache de evolução */
  EVOLUCAO_TTL: 30000, // 30 segundos
} as const;

/**
 * Configurações de rate limiting local
 */
export const RATE_LIMIT = {
  /** Tempo mínimo entre requisições para a mesma tab (ms) */
  MIN_REQUEST_INTERVAL: 300, // 300ms
  /** Tempo para limpar entradas antigas da fila (ms) */
  QUEUE_CLEANUP_INTERVAL: 3000, // 3 segundos
  /** Limite máximo de entradas para limpeza por vez */
  MAX_CLEANUP_ENTRIES: 50,
} as const;

/**
 * Tamanhos de lotes para operações em batch
 */
export const BATCH_SIZES = {
  /** Tamanho padrão de lote para inserção no banco */
  INSERT: 500,
  /** Tamanho de lote para deleção */
  DELETE: 500,
} as const;

/**
 * Limites de arrays e strings
 */
export const LIMITS = {
  /** Tamanho máximo de arrays em filtros */
  MAX_ARRAY_SIZE: 50,
  /** Tamanho máximo de strings */
  MAX_STRING_LENGTH: 100,
  /** Tamanho máximo de praça */
  MAX_PRACA_LENGTH: 100,
  /** Limite de caracteres para preview de dados */
  PREVIEW_LENGTH: 500,
} as const;

/**
 * Configurações de validação
 */
export const VALIDATION = {
  /** Ano mínimo válido */
  MIN_YEAR: 2000,
  /** Ano máximo válido */
  MAX_YEAR: 2100,
  /** Semana mínima válida */
  MIN_WEEK: 1,
  /** Semana máxima válida */
  MAX_WEEK: 53,
  /** Data mínima permitida */
  MIN_DATE: '2020-01-01',
} as const;

