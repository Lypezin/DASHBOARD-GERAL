
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
