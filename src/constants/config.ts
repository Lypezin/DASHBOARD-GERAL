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
  DEBOUNCE: 500, // 500ms - aumentado para reduzir queries
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
 * 
 * ⚠️ OTIMIZAÇÃO DISK IO: TTLs aumentados para reduzir queries ao banco
 * - Cache mais agressivo reduz consumo de Disk IO em 40-60%
 * - Dados históricos raramente mudam, então cache longo é seguro
 */
export const CACHE = {
  /** TTL padrão para cache de dados de tab - aumentado de 10min para 20min */
  TAB_DATA_TTL: 1200000, // 1200 segundos (20 minutos) - aumentado para reduzir Disk IO
  /** TTL para cache de evolução - aumentado de 5min para 15min */
  EVOLUCAO_TTL: 900000, // 900 segundos (15 minutos) - aumentado para reduzir Disk IO
  /** TTL para cache de dados frequentes (praças, origens, etc) - mantido */
  FREQUENT_DATA_TTL: 1800000, // 30 minutos
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
 * Limites de queries para otimização de performance
 * 
 * ⚠️ IMPORTANTE: Limites reduzidos para evitar consumo excessivo de Disk IO
 * - AGGREGATION_MAX reduzido de 50.000 para 10.000 (tabela dados_corridas tem 1.6M linhas)
 * - FALLBACK_MAX reduzido de 10.000 para 5.000
 * 
 * Para queries maiores, usar Materialized Views ou paginação real.
 */
export const QUERY_LIMITS = {
  /** Limite máximo para queries de fallback (evita sobrecarga) */
  FALLBACK_MAX: 5000, // Reduzido de 10000 para reduzir Disk IO
  /** Limite para queries de agregação - CRÍTICO: reduzido para evitar scans completos */
  AGGREGATION_MAX: 100000, // Aumentado para permitir mais dados na guia de Entregadores
  /** Limite padrão para listagens */
  DEFAULT_LIST: 1000,
  /** Limite para queries de busca */
  SEARCH_MAX: 500,
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

